// supabase/functions/get-stripe-customer-count/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.12.0'; // Use a recent Stripe Node SDK version
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have this from previous step

console.log('get-stripe-customer-count function initializing...');

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')! as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TODO: Add robust admin authentication/authorization here
    // For now, proceeding assuming the caller is authorized.

    console.log('Fetching total customer count from Stripe...');
    let totalCustomers = 0;
    let hasMore = true;
    let params: Stripe.CustomerListParams = { limit: 100 }; // Fetch 100 at a time

    while (hasMore) {
      const customers: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list(params);
      
      // Add the number of customers from the current page
      // Note: Some Stripe list objects might have a `total_count` property under specific conditions,
      // but paginating and summing is the most robust way to get an exact count of all customers.
      totalCustomers += customers.data.length;

      if (customers.has_more && customers.data.length > 0) {
        params.starting_after = customers.data[customers.data.length - 1].id;
      } else {
        hasMore = false;
      }
      console.log(`Workspaceed a page of customers. Running total: ${totalCustomers}, Has more: ${hasMore}`);
    }

    console.log(`Total registered customers from Stripe: ${totalCustomers}`);

    return new Response(
      JSON.stringify({ totalCustomers }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching Stripe customer count:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch customer count' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});