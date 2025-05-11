// supabase/functions/verify-otp-for-password-reset/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Twilio Verify credentials from Supabase secrets
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

// Helper function to convert ArrayBuffer to hex string (for hashed token)
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      throw new Error("Twilio environment variables are not set.");
    }

    const { phoneNumber, otpCode } = await req.json();
    if (!phoneNumber || !otpCode) {
      return new Response(JSON.stringify({ error: "Phone number and OTP code are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 1. Verify OTP with Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Code: otpCode,
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok || twilioResult.status !== "approved") {
      console.warn("Twilio OTP verification failed:", twilioResult);
      let errorMessage = "Invalid or expired OTP. Please try again.";
      if (twilioResult.message) {
        // You might want to be more specific for certain Twilio errors if safe
        // e.g. if (twilioResult.code === 60202 // Max check attempts reached) {}
      }
      return new Response(JSON.stringify({ error: errorMessage, twilio_status: twilioResult.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, // Bad request (invalid OTP)
      });
    }

    // 2. OTP is approved, now get user_id from profiles
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id') // Ensure your 'profiles' table has 'user_id' referencing auth.users.id
      .eq('phone', phoneNumber)
      .single();

    if (profileError || !profile || !profile.user_id) {
      console.error('Profile not found for phone or missing user_id:', phoneNumber, profileError);
      // This shouldn't happen if request-otp succeeded, but good to check
      return new Response(JSON.stringify({ error: "User profile not found for this phone number." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
    const userId = profile.user_id;

    // 3. Generate a secure reset token (plaintext and hashed)
    const plaintextToken = crypto.randomUUID(); // Simple, strong enough for short-lived token
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintextToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashedToken = bufferToHex(hashBuffer);

    // 4. Store hashed token, user_id, and expiry in `password_reset_attempts`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes expiry

    // Optional: Clean up any previous, non-expired tokens for this user to allow only one active attempt
    const { error: deleteOldError } = await supabaseAdmin
      .from('password_reset_attempts')
      .delete()
      .eq('user_id', userId);

    if (deleteOldError) {
        console.warn("Failed to delete old password reset attempts for user:", userId, deleteOldError.message);
        // Non-critical, proceed with inserting new token
    }

    const { error: insertError } = await supabaseAdmin
      .from('password_reset_attempts')
      .insert({
        user_id: userId,
        hashed_token: hashedToken,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error inserting password reset token:', insertError);
      throw new Error("Could not save password reset request. Please try again.");
    }

    // 5. Return the PLAINTEXT token to the client
    return new Response(JSON.stringify({
      success: true,
      message: "OTP verified successfully.",
      resetToken: plaintextToken, // Send the original, unhashed token
      phoneNumber: phoneNumber
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in verify-otp-for-password-reset:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});