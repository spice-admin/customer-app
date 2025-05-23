// supabase/functions/create-addon-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.12.0';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')! as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TODO: Authenticate user calling this function (e.g., from JWT)
    // const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    // if (authError || !user) throw new Error("User not authenticated");

    const { amount, currency, customerStripeId, description, metadata } = await req.json(); // amount in cents

    if (!amount || amount <= 0 || !currency) {
      throw new Error("Amount and currency are required.");
    }

    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      description: description || 'Addon Order Payment',
      // If you have the Stripe Customer ID for the logged-in user, pass it:
      // customer: customerStripeId, // Optional, but good for linking payments
      // metadata can include order_id, user_id for your reference
      metadata: metadata || {},
    };

    // If you want to charge an existing saved card for a customer without them re-entering details,
    // you'd need customerStripeId and a payment_method ID, or set up off_session=true
    // For now, this creates a Payment Intent that the client-side Stripe Elements will confirm.

    const paymentIntent = await stripe.paymentIntents.create(params);

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error creating Stripe Payment Intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});