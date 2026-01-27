const SUPABASE_URL = 'https://srcnlbdybejvcbvvdpbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY25sYmR5YmVqdmNidnZkcGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTU3MDYsImV4cCI6MjA4NTA3MTcwNn0.qLj0ClnWgAfxbtZ1P6O2c6TELdevpqerqOnjKGqhaZ8';

export function getSupabase() {
  // Supabase will be loaded as a global from the script tag
  if (window.supabase) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  throw new Error('Supabase library not loaded');
}
