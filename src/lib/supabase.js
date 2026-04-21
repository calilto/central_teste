import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yscpojzcxrbjhipnodlk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3BvanpjeHJiamhpcG5vZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODEwMzksImV4cCI6MjA2NTI1NzAzOX0.gviwZ4FO3HmjIZD2tsvDvKR_yhy123T2an8P_uP3Q4w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
