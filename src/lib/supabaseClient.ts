// src/lib/supabaseClient.ts (or your actual path)
import { createClient } from "@supabase/supabase-js";

// These come from your .env file
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are missing from .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
