import { createClient } from '@supabase/supabase-js';

// Tenta ler das variáveis de ambiente (Padrão Vite), senão usa o valor hardcoded
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://libkxkksgzovyqhgldls.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYmt4a2tzZ3pvdnlxaGdsZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTI5OTgsImV4cCI6MjA3OTcyODk5OH0.xs0FdK-U2UtwwUIhCUE8I4PvB2XPjI_OnI22S3CnoVI';

export const supabase = createClient(supabaseUrl, supabaseKey);