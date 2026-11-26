import { describe, it, expect } from 'vitest';
import { supabaseAdmin } from './supabase-prueba.js';

describe('Conexión a la base de prueba', () => {
  it('responde una consulta a la tabla tickets', async () => {
    const { error } = await supabaseAdmin.from('tickets').select('id').limit(1);

    expect(error).toBeNull();
  });
});