import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { ticketsSimulados } from './datos-simulados.js';

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

// Mismo criterio que en panel-cliente.js: los más recientes primero
const ticketsOrdenados = [...ticketsSimulados].sort(
  (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
);

const listaTickets = document.querySelector('#lista-tickets');

ticketsOrdenados.forEach((ticket) => {
  const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL');

  const item = document.createElement('li');
  item.classList.add('tarjeta', `tarjeta--prioridad-${ticket.priority}`);

  item.innerHTML = `
    <p class="ticket-id">N.° ${ticket.id}</p>
    <p class="ticket-titulo">${ticket.title}</p>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]}</p>
    <p class="ticket-fecha">${fecha}</p>
  `;

  listaTickets.appendChild(item);
});