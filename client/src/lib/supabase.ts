import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjnnfyocvlzpxscrjbcw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqbm5meW9jdmx6cHhzY3JqYmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTY4MDMsImV4cCI6MjA2NzAzMjgwM30.VQPItGtVK6QVjYdwL4tEb-6Uizr-aHDE-nxJr3e8s-0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
