// supabase/functions/reset-password-with-custom-token/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return new Response(JSON.stringify({ error: "Reset token and new password are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (newPassword.length < 6) { // Or your Supabase password policy minimum
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters long." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }

    // Hash the received plaintext token to match the stored hashed token
    const encoder = new TextEncoder();
    const data = encoder.encode(resetToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashedTokenToCheck = bufferToHex(hashBuffer);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find the token in the password_reset_attempts table
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_attempts')
      .select('user_id, expires_at')
      .eq('hashed_token', hashedTokenToCheck)
      .single();

    if (tokenError || !tokenData) {
      console.warn("Invalid or non-existent reset token attempted:", resetToken, tokenError?.message);
      return new Response(JSON.stringify({ error: "Invalid or expired password reset token. Please try again." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2. Check if the token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // Optionally, delete the expired token
      await supabaseAdmin.from('password_reset_attempts').delete().eq('hashed_token', hashedTokenToCheck);
      return new Response(JSON.stringify({ error: "Password reset token has expired. Please request a new one." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = tokenData.user_id;

    // 3. Update the user's password in Supabase Auth using the Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating user password:", userId, updateError);
      // Check for specific errors, e.g., password policy violation
      if (updateError.message.includes("Password should be at least 6 characters")) {
         return new Response(JSON.stringify({ error: "Password is too short. It must be at least 6 characters." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
      }
      throw new Error("Failed to update password.");
    }

    // 4. Password updated successfully, delete the token from password_reset_attempts
    const { error: deleteError } = await supabaseAdmin
      .from('password_reset_attempts')
      .delete()
      .eq('hashed_token', hashedTokenToCheck); // or .eq('user_id', userId)

    if (deleteError) {
      // Log this error but don't fail the whole process if password was updated
      console.error("Failed to delete used password reset token:", userId, deleteError.message);
    }

    return new Response(JSON.stringify({ success: true, message: "Password has been reset successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in reset-password-with-custom-token:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});