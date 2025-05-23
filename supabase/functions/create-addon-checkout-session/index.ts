// supabase/functions/create-addon-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.x'; // Use your consistent Stripe SDK version
import { corsHeaders } from '../_shared/cors.ts'; // Your shared CORS headers

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const APP_URL = Deno.env.get("YOUR_APP_URL") || 'http://localhost:4321'||'https://customer-app-jet.vercel.app';

const SUCCESS_URL = `${APP_URL}/addon-order-success?session_id={CHECKOUT_SESSION_ID}`; // For addons
const CANCEL_URL = `${APP_URL}/cart`; // Back to cart page on cancel

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

  if (!STRIPE_SECRET_KEY) {
    console.error("Stripe secret key is not set.");
    return new Response(JSON.stringify({ error: "Payment configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  const supabaseClient = createClient( // For user auth check
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error for addon checkout:", authError?.message);
      return new Response(JSON.stringify({ error: "User not authenticated." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    // Data expected from the client (CheckoutSummaryView.tsx)
    const { 
      cartItems, // Array of { id (addon_id), name, price, quantity, image_url }
      currency = 'cad', 
      mainOrderId, 
      addonDeliveryDate,
      totalAddonPrice // For verification or display, actual line items will be used by Stripe
    } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Addon cart items are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    if (!mainOrderId || !addonDeliveryDate) {
        return new Response(JSON.stringify({ error: "Main order ID and addon delivery date are required." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });

    // Optional: Fetch Stripe Customer ID if you store it in your 'profiles' table
    // This helps link payments to the same customer in Stripe
    let stripeCustomerId: string | undefined = undefined;
    // const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    // const { data: userProfile } = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
    // if (userProfile?.stripe_customer_id) {
    //   stripeCustomerId = userProfile.stripe_customer_id;
    // } else {
    //   // Create Stripe customer if not exists (good practice)
    //   const customer = await stripe.customers.create({ email: user.email, name: user.user_metadata?.full_name, metadata: { supabase_user_id: user.id } });
    //   stripeCustomerId = customer.id;
    //   // Save stripeCustomerId to user's profile in Supabase
    //   await supabaseAdmin.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', user.id);
    // }


    const line_items = cartItems.map((item: any) => ({ // Use 'any' or a more specific input type
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : undefined,
          // metadata specific to this product line item if needed
        },
        unit_amount: Math.round(item.price * 100), // Price in cents
      },
      quantity: item.quantity,
    }));
    
    // Before creating the session, you could pre-create an 'addon_orders' record 
    // in your DB with a 'pending_payment' status and an ID. Then pass this addon_order_id
    // in metadata to Stripe. This helps in reconciliation.
    // const preliminaryAddonOrderId = "your_pre_generated_uuid"; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeCustomerId, // Optional: If you retrieved/created a Stripe Customer ID
      customer_email: stripeCustomerId ? undefined : user.email, // Or if no stripeCustomerId, pass email
      line_items: line_items,
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // Metadata to help link this Stripe session back to your application's data
      // This is what you will use on the success page to identify and save the order.
      metadata: {
        supabase_user_id: user.id,
        main_order_id: mainOrderId,
        addon_delivery_date: addonDeliveryDate,
        // preliminary_addon_order_id: preliminaryAddonOrderId, // If you create one
        cart_items_summary: JSON.stringify(cartItems.map(ci => ({id: ci.id, q: ci.quantity }))), // Example summary
        total_addon_price_cents: Math.round(totalAddonPrice * 100) // Store total for verification
      }
    });

    if (!session.id) {
        throw new Error("Failed to create Stripe Checkout session for addons.");
    }

    return new Response(JSON.stringify({ sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }});

  } catch (error) {
    console.error("Error creating Stripe addon checkout session:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Internal server error creating payment session." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});