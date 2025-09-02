import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env as any).SUPABASE_URL;
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY;

// Robust check to ensure environment variables are loaded correctly.
// Vite replaces missing env vars with the literal string "undefined" during build.
if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseAnonKey || supabaseAnonKey === 'undefined') {
  const errorMessage = 'CRITICAL ERROR: Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. The application cannot function without them. Please check your .env configuration.';
  console.error(errorMessage);
  // Display a user-friendly error on the page and stop the app.
  document.body.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif; background: #111; color: #ff8a80; height: 100vh; display: flex; align-items: center; justify-content: center;"><div><h1>Configuration Error</h1><p style="line-height: 1.6;">${errorMessage}</p></div></div>`;
  // Throw an error to halt script execution
  throw new Error(errorMessage);
}


export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
