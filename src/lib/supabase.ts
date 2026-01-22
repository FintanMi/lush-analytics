import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zlrwtjlsywkibbekgqte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpscnd0amxzeXdraWJiZWtncXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTU2MDIsImV4cCI6MjA4NDU5MTYwMn0.5wCMBqTyWMFp-TR0oFUZmrqoR0VaaYa9CUj0f46tCqs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
