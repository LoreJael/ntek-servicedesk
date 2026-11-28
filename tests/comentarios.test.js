import { describe, it, expect, beforeAll } from 'vitest';
import { crearUsuario, iniciarSesion } from './usuarios-prueba.js';
import { datosTicketValido } from './tickets-prueba.js';

function datosComentario(idTicket, idAutor, texto, esInterno = false) {
  return {
    ticket_id: idTicket,
    author_id: idAutor,
    body: texto,
    is_internal: esInterno
  };
}

describe('Comentarios', () => {
  let cliente;
  let sesionCliente;
  let sesionOtroCliente;
  let tecnico;
  let sesionTecnico;
  let sesionAdmin;
  let ticket;

  beforeAll(async () => {
    cliente = await crearUsuario('cliente');
    sesionCliente = await iniciarSesion(cliente.correo);

    const otroCliente = await crearUsuario('cliente');
    sesionOtroCliente = await iniciarSesion(otroCliente.correo);

    tecnico = await crearUsuario('tecnico');
    sesionTecnico = await iniciarSesion(tecnico.correo);

    const admin = await crearUsuario('admin');
    sesionAdmin = await iniciarSesion(admin.correo);

    const { data, error } = await sesionCliente
      .from('tickets')
      .insert(datosTicketValido(cliente.id))
      .select()
      .single();

    if (error) throw error;
    ticket = data;
  });

    it('un cliente puede comentar en su ticket abierto', async () => {
    const { data, error } = await sesionCliente
      .from('comments')
      .insert(datosComentario(ticket.id, cliente.id, 'Sigo con el problema en mi equipo.'))
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.is_internal).toBe(false);
  });

    it('un cliente no puede crear una nota interna', async () => {
    const { error } = await sesionCliente
      .from('comments')
      .insert(datosComentario(ticket.id, cliente.id, 'Intento escribir una nota interna.', true));

    expect(error).not.toBeNull();
  });

    it('un técnico puede crear una nota interna', async () => {
    const { data, error } = await sesionTecnico
      .from('comments')
      .insert(datosComentario(ticket.id, tecnico.id, 'Nota interna: revisar el router.', true))
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.is_internal).toBe(true);
  });

    it('un cliente no ve las notas internas del equipo', async () => {
    const { data: nota } = await sesionTecnico
      .from('comments')
      .insert(datosComentario(ticket.id, tecnico.id, 'Nota interna que el cliente no debe ver.', true))
      .select()
      .single();

    const { data, error } = await sesionCliente
      .from('comments')
      .select('id')
      .eq('id', nota.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

    it('otro cliente no ve los comentarios de un ticket ajeno', async () => {
    await sesionCliente
      .from('comments')
      .insert(datosComentario(ticket.id, cliente.id, 'Comentario privado de mi ticket.'));

    const { data, error } = await sesionOtroCliente
      .from('comments')
      .select('id')
      .eq('ticket_id', ticket.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

    it('rechaza un comentario de menos de 10 caracteres', async () => {
    const { error } = await sesionCliente
      .from('comments')
      .insert(datosComentario(ticket.id, cliente.id, 'Ok'));

    expect(error).not.toBeNull();
  });

    it('un cliente no puede comentar en un ticket cerrado', async () => {
    const { data: ticketCerrado } = await sesionCliente
      .from('tickets')
      .insert(datosTicketValido(cliente.id))
      .select()
      .single();

    const { error: errorCierre } = await sesionAdmin
      .from('tickets')
      .update({ status: 'cerrado' })
      .eq('id', ticketCerrado.id);

    expect(errorCierre).toBeNull();

    const { error } = await sesionCliente
      .from('comments')
      .insert(datosComentario(ticketCerrado.id, cliente.id, 'Quiero agregar algo más al caso.'));

    expect(error).not.toBeNull();
  });
});

