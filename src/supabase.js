import { createClient } from '@supabase/supabase-js';

// Pehle variables read karne ki koshish karo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Hum check lagayenge par crash nahi karenge, taaki build process fail na ho aur debugging aasan ho
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Warning: Supabase environment variables are missing! Check your .env or .env.local file. API calls will fail until they are configured.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);