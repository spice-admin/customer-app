// supabase/functions/verify-customer-otp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber, otpCode } = await req.json();
    if (!phoneNumber || !otpCode) {
      throw new Error("Phone number and OTP code are required.");
    }
    if (otpCode.length < 4 || otpCode.length > 10 || !/^\d+$/.test(otpCode)) { // Twilio OTPs are typically 4-10 digits
        throw new Error("Invalid OTP format.");
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check verification with Twilio Verify
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioVerifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      console.error("Twilio Verify environment variables are not configured correctly.");
      throw new Error("OTP service configuration error.");
    }

    const twilioCheckUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`;

    const twilioResponse = await fetch(twilioCheckUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Code: otpCode,
      }),
    });

    const twilioResponseData = await twilioResponse.json();

    if (!twilioResponse.ok || twilioResponseData.status !== "approved") {
      console.warn("Twilio Verify check failed or not approved:", twilioResponseData);
      // Twilio might send a 404 if the verification SID doesn't exist or code is wrong
      let errorMessage = "Invalid or expired OTP. Please try again.";
      if (twilioResponseData && twilioResponseData.message) {
        errorMessage = twilioResponseData.message;
      } else if (twilioResponseData.status === "pending") {
        errorMessage = "OTP is still pending or incorrect.";
      } else if (twilioResponseData.status === "canceled") {
        errorMessage = "OTP verification was canceled or expired.";
      }
      return new Response(JSON.stringify({ error: errorMessage, twilio_status: twilioResponseData.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, // Bad Request (e.g., invalid OTP)
      });
    }

    // 2. OTP is valid and approved! Update profile and auth.users
    // First, get the user_id from the profiles table based on the phone number.
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id") // Select only user_id
        .eq("phone", phoneNumber)
        .single();

    if (profileError || !profile) {
        console.error("verify-otp: Profile not found for phone number after Twilio approval:", phoneNumber, profileError);
        // This is an inconsistent state, as send-otp should have found them.
        throw new Error("User profile not found after OTP approval. Please contact support.");
    }
    const userId = profile.id;

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ is_phone_verified: true })
      .eq("id", userId);

    if (profileUpdateError) {
        console.error("verify-otp: Error updating profile is_phone_verified:", profileUpdateError);
        throw profileUpdateError; // Let the main catch block handle it
    }

    const { error: authUserUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { phone_confirmed_at: new Date().toISOString() }
    );

    if (authUserUpdateError) {
        // This is less critical if profile update succeeded, but good to log.
        console.warn("verify-otp: Failed to update auth.users.phone_confirmed_at:", authUserUpdateError);
    }

    console.log(`Phone number ${phoneNumber} for user ${userId} verified successfully.`);
    return new Response(JSON.stringify({ message: "Phone number verified successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("verify-customer-otp error:", err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: (err.status_code || 500),
    });
  }
});