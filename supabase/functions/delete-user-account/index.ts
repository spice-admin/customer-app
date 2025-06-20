// supabase/functions/delete-user-account/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Delete User Account function initialized");

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the Service Role Key
    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get the user object from the JWT in the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found or invalid token.' }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userIdToDelete = user.id;
    console.log(`Attempting to delete user with ID: ${userIdToDelete}`);

    // 4. Perform the deletion using the admin client. This is the only action needed.
    // Your database schema's CASCADE and SET NULL rules will handle the rest.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error(`Error deleting user ${userIdToDelete}:`, deleteError.message);
      throw deleteError;
    }

    console.log(`Successfully deleted auth user and triggered data cleanup for ID: ${userIdToDelete}`);

    // 5. Return a success response
    return new Response(JSON.stringify({ success: true, message: "Account deleted successfully." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in delete-user-account function:", error.message);
    return new Response(JSON.stringify({ error: error.message || "An internal server error occurred." }), {
      status: error.status || 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});