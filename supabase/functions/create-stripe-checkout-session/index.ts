// supabase/functions/create-stripe-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.x'; // Ensure you have a recent Stripe version
import { corsHeaders } from '../_shared/cors.ts';

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
// IMPORTANT: Set your actual success and cancel URLs. These can also be environment variables.
const APP_URL = Deno.env.get("SITE_URL") || 'http://localhost:4321' || 'https://customer-app-jet.vercel.app'; 
const SUCCESS_URL = `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${APP_URL}/`; // Or a dedicated packages page

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

  if (!STRIPE_SECRET_KEY) {
    console.error("Stripe secret key is not set in environment variables.");
    return new Response(JSON.stringify({ error: "Payment processing configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  try {
    // Get authenticated user from the request
    const supabaseAuthClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError?.message);
      return new Response(JSON.stringify({ error: "User not authenticated." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const { packageId } = await req.json();
    if (!packageId) {
      return new Response(JSON.stringify({ error: "Package ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    // Use Admin client for sensitive operations like fetching full profile/package details
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '', 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages') // Use your actual table name
      .select('id, name, price, type, days') // Fetch all needed details
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      console.error("Package not found or error:", pkgError?.message);
      return new Response(JSON.stringify({ error: "Package not found, is inactive, or there was an error." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    // Fetch user's profile to get/create Stripe Customer ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id, full_name') // Assuming full_name is in profiles
        .eq('id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = row not found
        console.error("Error fetching user profile:", profileError.message);
        throw new Error("Could not retrieve user profile for payment.");
    }
    
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }); // Use a specific API version

    let stripeCustomerId = userProfile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: userProfile?.full_name || user.user_metadata?.full_name, // Get full_name from profile or metadata
        metadata: { supabase_user_id: user.id }
      });
      stripeCustomerId = customer.id;
      // Save the new stripe_customer_id to the user's profile
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
      if (updateProfileError) {
        console.error("Error updating profile with Stripe Customer ID:", updateProfileError.message);
        // Non-fatal for this transaction, but should be logged/monitored
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [{
        price_data: {
          currency: 'cad', // As per your update, prices are in CAD
          product_data: {
            name: pkg.name,
            images: pkg.image_url ? [pkg.image_url] : [], // Optional image
            metadata: { 
                package_id: pkg.id,
                package_type: pkg.type,
                package_days: String(pkg.days) // Metadata values must be strings
            } 
          },
          unit_amount: Math.round(pkg.price * 100), // Price in cents
        },
        quantity: 1,
      }],
      mode: 'payment', // For one-time payment. Change to 'subscription' for recurring.
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // Crucial metadata to link back to your system after payment
      metadata: {
        supabase_user_id: user.id,
        package_id: pkg.id,
        // You can add more relevant metadata here if needed (strings only)
        // e.g., package_price: String(pkg.price)
      }
    });

    if (!session.id) {
        throw new Error("Failed to create Stripe Checkout session.");
    }

    return new Response(JSON.stringify({ sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }});

  } catch (error) {
    console.error("Error creating Stripe session:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Internal server error creating payment session." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});