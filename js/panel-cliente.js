import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente'], false); 
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

const { data: datosUsuario } = await supabase.auth.getUser();
const idUsuarioActual = datosUsuario.user.id;

const { data: datosTickets, error: errorTickets } = await supabase
  .from('tickets')
  .select('id, title, status, updated_at')
  .order('updated_at', { ascending: false });

const tickets = datosTickets || [];

const { data: datosComentarios, error: errorComentarios } = await supabase
  .from('comments')
  .select('id, ticket_id, body, author_id, created_at')
  .order('created_at', { ascending: false })
  .limit(4);

const ultimosComentarios = datosComentarios || [];

const listaTickets = document.querySelector('#lista-ultimos-tickets');

const ultimosTickets = tickets.slice(0, 2);

if (errorTickets) {
  listaTickets.innerHTML = '<li>No se pudieron cargar tus tickets.</li>';
} else {
  ultimosTickets.forEach((ticket) => {
    const item = document.createElement('li');
    const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
    item.classList.add('tarjeta');

    item.innerHTML = `
      <p class="ticket-titulo">${ticket.title}</p>
      <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${fecha}</p>
    `;

    listaTickets.appendChild(item);
  });
}

const listaComentarios = document.querySelector('#lista-ultimos-comentarios');

if (errorComentarios) {
  listaComentarios.innerHTML = '<li>No se pudieron cargar los comentarios.</li>';
} else {
  ultimosComentarios.forEach((comentario) => {
    const item = document.createElement('li');
    item.classList.add('tarjeta');

    const ticket = tickets.find((t) => t.id === comentario.ticket_id);
    const autor = comentario.author_id === idUsuarioActual ? 'Tú' : 'Equipo NTEK';
    const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
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
}

const resumenEstados = document.querySelector('#resumen-estados');

if (errorTickets) {
  resumenEstados.innerHTML = '<p>No se pudo calcular el resumen.</p>';
} else {
  Object.keys(etiquetasEstado).forEach((estado) => {
    const cantidad = tickets.filter((ticket) => ticket.status === estado).length;

    const item = document.createElement('div');
    item.classList.add('resumen-item');
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasEstado[estado]}</p>
    `;

    resumenEstados.appendChild(item);
  });
}

document.body.classList.remove('verificando');