import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin']);
import { crearHeaderEquipo } from "./header-equipo.js";
import { activarBotonCerrarSesion } from "./sesion.js";

document.getElementById("header-placeholder").innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

import { perfilesSimulados, ticketsEquipoSimulados } from "./datos-simulados-equipo.js";

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

const listaTickets = document.querySelector('#lista-tickets');

ticketsEquipoSimulados.forEach((ticket) => {
  const cliente = perfilesSimulados.find((perfil) => perfil.id === ticket.created_by);
  const tecnico = perfilesSimulados.find((perfil) => perfil.id === ticket.assigned_to);

  const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL');

  const botonTomarCaso = ticket.assigned_to === null
    ? `<button class="boton" data-ticket-id="${ticket.id}">Tomar caso</button>`
    : '';

  const item = document.createElement('li');
  item.classList.add('tarjeta', `tarjeta--prioridad-${ticket.priority}`);

  item.innerHTML = `
    <p class="ticket-titulo">${ticket.title}</p>
    <p class="ticket-cliente">${cliente.company}</p>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]}</p>
    <p class="ticket-asignado">${tecnico ? 'Asignado a ' + tecnico.full_name : 'Sin asignar'}</p>
    <p class="ticket-fecha">${fecha}</p>
    ${botonTomarCaso}
  `;

  listaTickets.appendChild(item);
});