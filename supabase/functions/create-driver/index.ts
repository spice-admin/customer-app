// supabase/functions/create-driver/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Your shared CORS headers

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase client with the Service Role Key
    //    These environment variables are automatically available in Supabase Edge Functions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get data from the request body
    const {
      email,
      password,
      fullName,
      phone,
      vehicleNumber,
      isActive // This comes from DriverFormData
    } = await req.json();

    if (!email || !password || !fullName || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, password, fullName, phone." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (password.length < 6) { // Supabase default min password length
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 3. Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // Set to true if you want email confirmation for drivers
      user_metadata: {
        full_name: fullName, // Store in user_metadata for convenience
        phone: phone,        // Store in user_metadata
        // You could add a 'role' or 'app_role' here if needed, e.g., app_role: 'driver'
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      // Check for specific errors, like user already exists
      if (authError.message.includes("User already exists") || (authError as any).status === 400 || (authError as any).status === 422) {
         return new Response(JSON.stringify({ error: `Cannot create driver: ${authError.message}` }), {
            status: 409, // Conflict or Unprocessable Entity
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw authError; // Rethrow other auth errors
    }
    if (!authData?.user) {
      throw new Error("Auth user creation did not return a user object.");
    }
    const newAuthUser = authData.user;

    // 4. Insert into your custom 'drivers' table
    const driverProfileData = {
      id: newAuthUser.id, // Use the ID from the newly created auth user
      full_name: fullName,
      phone: phone,
      vehicle_number: vehicleNumber,
      is_active: isActive !== undefined ? isActive : true, // Default to true if not provided
      // created_at and updated_at will be set by default by the DB
    };

    const { data: newDriverProfile, error: profileInsertError } = await supabaseAdmin
      .from("drivers")
      .insert(driverProfileData)
      .select("id, full_name, phone, vehicle_number, is_active, created_at") // Select the fields you want to return
      .single();

    if (profileInsertError) {
      console.error("Error inserting driver profile, attempting to delete auth user:", newAuthUser.id, profileInsertError);
      // If inserting into the 'drivers' table fails, try to delete the auth user to keep things clean
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(newAuthUser.id);
      if (deleteUserError) {
        console.error("Failed to delete auth user after profile insert error:", deleteUserError);
      }
      throw profileInsertError; // Rethrow the original profile insert error
    }
    if (!newDriverProfile) {
        throw new Error("Driver profile created but failed to retrieve its data.");
    }

    // Combine auth email with driver profile for the response
    const completeNewDriverData = {
        ...newDriverProfile,
        email: newAuthUser.email // Add email from auth user
    };

    return new Response(JSON.stringify({ success: true, data: completeNewDriverData, message: "Driver created successfully" }), {
      status: 201, // Created
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in create-driver function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});