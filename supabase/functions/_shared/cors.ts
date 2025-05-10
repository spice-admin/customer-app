// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or your specific frontend URL for production
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};