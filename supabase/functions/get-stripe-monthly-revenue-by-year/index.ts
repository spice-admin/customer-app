// supabase/functions/get-stripe-monthly-revenue-by-year/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.12.0'; // Or your preferred recent version
import { corsHeaders } from '../_shared/cors.ts';

console.log('get-stripe-monthly-revenue-by-year function initializing...');

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')! as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TODO: Add robust admin authentication/authorization here

    const url = new URL(req.url);
    const queryYear = url.searchParams.get('year');
    const year = queryYear ? parseInt(queryYear) : new Date().getFullYear();

    if (isNaN(year)) {
      return new Response(JSON.stringify({ error: 'Invalid year parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Workspaceing monthly revenue for year: ${year}`);

    const monthlyRevenueData = Array(12).fill(0).map((_, i) => ({
      month: MONTH_NAMES[i],
      revenue: 0,
    }));

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    const targetCurrency = 'cad';

    // Define the date range for the entire year in UTC
    // Stripe uses Unix timestamps (seconds since epoch)
    const yearStartTimestamp = Math.floor(new Date(Date.UTC(year, 0, 1, 0, 0, 0)).getTime() / 1000);
    const yearEndTimestamp = Math.floor(new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0)).getTime() / 1000) -1; // End of Dec 31st

    while (hasMore) {
      const params: Stripe.PaymentIntentListParams = {
        limit: 100,
        starting_after: startingAfter,
        created: {
          gte: yearStartTimestamp,
          lte: yearEndTimestamp,
        },
        // expand: ['data.latest_charge'], // Optional, if you need charge details
      };

      const paymentIntents: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list(params);

      for (const intent of paymentIntents.data) {
        if (intent.status === 'succeeded' && intent.currency.toLowerCase() === targetCurrency) {
          const monthIndex = new Date(intent.created * 1000).getUTCMonth(); // 0 for Jan, 1 for Feb, etc.
          monthlyRevenueData[monthIndex].revenue += intent.amount_received;
        }
      }

      if (paymentIntents.has_more && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }
      console.log(`Workspaceed page of PaymentIntents for ${year}. More: ${hasMore}`);
    }

    // Convert cents to dollars
    const formattedMonthlyRevenue = monthlyRevenueData.map(monthData => ({
      month: monthData.month,
      revenue: parseFloat((monthData.revenue / 100).toFixed(2)),
    }));

    return new Response(
      JSON.stringify({ 
        monthlyRevenue: formattedMonthlyRevenue, 
        currency: targetCurrency.toUpperCase(),
        year: year 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching Stripe monthly revenue:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch monthly revenue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});