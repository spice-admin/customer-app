// supabase/functions/finalize-order/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.x';
import { corsHeaders } from '../_shared/cors.ts';
import { format, addDays, startOfDay } from 'https://esm.sh/date-fns@2.30.0'; // Import date-fns utilities

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

serve(async (req) => {
  // ... (OPTIONS request handling and initial checks for STRIPE_SECRET_KEY, checkout_session_id remain the same) ...
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }); }

  if (!STRIPE_SECRET_KEY) {
    console.error("Stripe secret key not set for finalize-order.");
    return new Response(JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  try {
    const { checkout_session_id } = await req.json();
    if (!checkout_session_id) {
      return new Response(JSON.stringify({ error: "Checkout session ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {
      expand: ['customer', 'payment_intent'],
    });

    if (!session || session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: "Payment not confirmed or session invalid." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const supabaseUserId = session.metadata?.supabase_user_id;
    const packageId = session.metadata?.package_id;
    const stripePaymentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (!supabaseUserId || !packageId || !stripePaymentId || !stripeCustomerId) {
      throw new Error("Critical information missing from payment session to create order.");
    }
    
    // Check if order already exists
    const { data: existingOrder, error: checkError } = await supabaseAdmin
        .from('orders')
        .select('id, delivery_start_date, delivery_end_date') // Select new fields too if needed
        .eq('stripe_payment_id', stripePaymentId)
        .maybeSingle();

    if (checkError) throw checkError;
    if (existingOrder) {
        return new Response(JSON.stringify({ 
            success: true, 
            orderId: existingOrder.id, 
            message: "Order already processed.",
            deliveryStartDate: existingOrder.delivery_start_date, // Send back existing dates
            deliveryEndDate: existingOrder.delivery_end_date
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    // --- Start of New Delivery Date Calculation Logic ---

    const orderPlacementDate = startOfDay(new Date(session.created * 1000)); // Use Stripe session creation time (UTC) as order date, normalized to start of day
    let potentialStartDate = startOfDay(addDays(orderPlacementDate, 1)); // Start checking from tomorrow

    let actualDeliveryStartDate: string | null = null;

    // Find the first available delivery_start_date
    const { data: firstAvailableDay, error: startDateError } = await supabaseAdmin
      .from('delivery_schedule')
      .select('event_date')
      .eq('is_delivery_enabled', true)
      .gte('event_date', format(potentialStartDate, 'yyyy-MM-dd'))
      .order('event_date', { ascending: true })
      .limit(1)
      .single();

    if (startDateError && startDateError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Error fetching first available delivery date: ${startDateError.message}`);
    }
    if (!firstAvailableDay) {
      console.error(`No available delivery start date found from ${format(potentialStartDate, 'yyyy-MM-dd')}. Check delivery_schedule.`);
      throw new Error("Currently no available delivery start dates. Please check schedule or contact support.");
    }
    actualDeliveryStartDate = firstAvailableDay.event_date; // This will be "yyyy-MM-dd"

    // Fetch Package details (including 'days')
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages') // Your actual table name
      .select('name, price, type, days') // Added 'days'
      .eq('id', packageId)
      .single();
    if (pkgError || !pkg) throw new Error(`Failed to fetch package details: ${pkgError?.message || 'Package not found'}`);

    let actualDeliveryEndDate: string | null = null;
    const packageDurationDays = pkg.days;

    if (packageDurationDays > 0) {
      const { data: deliverySlots, error: slotsError } = await supabaseAdmin
        .from('delivery_schedule')
        .select('event_date')
        .eq('is_delivery_enabled', true)
        .gte('event_date', actualDeliveryStartDate) // Start from the determined start date
        .order('event_date', { ascending: true })
        .limit(packageDurationDays);

      if (slotsError) {
        throw new Error(`Error fetching delivery slots for end date: ${slotsError.message}`);
      }

      if (deliverySlots && deliverySlots.length === packageDurationDays) {
        actualDeliveryEndDate = deliverySlots[packageDurationDays - 1].event_date;
      } else {
        console.error(`Not enough scheduled delivery days (${deliverySlots?.length || 0}) for package of ${packageDurationDays} days starting from ${actualDeliveryStartDate}.`);
        // Handle this critical error: either fail order or set a specific status/note.
        // For now, we'll throw, preventing order creation if full duration isn't met.
        throw new Error("Could not schedule full delivery duration. Please check available delivery days or contact support.");
        // Alternative: If partial scheduling is allowed, you might set endDate to the last available slot
        // and add a note to the order.
        // if (deliverySlots && deliverySlots.length > 0) {
        //   actualDeliveryEndDate = deliverySlots[deliverySlots.length - 1].event_date;
        //   // Add a note about partial fulfillment to orderData.notes or a new field
        // }
      }
    } else {
      // If package has 0 days (e.g., a one-time non-duration item, or error in package data)
      // Default end date to start date, or handle as error.
      actualDeliveryEndDate = actualDeliveryStartDate;
      console.warn(`Package ID ${packageId} has 'days' set to ${packageDurationDays}. End date set to start date.`);
    }

    // --- End of New Delivery Date Calculation Logic ---

    // Fetch User Profile details for the order
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone, address, city, postal_code, current_location') // current_location should be TEXT
      .eq('id', supabaseUserId)
      .single();
    if (profileError) throw new Error(`Failed to fetch user profile: ${profileError.message}`);

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
    if (authUserError) throw new Error(`Failed to fetch auth user details: ${authUserError.message}`);
    const userEmail = authUser.user?.email;

    // Construct order data including new delivery dates
    const orderData = {
      user_id: supabaseUserId,
      user_full_name: userProfile.full_name,
      user_email: userEmail,
      user_phone: userProfile.phone,
      package_id: packageId,
      package_name: pkg.name,
      package_type: pkg.type,
      package_days: pkg.days,
      package_price: pkg.price,
      delivery_address: userProfile.address,
      delivery_city: userProfile.city,
      delivery_postal_code: userProfile.postal_code,
      delivery_current_location: userProfile.current_location, // Store this
      stripe_payment_id: stripePaymentId,
      stripe_customer_id: stripeCustomerId,
      order_status: 'confirmed', // Or your desired initial status post-payment
      // NEW FIELDS:
      delivery_start_date: actualDeliveryStartDate,
      delivery_end_date: actualDeliveryEndDate,
    };

    // Insert into orders table
    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('id, delivery_start_date, delivery_end_date') // Return new fields
      .single();

    if (insertError) {
      console.error("Error inserting order:", insertError);
      throw new Error(`Failed to create order in database: ${insertError.message}`);
    }
    if (!newOrder || !newOrder.id) {
        throw new Error("Order created but failed to retrieve Order ID.");
    }

    return new Response(JSON.stringify({ 
        success: true, 
        orderId: newOrder.id, 
        message: "Order confirmed successfully!",
        deliveryStartDate: newOrder.delivery_start_date, // Send back calculated dates
        deliveryEndDate: newOrder.delivery_end_date
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }});

  } catch (error) {
    console.error("Error in finalize-order function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Internal server error finalizing order." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});