// supabase/functions/delete-driver/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required to delete a driver." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Delete the user from Supabase Auth.
    // If ON DELETE CASCADE is set on your 'drivers.id' FK,
    // the corresponding row in 'public.drivers' will be deleted automatically.
    const { data, error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthUserError) {
      console.error(`Error deleting auth user ${userId}:`, deleteAuthUserError);
      // Check for specific errors, e.g., user not found (might have been already deleted)
      if (deleteAuthUserError.message.includes("User not found")) {
         return new Response(JSON.stringify({ error: "User not found in authentication. Already deleted or invalid ID." }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw deleteAuthUserError;
    }

    return new Response(JSON.stringify({ success: true, message: "Driver and associated auth user deleted successfully." }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in delete-driver function:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});