// supabase/functions/finalize-addon-order/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.12.0"; // Using a specific recent version
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // Ensure this path is correct

console.log("finalize-addon-order: Edge Function module script loaded.");

// Define types for clarity, mirroring what's expected in addon_orders and Stripe metadata
interface AddonItemForDB {
  addon_id: string;
  name: string;
  price_at_purchase: number;
  quantity: number;
}

interface AddonOrderDBRecord {
  user_id: string;
  main_order_id: string;
  addon_delivery_date: string; // YYYY-MM-DD
  addons_ordered: AddonItemForDB[];
  total_addon_price: number; // In main currency unit (e.g., dollars)
  currency: string;
  stripe_payment_intent_id: string;
  // id, created_at, updated_at will be auto-generated or set by DB
}

serve(async (req: Request) => {
  const requestStartLog = `finalize-addon-order: Request received - Method: ${req.method}, URL: ${req.url}`;
  console.log(requestStartLog);

  if (req.method === 'OPTIONS') {
    console.log("finalize-addon-order: Handling OPTIONS preflight request.");
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  // Environment Variable Check (CRITICAL)
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!STRIPE_SECRET_KEY) console.error("finalize-addon-order: FATAL - STRIPE_SECRET_KEY is not set.");
  if (!SUPABASE_URL) console.error("finalize-addon-order: FATAL - SUPABASE_URL is not set.");
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error("finalize-addon-order: FATAL - SUPABASE_SERVICE_ROLE_KEY is not set.");

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Critical server configuration error. Please contact support." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(), // Required for Deno
  });

  // Use Admin client for database operations that need service_role privileges
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log("finalize-addon-order: Attempting to parse request body...");
    const body = await req.json();
    const checkout_session_id = body?.session_id;
    console.log("finalize-addon-order: Received checkout_session_id:", checkout_session_id);

    if (!checkout_session_id) {
      console.error("finalize-addon-order: Checkout session ID is missing from the request body.");
      throw new Error("Stripe Checkout Session ID is required.");
    }

    console.log(`finalize-addon-order: Retrieving Stripe session "${checkout_session_id}"...`);
    const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {
      expand: ['payment_intent', 'line_items.data.price.product'], // Expand to get necessary details
    });
    console.log("finalize-addon-order: Stripe session retrieved. Payment status:", session.payment_status);

    if (session.payment_status !== 'paid') {
      console.warn(`finalize-addon-order: Payment not successful for session ${checkout_session_id}. Status: ${session.payment_status}`);
      throw new Error(`Payment not successful. Status: ${session.payment_status}`);
    }

    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      console.error("finalize-addon-order: Payment Intent ID not found in Stripe session.");
      throw new Error("Payment Intent ID not found in session.");
    }
    console.log("finalize-addon-order: Payment Intent ID:", paymentIntentId);

    // Idempotency Check: See if this payment intent has already been processed
    console.log(`finalize-addon-order: Checking for existing order with stripe_payment_intent_id: ${paymentIntentId}`);
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from('addon_orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (checkError) {
      console.error("finalize-addon-order: DB error checking for existing order:", checkError);
      throw checkError;
    }

    if (existingOrder) {
      console.log(`finalize-addon-order: Addon order ${existingOrder.id} already processed for payment intent: ${paymentIntentId}.`);
      return new Response(JSON.stringify({
        success: true,
        message: "Order already processed.",
        addonOrderId: existingOrder.id,
        // Include other details from existingOrder if needed by client
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Extract metadata stored during Checkout Session creation
    const metadata = session.metadata;
    console.log("finalize-addon-order: Stripe session metadata:", metadata);
    if (!metadata || !metadata.supabase_user_id || !metadata.main_order_id || !metadata.addon_delivery_date) {
      console.error("finalize-addon-order: Required metadata (supabase_user_id, main_order_id, addon_delivery_date) missing from Stripe session.");
      throw new Error("Required order information missing from payment session metadata.");
    }
    
    // Reconstruct addons_ordered. Prefer line_items from session for accuracy.
    let addons_ordered_data: AddonItemForDB[];
    if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
      console.log("finalize-addon-order: Reconstructing addons from session line_items.");
      addons_ordered_data = session.line_items.data.map(item => {
        const product = item.price?.product as Stripe.Product; // Type assertion
        return {
          addon_id: product?.metadata?.database_addon_id || product?.id || 'unknown_stripe_product_id', // Important: Store your DB addon_id in product metadata
          name: product?.name || item.description || 'Unknown Addon',
          price_at_purchase: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
          quantity: item.quantity || 0,
        };
      });
    } else if (metadata.cart_items_summary) {
      console.log("finalize-addon-order: Reconstructing addons from metadata.cart_items_summary (fallback).");
      try {
        // Assuming cart_items_summary was stored as [{id, name, price, quantity, image_url}]
        const parsedCartSummary = JSON.parse(metadata.cart_items_summary);
        addons_ordered_data = parsedCartSummary.map((item: any) => ({
            addon_id: item.id, // This is your database addon_id
            name: item.name,
            price_at_purchase: item.price, // Assuming this was price per unit
            quantity: item.quantity
        }));
      } catch(e) {
        console.error("finalize-addon-order: Failed to parse cart_items_summary from metadata:", e);
        throw new Error("Could not reconstruct addon items from payment session.");
      }
    } else {
      console.error("finalize-addon-order: No line_items or cart_items_summary found in session/metadata.");
      throw new Error("Addon item details missing from payment session.");
    }

    if (!addons_ordered_data || addons_ordered_data.length === 0) {
        throw new Error("No addon items could be determined for this order.");
    }

    const totalAddonPriceFromSession = session.amount_total ? session.amount_total / 100 : 0;

    const newAddonOrderRecord: AddonOrderDBRecord = {
      user_id: metadata.supabase_user_id,
      main_order_id: metadata.main_order_id,
      addon_delivery_date: metadata.addon_delivery_date, // Ensure this is YYYY-MM-DD
      addons_ordered: addons_ordered_data,
      total_addon_price: totalAddonPriceFromSession,
      currency: session.currency?.toUpperCase() || 'CAD',
      stripe_payment_intent_id: paymentIntentId,
    };

    console.log("finalize-addon-order: Prepared addon order record for DB:", newAddonOrderRecord);

    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from('addon_orders')
      .insert(newAddonOrderRecord)
      .select() // Select the inserted row
      .single(); // Expect a single row to be inserted and returned

    if (insertError) {
      console.error("finalize-addon-order: DB error inserting addon order:", insertError);
      throw insertError;
    }

    if (!insertedOrder) {
        console.error("finalize-addon-order: Addon order inserted but no data returned.");
        throw new Error("Failed to retrieve confirmed addon order details after saving.");
    }

    console.log("finalize-addon-order: Addon order successfully saved to DB with ID:", insertedOrder.id);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Addon order confirmed and saved successfully!", 
        addonOrder: insertedOrder // Send back the created order details
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("finalize-addon-order: Unhandled error in main try block:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error while finalizing order.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});