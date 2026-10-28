import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente'], false); 
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion, nombreUsuario } from './sesion.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';
import { mostrarEstadoVacio } from './estados.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const primerNombre = nombreUsuario.split(' ')[0];
document.querySelector('#saludo').textContent = `Hola, ${primerNombre}`;

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
  .select('id, title, status, updated_at, resuelto_at')
  .order('updated_at', { ascending: false });

const tickets = datosTickets || [];

// Aviso: tickets resueltos esperando respuesta del cliente
const ticketsResueltos = tickets.filter((ticket) => ticket.status === 'resuelto');

if (ticketsResueltos.length > 0) {
  const avisoPendientes = document.querySelector('#aviso-pendientes');
  const tituloPendientes = document.querySelector('#titulo-pendientes');
  const listaPendientes = document.querySelector('#lista-pendientes');

  tituloPendientes.textContent = ticketsResueltos.length === 1
    ? 'Tienes 1 ticket resuelto esperando tu respuesta'
    : `Tienes ${ticketsResueltos.length} tickets resueltos esperando tu respuesta`;

  ticketsResueltos.forEach((ticket) => {
    const fechaLimite = new Date(new Date(ticket.resuelto_at).getTime() + 7 * 24 * 60 * 60 * 1000);
    const textoFechaLimite = fechaLimite.toLocaleString('es-CL', {
      timeZone: 'America/Santiago',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const textoPlazo = fechaLimite > new Date()
      ? `Si no respondes, se cerrará automáticamente el ${textoFechaLimite}.`
      : 'El plazo para responder terminó y se cerrará automáticamente.';

    const item = document.createElement('li');
    item.innerHTML = `
      <a href="detalle-ticket.html?id=${ticket.id}">${escaparHTML(ticket.title)}</a>
      · ${textoPlazo}
    `;

    listaPendientes.appendChild(item);
  });

  avisoPendientes.hidden = false;
}

const { data: datosComentarios, error: errorComentarios } = await supabase
  .from('comments')
  .select('id, ticket_id, body, author_id, created_at')
  .order('created_at', { ascending: false })
  .limit(4);

const ultimosComentarios = datosComentarios || [];

const listaTickets = document.querySelector('#lista-ultimos-tickets');

const ultimosTickets = tickets.slice(0, 5);

if (errorTickets) {
  listaTickets.innerHTML = '<p>No se pudieron cargar tus tickets.</p>';
} else if (ultimosTickets.length === 0) {
  mostrarEstadoVacio(listaTickets, 'Aún no tienes solicitudes.');
} else {
  const tabla = document.createElement('table');
  tabla.classList.add('tabla', 'tabla--compacta');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Título</th>
        <th scope="col">Estado</th>
        <th scope="col">Actualizado</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const cuerpoTabla = tabla.querySelector('tbody');

  ultimosTickets.forEach((ticket) => {
    const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td data-label="ID" class="celda-id">${ticket.id.slice(0, 8)}</td>
      <td data-label="Título" class="celda-titulo">
        <a class="enlace-ticket" href="detalle-ticket.html?id=${ticket.id}">${escaparHTML(ticket.title)}</a>
      </td>
      <td data-label="Estado">
        <span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>
      </td>
      <td data-label="Actualizado">${fecha}</td>
    `;

    cuerpoTabla.appendChild(fila);
  });

  listaTickets.appendChild(tabla);
}

const listaComentarios = document.querySelector('#lista-ultimos-comentarios');

if (errorComentarios) {
  listaComentarios.innerHTML = '<li>No se pudieron cargar los comentarios.</li>';
} else if (ultimosComentarios.length === 0) {
  mostrarEstadoVacio(listaComentarios, 'Aún no hay comentarios en tus tickets.');
} else {
  ultimosComentarios.forEach((comentario) => {
    const item = document.createElement('li');
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
      <a class="tarjeta-ticket" href="detalle-ticket.html?id=${comentario.ticket_id}">
        <p class="comentario-ticket">Sobre: <strong>${escaparHTML(ticket.title)}</strong></p>
        <p class="comentario-texto">${escaparHTML(comentario.body)}</p>
        <p class="comentario-meta">${autor} · ${fechaHora}</p>
      </a>
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
    item.classList.add('resumen-item', `resumen-item--${estado}`);
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasEstado[estado]}</p>
    `;

    resumenEstados.appendChild(item);
  });
}

document.body.classList.remove('verificando');