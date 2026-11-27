import { describe, it, expect } from 'vitest';
import { supabaseAdmin } from './supabase-prueba.js';
import { crearUsuario, iniciarSesion } from './usuarios-prueba.js';

describe('Usuarios de prueba y login', () => {
  it('crea un técnico con el rol correcto en profiles', async () => {
    const tecnico = await crearUsuario('tecnico');

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', tecnico.id)
      .single();

    expect(data.role).toBe('tecnico');
  });

  it('inicia sesión con correo y contraseña correctos', async () => {
    const cliente = await crearUsuario('cliente');
    const sesionCliente = await iniciarSesion(cliente.correo);

    const { data } = await sesionCliente.auth.getUser();

    expect(data.user.email).toBe(cliente.correo);
  });
});