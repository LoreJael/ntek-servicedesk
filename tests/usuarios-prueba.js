import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, URL_PRUEBA, LLAVE_PUBLICA_PRUEBA } from './supabase-prueba.js';

export const CONTRASENA_PRUEBA = 'Prueba1234!';

export async function crearUsuario(rol) {
  const correo = `${rol}-${Date.now()}-${Math.floor(Math.random() * 1000)}@prueba.cl`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: correo,
    password: CONTRASENA_PRUEBA,
    email_confirm: true,
    user_metadata: { full_name: `Usuario ${rol} de prueba` }
  });

  if (error) throw error;

  if (rol !== 'cliente') {
    const { error: errorRol } = await supabaseAdmin
      .from('profiles')
      .update({ role: rol })
      .eq('id', data.user.id);

    if (errorRol) throw errorRol;
  }

  return { id: data.user.id, correo };
}

export async function iniciarSesion(correo) {
  const cliente = createClient(URL_PRUEBA, LLAVE_PUBLICA_PRUEBA, {
    auth: { persistSession: false }
  });

  const { error } = await cliente.auth.signInWithPassword({
    email: correo,
    password: CONTRASENA_PRUEBA
  });

  if (error) throw error;

  return cliente;
}

