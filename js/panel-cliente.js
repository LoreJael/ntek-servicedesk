import { ticketsSimulados, comentariosSimulados, perfilActual } from './datos-simulados.js';

// Se realiza una copia del arreglo antes de ordenar, para no modificar el original
const ticketsOrdenados = [...ticketsSimulados].sort(
  (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
);

// Nos quedamos solo con los 2 primeros de la lista ya ordenada
const ultimosTickets = ticketsOrdenados.slice(0, 2);

const etiquetasEstado = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_progreso: "En progreso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado"
};

const listaTickets = document.querySelector('#lista-ultimos-tickets');

ultimosTickets.forEach((ticket) => {
  const item = document.createElement('li');
  const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL');
  item.classList.add('tarjeta');

  item.innerHTML = `
    <p class="ticket-titulo">${ticket.title}</p>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${fecha}</p>
  `;

  listaTickets.appendChild(item);
});

// Sacamos las notas internas: el cliente nunca debe verlas
const comentariosPublicos = comentariosSimulados.filter(
  (comentario) => comentario.is_internal === false
);

// Ordenamos por fecha, del más reciente al más antiguo
const comentariosOrdenados = [...comentariosPublicos].sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

// Nos quedamos con los últimos 4
const ultimosComentarios = comentariosOrdenados.slice(0, 4);

const listaComentarios = document.querySelector('#lista-ultimos-comentarios');

ultimosComentarios.forEach((comentario) => {
  const item = document.createElement('li');
  item.classList.add('tarjeta');

  const ticket = ticketsSimulados.find((t) => t.id === comentario.ticket_id);
  const autor = comentario.author_id === perfilActual.id ? 'Tú' : 'Equipo NTEK';
  const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  item.innerHTML = `
    <p class="comentario-ticket">Sobre: <strong>${ticket.title}</strong></p>
    <p class="comentario-texto">${comentario.body}</p>
    <p class="comentario-meta">${autor} · ${fechaHora}</p>
  `;

  listaComentarios.appendChild(item);
});

const resumenEstados = document.querySelector('#resumen-estados');

Object.keys(etiquetasEstado).forEach((estado) => {
  const cantidad = ticketsSimulados.filter((ticket) => ticket.status === estado).length;

  const item = document.createElement('div');
  item.classList.add('resumen-item');
  item.innerHTML = `
    <p class="resumen-numero">${cantidad}</p>
    <p class="resumen-etiqueta">${etiquetasEstado[estado]}</p>
  `;

  resumenEstados.appendChild(item);
});