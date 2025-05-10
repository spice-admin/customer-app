// supabase/functions/send-customer-otp/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  
  try {
    const { phoneNumber } = await req.json(); // e.g., "+12345678900"
    if (!phoneNumber) {
      throw new Error("Phone number is required.");
    }
    // Basic validation for E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        throw new Error("Invalid phone number format. Include country code e.g. +1XXXYYYZZZZ");
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check if user exists and if phone is already verified
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_phone_verified") // Only select what's needed
      .eq("phone", phoneNumber)
      .single();

    if (profileError || !profile) {
      console.warn(`send-otp: Profile not found for ${phoneNumber} or error:`, profileError);
      return new Response(JSON.stringify({ error: "User not found or not registered with this phone number." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Not Found
      });
    }

    if (profile.is_phone_verified) {
      return new Response(JSON.stringify({ error: "This phone number is already verified." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400, // Bad Request
      });
    }

    // 2. Start verification with Twilio Verify
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioVerifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      console.error("Twilio Verify environment variables are not configured correctly.");
      throw new Error("OTP service configuration error.");
    }

    const twilioVerifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/Verifications`;

    const twilioResponse = await fetch(twilioVerifyUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Channel: "sms", // Or "call"
        // You can add Locale, CustomCode, etc. here if needed by your Verify Service settings
      }),
    });

    const twilioResponseData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio Verify API error (send):", twilioResponseData);
      throw new Error(twilioResponseData.message || "Failed to send OTP via Twilio Verify.");
    }

    // Twilio Verify success usually has status 'pending'
    console.log(`Twilio Verify OTP request sent to ${phoneNumber}, status: ${twilioResponseData.status}`);
    return new Response(JSON.stringify({ message: "OTP has been sent to your phone number." , twilioStatus: twilioResponseData.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("send-customer-otp error:", err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: (err.status_code || 500), // Use err.status_code if available, else default 500
    });
  }
});