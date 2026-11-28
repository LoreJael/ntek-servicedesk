import { describe, it, expect, beforeAll } from 'vitest';
import { crearUsuario, iniciarSesion } from './usuarios-prueba.js';
import { supabaseAdmin } from './supabase-prueba.js';
import { datosTicketValido } from './tickets-prueba.js';

function datosTicketValido(idCliente) {
    return {
        created_by: idCliente,
        title: 'Ticket de prueba automática',
        description: 'Descripción del ticket creado por los tests.',
        category: 'Software',
        priority: 'media'
    };
}

describe('Tickets: crear y leer', () => {
    let clienteA;
    let sesionClienteA;
    let sesionClienteB;
    let ticketDeA;

    beforeAll(async () => {
        clienteA = await crearUsuario('cliente');
        sesionClienteA = await iniciarSesion(clienteA.correo);

        const clienteB = await crearUsuario('cliente');
        sesionClienteB = await iniciarSesion(clienteB.correo);

        const { data, error } = await sesionClienteA
            .from('tickets')
            .insert(datosTicketValido(clienteA.id))
            .select()
            .single();

        if (error) throw error;
        ticketDeA = data;
    })

    it('un cliente puede crear un ticket y queda en estado nuevo', async () => {
        const { data, error } = await sesionClienteA
            .from('tickets')
            .insert(datosTicketValido(clienteA.id))
            .select()
            .single();

        expect(error).toBeNull();
        expect(data.status).toBe('nuevo');
    });

    it('un cliente ve su propio ticket', async () => {
        const { data } = await sesionClienteA
            .from('tickets')
            .select('id')
            .eq('id', ticketDeA.id);

        expect(data).toHaveLength(1);
    });
    it('un cliente no ve el ticket de otro cliente', async () => {
        const { data, error } = await sesionClienteB
            .from('tickets')
            .select('id')
            .eq('id', ticketDeA.id);

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
    });
    it('rechaza un ticket con título demasiado corto', async () => {
        const ticketInvalido = { ...datosTicketValido(clienteA.id), title: 'Hola' };

        const { error } = await sesionClienteA.from('tickets').insert(ticketInvalido);

        expect(error).not.toBeNull();
    });

    describe('Tickets: actualizar y borrar', () => {
  let cliente;
  let sesionCliente;
  let tecnico1;
  let sesionTecnico1;
  let tecnico2;
  let sesionTecnico2;
  let sesionAdmin;

  beforeAll(async () => {
    cliente = await crearUsuario('cliente');
    sesionCliente = await iniciarSesion(cliente.correo);

    tecnico1 = await crearUsuario('tecnico');
    sesionTecnico1 = await iniciarSesion(tecnico1.correo);

    tecnico2 = await crearUsuario('tecnico');
    sesionTecnico2 = await iniciarSesion(tecnico2.correo);

    const admin = await crearUsuario('admin');
    sesionAdmin = await iniciarSesion(admin.correo);
  });
    async function crearTicketNuevo() {
    const { data, error } = await sesionCliente
      .from('tickets')
      .insert(datosTicketValido(cliente.id))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  function tomarCaso(sesionTecnico, idTecnico, idTicket) {
    return sesionTecnico
      .from('tickets')
      .update({ assigned_to: idTecnico })
      .eq('id', idTicket)
      .is('assigned_to', null)
      .select();
  }
    it('un técnico puede tomar un caso sin asignar', async () => {
    const ticket = await crearTicketNuevo();

    const { data, error } = await tomarCaso(sesionTecnico1, tecnico1.id, ticket.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].assigned_to).toBe(tecnico1.id);
  });
    it('un segundo técnico no puede tomar un caso ya tomado', async () => {
    const ticket = await crearTicketNuevo();
    await tomarCaso(sesionTecnico1, tecnico1.id, ticket.id);

    const { data, error } = await tomarCaso(sesionTecnico2, tecnico2.id, ticket.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);

    const { data: ticketEnBase } = await supabaseAdmin
      .from('tickets')
      .select('assigned_to')
      .eq('id', ticket.id)
      .single();

    expect(ticketEnBase.assigned_to).toBe(tecnico1.id);
  });
    it('un cliente no puede modificar su propio ticket', async () => {
    const ticket = await crearTicketNuevo();

    const { data } = await sesionCliente
      .from('tickets')
      .update({ priority: 'critica' })
      .eq('id', ticket.id)
      .select();

    expect(data).toHaveLength(0);

    const { data: ticketEnBase } = await supabaseAdmin
      .from('tickets')
      .select('priority')
      .eq('id', ticket.id)
      .single();

    expect(ticketEnBase.priority).toBe('media');
  });
    it('un técnico no puede modificar un ticket cerrado', async () => {
    const ticket = await crearTicketNuevo();
    await tomarCaso(sesionTecnico1, tecnico1.id, ticket.id);

    const { error: errorCierre } = await sesionAdmin
      .from('tickets')
      .update({ status: 'cerrado' })
      .eq('id', ticket.id);

    expect(errorCierre).toBeNull();

    const { data } = await sesionTecnico1
      .from('tickets')
      .update({ priority: 'alta' })
      .eq('id', ticket.id)
      .select();

    expect(data).toHaveLength(0);
  });
    it('nadie puede borrar un ticket, ni siquiera un administrador', async () => {
    const ticket = await crearTicketNuevo();

    const { data } = await sesionAdmin
      .from('tickets')
      .delete()
      .eq('id', ticket.id)
      .select();

    expect(data).toHaveLength(0);

    const { data: ticketEnBase } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('id', ticket.id);

    expect(ticketEnBase).toHaveLength(1);
  });
    it('un usuario desactivado no ve sus tickets ni puede crear nuevos', async () => {
    const clienteDesactivado = await crearUsuario('cliente');
    const sesion = await iniciarSesion(clienteDesactivado.correo);

    const { data: ticket } = await sesion
      .from('tickets')
      .insert(datosTicketValido(clienteDesactivado.id))
      .select()
      .single();

    await supabaseAdmin
      .from('profiles')
      .update({ active: false })
      .eq('id', clienteDesactivado.id);

    const { data: visibles } = await sesion
      .from('tickets')
      .select('id')
      .eq('id', ticket.id);

    expect(visibles).toHaveLength(0);

    const { error } = await sesion
      .from('tickets')
      .insert(datosTicketValido(clienteDesactivado.id));

    expect(error).not.toBeNull();
  });
});
});




