const SUPABASE_URL =
"https://qqhvatkczphnzmbbzcpa.supabase.co";


const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaHZhdGtjenBobnptYmJ6Y3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMyOTksImV4cCI6MjEwMDQ2OTI5OX0.H2S6L3vSBmGCYFpENa0EuDWRIsNBQ6ipWqEhQXYPG5Y";



const supabaseClient =
supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);