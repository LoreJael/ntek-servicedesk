import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { comentariosSimulados, perfilActual } from './datos-simulados.js';

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

// Lee "?id=101" desde la URL actual
const parametros = new URLSearchParams(window.location.search);
const idTicket = parametros.get('id');

const { data: ticket, error } = await supabase
  .from('tickets')
  .select('*')
  .eq('id', idTicket)
  .maybeSingle();

const contenedorDetalle = document.querySelector('#detalle-ticket');

if (error || !ticket) {
  contenedorDetalle.innerHTML = '<p>No se encontró el ticket solicitado.</p>';
} else {
  const formatoFechaHora = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-CL', formatoFechaHora);
  const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-CL', formatoFechaHora);

  contenedorDetalle.classList.add(`tarjeta--prioridad-${ticket.priority}`);
  contenedorDetalle.innerHTML = `
  <p class="ticket-id">N.° ${ticket.id.slice(0, 8)}</p>
    <h1>${ticket.title}</h1>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]} · ${ticket.category}</p>
    <p class="ticket-descripcion">${ticket.description}</p>
    <p class="ticket-fecha">Creado: ${fechaCreacion} · Última actualización: ${fechaActualizacion}</p>
  `;

  const comentariosDelTicket = comentariosSimulados
    .filter((comentario) => comentario.ticket_id === ticket.id && comentario.is_internal === false)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const listaComentarios = document.querySelector('#lista-comentarios-ticket');

  comentariosDelTicket.forEach((comentario) => {
    const item = document.createElement('li');
    item.classList.add('tarjeta');

    const autor = comentario.author_id === perfilActual.id ? 'Tú' : 'Equipo NTEK';
    const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    item.innerHTML = `
      <p class="comentario-texto">${comentario.body}</p>
      <p class="comentario-meta">${autor} · ${fechaHora}</p>
    `;

    listaComentarios.appendChild(item);
  });
}