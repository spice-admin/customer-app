// supabase/functions/get-package-sales-stats/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Your shared CORS headers
import { startOfDay, endOfDay, formatISO, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'https://esm.sh/date-fns@2.30.0';

console.log('get-package-sales-stats function initializing...');

// Helper function to get Supabase client with user's auth context
function getSupabaseClient(req: Request): SupabaseClient {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.warn("get-package-sales-stats: Missing Authorization header.");
        // Fallback to anon key, RLS must allow access or this won't work for protected data
        return createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
    }
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    );
}


interface RequestPayload {
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom_range' | 'total';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

interface PackageSaleStat {
  period_label: string; // e.g., "2025-05-28", "May 2025", "Week 22"
  package_name: string;
  sales_count: number;
}

interface OverallStatPayload {
    total_sales_current_period: number;
    top_package_current_period: string | null;
    // Add more summary stats as needed
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient(req); // Use user's context for RLS

    // TODO: Implement robust admin role check here using the 'supabase' client
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user || !is_admin(user.id)) { // Assuming an is_admin check
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: {...corsHeaders}});
    // }

    const payload: RequestPayload = await req.json();
    const { periodType, startDate: startDateStr, endDate: endDateStr } = payload;

    console.log(`get-package-sales-stats: Received request - Period: ${periodType}, Start: ${startDateStr}, End: ${endDateStr}`);

    let query = supabase
      .from('orders')
      // We need package_name and order_date (or created_at if that's your order placement time)
      // For simplicity, let's assume 'order_date' is the relevant timestamp for when an order/subscription sale occurs.
      // Your 'orders' table has 'order_date TIMESTAMPTZ NOT NULL DEFAULT NOW()'
      .select('package_name, order_date', { count: 'exact' }) 
      .not('package_name', 'is', null); // Only count orders with a package name
      // Add more filters if needed, e.g., only paid/confirmed orders
      // .in('order_status', ['paid', 'confirmed'])


    // Apply date filters based on periodType
    let calculatedStartDate: Date | null = null;
    let calculatedEndDate: Date | null = null;
    let groupByClause = ''; // For SQL grouping if done in DB, or for JS processing

    if (periodType !== 'total') {
        if (startDateStr) calculatedStartDate = startOfDay(parseISO(startDateStr));
        if (endDateStr) calculatedEndDate = endOfDay(parseISO(endDateStr));

        if (!calculatedStartDate || !calculatedEndDate) {
            throw new Error("Start date and end date are required for custom ranges.");
        }
        if (calculatedStartDate > calculatedEndDate) {
            throw new Error("Start date cannot be after end date.");
        }
        query = query.gte('order_date', formatISO(calculatedStartDate));
        query = query.lte('order_date', formatISO(calculatedEndDate));
    }


    const { data: ordersData, error: dbError, count: totalCountInPeriod } = await query;

    if (dbError) {
      console.error("Supabase DB error:", dbError);
      throw dbError;
    }

    console.log(`Fetched ${ordersData?.length || 0} orders for the period. Total potential count in period (before grouping): ${totalCountInPeriod}`);

    // Aggregate data in JavaScript (more flexible for different period types)
    const packageCounts: Record<string, number> = {};
    const salesByPeriodAndPackage: Record<string, Record<string, number>> = {}; // { "period_label": { "package_name": count } }

    (ordersData || []).forEach(order => {
      if (!order.package_name) return;

      let periodLabel = 'All Time';
      const orderDate = parseISO(order.order_date);

      switch (periodType) {
        case 'daily':
          periodLabel = format(orderDate, 'yyyy-MM-dd'); // Group by exact day
          break;
        case 'weekly':
          // Group by year and week number
          periodLabel = `<span class="math-inline">\{format\(orderDate, 'yyyy'\)\}\-W</span>{format(orderDate, 'II')}`; 
          break;
        case 'monthly':
          periodLabel = format(orderDate, 'yyyy-MM'); // Group by YYYY-MM
          break;
        case 'total':
        case 'custom_range': // For custom range, all fall into one "period" which is the range itself
          periodLabel = startDateStr && endDateStr ? `<span class="math-inline">\{startDateStr\}\_to\_</span>{endDateStr}` : 'Selected Range';
          if (periodType === 'total') periodLabel = 'All Time';
          break;
      }

      if (!salesByPeriodAndPackage[periodLabel]) {
        salesByPeriodAndPackage[periodLabel] = {};
      }
      if (!salesByPeriodAndPackage[periodLabel][order.package_name]) {
        salesByPeriodAndPackage[periodLabel][order.package_name] = 0;
      }
      salesByPeriodAndPackage[periodLabel][order.package_name]++;
    });

    // Transform into the PackageSaleStat[] array format
    const aggregatedSalesData: PackageSaleStat[] = [];
    for (const period in salesByPeriodAndPackage) {
        for (const pkgName in salesByPeriodAndPackage[period]) {
            aggregatedSalesData.push({
                period_label: period,
                package_name: pkgName,
                sales_count: salesByPeriodAndPackage[period][pkgName]
            });
        }
    }

    // Calculate summary stats (example: total sales and top package for the fetched data)
    let overallTotalSales = 0;
    const tempPackageTotals: Record<string, number> = {};
    aggregatedSalesData.forEach(stat => {
        overallTotalSales += stat.sales_count;
        tempPackageTotals[stat.package_name] = (tempPackageTotals[stat.package_name] || 0) + stat.sales_count;
    });

    let topPackageName: string | null = null;
    if (Object.keys(tempPackageTotals).length > 0) {
        topPackageName = Object.entries(tempPackageTotals).sort(([,a],[,b]) => b-a)[0][0];
    }

    const summaryStatsPayload: OverallStatPayload = {
        total_sales_current_period: overallTotalSales,
        top_package_current_period: topPackageName,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        salesData: aggregatedSalesData, // Detailed data for charts/tables
        summaryStats: summaryStatsPayload, // KPIs
        periodType: periodType, // Echo back period type for context
        requestedStartDate: startDateStr,
        requestedEndDate: endDateStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in get-package-sales-stats:", error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to fetch sales statistics." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }}
    );
  }
});