import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin']);
import { crearHeaderEquipo } from "./header-equipo.js";
import { activarBotonCerrarSesion } from "./sesion.js";
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';

document.getElementById("header-placeholder").innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

import { supabase } from './supabase-client.js';

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

const { data: tickets, error: errorTickets } = await supabase
  .from('tickets')
  .select('*')
  .order('updated_at', { ascending: false });

const { data: perfiles, error: errorPerfiles } = await supabase
  .from('profiles')
  .select('id, full_name, company');

const listaTickets = document.querySelector('#lista-tickets');

if (errorTickets || errorPerfiles) {
  console.error(errorTickets || errorPerfiles);
  mostrarErrorRecuperable(listaTickets, 'No pudimos cargar la bandeja.', () => location.reload());
} else if (tickets.length === 0) {
  mostrarEstadoVacio(listaTickets, 'No hay tickets para mostrar.');
} else {
  tickets.forEach((ticket) => {
    const cliente = perfiles.find((perfil) => perfil.id === ticket.created_by);
    const tecnico = perfiles.find((perfil) => perfil.id === ticket.assigned_to);

    const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    const botonTomarCaso = ticket.assigned_to === null
      ? `<button class="boton" data-ticket-id="${ticket.id}">Tomar caso</button>`
      : '';

    const item = document.createElement('li');
    item.classList.add('tarjeta', `tarjeta--prioridad-${ticket.priority}`);

    item.innerHTML = `
      <p class="ticket-titulo">${ticket.title}</p>
      <p class="ticket-cliente">${cliente ? cliente.company : 'Cliente no disponible'}</p>
      <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]}</p>
      <p class="ticket-asignado">${tecnico ? 'Asignado a ' + tecnico.full_name : 'Sin asignar'}</p>
      <p class="ticket-fecha">${fecha}</p>
      ${botonTomarCaso}
    `;

    listaTickets.appendChild(item);
  });
}