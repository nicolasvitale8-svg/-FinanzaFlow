
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Intentar obtener de process.env (Vercel/Cloudflare)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Intentar obtener de import.meta.env (Vite/Local)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`] as string;
    }
  } catch (e) {
    return '';
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isCloudConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isCloudConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isCloudConfigured) {
  console.info("ℹ️ FinanzaFlow: Operando en 'Modo Local' (LocalStorage).");
} else {
  console.info("🚀 FinanzaFlow: Conectado a Supabase Cloud.");
}
