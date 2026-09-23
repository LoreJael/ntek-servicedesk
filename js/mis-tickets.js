import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const etiquetasEstado = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_progreso: "En progreso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado"
};

const etiquetasPrioridad = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica"
};

const { data: tickets, error } = await supabase
  .from('tickets')
  .select('id, title, status, priority, updated_at')
  .order('updated_at', { ascending: false });

if (error) {
  console.error(error);
}

const listaTickets = document.querySelector('#lista-tickets');

(tickets ?? []).forEach((ticket) => {
  const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

  const item = document.createElement('li');
  item.classList.add('tarjeta', `tarjeta--prioridad-${ticket.priority}`);

  item.innerHTML = `
    <p class="ticket-id">N.° ${ticket.id.slice(0, 8)}</p>
    <p class="ticket-titulo">${ticket.title}</p>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]}</p>
    <p class="ticket-fecha">${fecha}</p>
    <a href="detalle-ticket.html?id=${ticket.id}" class="boton">Ver detalle</a>
  `;

  listaTickets.appendChild(item);
});