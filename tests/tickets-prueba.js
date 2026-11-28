export function datosTicketValido(idCliente) {
  return {
    created_by: idCliente,
    title: 'Ticket de prueba automática',
    description: 'Descripción del ticket creado por los tests.',
    category: 'Software',
    priority: 'media'
  };
}