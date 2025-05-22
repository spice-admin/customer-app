// supabase/functions/get-stripe-all-time-revenue/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.12.0'; // Use a recent Stripe Node SDK version
import { corsHeaders } from '../_shared/cors.ts'; // We'll create this shared file next

console.log('get-stripe-all-time-revenue function initializing...');

// Initialize Stripe with your secret key from environment variables
// Ensure Deno can access environment variables. For local dev via `supabase functions serve`, it uses .env.
// For deployed functions, set them in Supabase Dashboard.
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')! as string, {
  apiVersion: '2023-10-16', // Use a recent, fixed API version
  httpClient: Stripe.createFetchHttpClient(), // Important for Deno environment
});

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Optional: Add authentication here to ensure only authorized admins can call this.
    // This example assumes it's called by an authenticated admin from your app.
    // const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    //   req.headers.get('Authorization')?.replace('Bearer ', '')!
    // );
    // if (authError || !user) {
    //   console.error('Authentication error:', authError);
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }
    // Add logic here to check if 'user' is an admin.

    console.log('Fetching all-time revenue from Stripe...');
    let totalRevenueCAD = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    const targetCurrency = 'cad'; // Canadian Dollars

    while (hasMore) {
      const paymentIntents: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
        limit: 100, // Max 100 per page
        starting_after: startingAfter,
        // We only want to sum successful payments
        // expand: ['data.latest_charge'], // To ensure charge object details are present if needed
      });

      for (const intent of paymentIntents.data) {
        if (intent.status === 'succeeded' && intent.currency.toLowerCase() === targetCurrency) {
          // 'amount_received' is usually what you want for successful payments, in the smallest currency unit.
          // 'amount' is the original amount. For succeeded intents, these are often the same.
          totalRevenueCAD += intent.amount_received; 
        }
      }

      if (paymentIntents.has_more && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }
      console.log(`Workspaceed a page of payment intents. Current total (cents): ${totalRevenueCAD}, Has more: ${hasMore}`);
    }

    // Stripe amounts are in the smallest currency unit (e.g., cents for CAD). Convert to dollars.
    const revenueInDollars = totalRevenueCAD / 100;
    console.log(`All-time gross revenue in CAD: ${revenueInDollars.toFixed(2)}`);

    return new Response(
      JSON.stringify({ totalRevenue: revenueInDollars.toFixed(2), currency: targetCurrency.toUpperCase() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching Stripe revenue:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch revenue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});