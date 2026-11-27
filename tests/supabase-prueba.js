import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const salida = execSync('npx supabase status -o json', { encoding: 'utf8' });
const textoJson = salida.slice(salida.indexOf('{'), salida.lastIndexOf('}') + 1);
const datosSupabaseLocal = JSON.parse(textoJson);

export const URL_PRUEBA = datosSupabaseLocal.API_URL;
export const LLAVE_PUBLICA_PRUEBA = datosSupabaseLocal.PUBLISHABLE_KEY;

export const supabaseAdmin = createClient(
  datosSupabaseLocal.API_URL,
  datosSupabaseLocal.SECRET_KEY
);