import { describe, it, expect, beforeAll } from 'vitest';
import { crearUsuario, iniciarSesion } from './usuarios-prueba.js';

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
});




