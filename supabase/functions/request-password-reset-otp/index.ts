// supabase/functions/request-password-reset-otp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Use latest v2
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have this from previous setups

// Ensure your Twilio details are in environment variables (Supabase secrets)
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      throw new Error("Twilio environment variables are not set.");
    }

    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: "Phone number is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create a Supabase client with SERVICE ROLE KEY to query profiles
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find user by phone number in the 'profiles' table
    // Assuming 'phone' in profiles is unique and matches the format of phoneNumber
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, is_phone_verified') // Assuming 'user_id' in profiles is the auth.users.id
      .eq('phone', phoneNumber)
      .single();

    if (profileError || !profile) {
      console.warn('Profile not found or error:', profileError?.message);
      // Generic message to avoid leaking user existence
      return new Response(JSON.stringify({ error: "Could not process request for this phone number." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Or 400
      });
    }

    // Optional: Check if phone is verified for password reset purposes
    if (!profile.is_phone_verified) {
        return new Response(JSON.stringify({ error: "Phone number is not verified. Cannot reset password." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
        });
    }

    // 2. Send OTP using Twilio Verify
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Channel: "sms", // or "call"
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok || twilioResult.status === "failed" || twilioResult.status === "canceled") {
      console.error("Twilio Verify error:", twilioResult);
      throw new Error(twilioResult.message || "Failed to send OTP via Twilio Verify.");
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in request-password-reset-otp:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});