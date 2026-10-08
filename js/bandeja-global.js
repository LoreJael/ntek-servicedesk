import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from "./header-equipo.js";
import { activarBotonCerrarSesion } from "./sesion.js";
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { mostrarNotificacion } from './notificaciones.js';

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

let tickets = [];
let perfiles = [];

const listaTickets = document.querySelector('#lista-tickets');

async function cargarTickets() {
  const { data: datosTickets, error: errorTickets } = await supabase
    .from('tickets')
    .select('*')
    .order('updated_at', { ascending: false });

  const { data: datosPerfiles, error: errorPerfiles } = await supabase
    .from('profiles')
    .select('id, full_name, company');

  if (errorTickets || errorPerfiles) {
    console.error(errorTickets || errorPerfiles);
    mostrarErrorRecuperable(listaTickets, 'No pudimos cargar la bandeja.', () => location.reload());
    return;
  }

  tickets = datosTickets;
  perfiles = datosPerfiles;
  aplicarFiltros();
}

function dibujarTickets(lista) {
  listaTickets.innerHTML = '';

  if (lista.length === 0) {
    mostrarEstadoVacio(listaTickets, 'No hay tickets para mostrar.');
    return;
  }

  lista.forEach((ticket) => {
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
      <a class="boton" href="detalle-ticket.html?id=${ticket.id}">Ver detalle</a>
      ${botonTomarCaso}
      
    `;

    const boton = item.querySelector('button[data-ticket-id]');
    if (boton) {
      boton.addEventListener('click', () => tomarCaso(ticket.id));
    }

    listaTickets.appendChild(item);

  });
}

async function tomarCaso(idTicket) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('tickets')
    .update({ assigned_to: user.id })
    .eq('id', idTicket)
    .is('assigned_to', null)
    .select();

  if (error) {
    mostrarNotificacion('No se pudo tomar el caso. Intenta de nuevo.', 'error');
    return;
  }

  if (data.length === 0) {
    mostrarNotificacion('Este caso ya fue tomado por otro técnico.', 'error');
    await cargarTickets();
    return;
  }

  mostrarNotificacion('Tomaste el caso correctamente.', 'exito');
  await cargarTickets();

}

const filtroTexto = document.querySelector('#filtro-texto');
const filtroEstado = document.querySelector('#filtro-estado');
const filtroPrioridad = document.querySelector('#filtro-prioridad');
const filtroCategoria = document.querySelector('#filtro-categoria');

function aplicarFiltros() {
  const texto = filtroTexto.value.toLowerCase();
  const estado = filtroEstado.value;
  const prioridad = filtroPrioridad.value;
  const categoria = filtroCategoria.value;

  const filtrados = tickets.filter((ticket) => {
    const coincideTexto = ticket.title.toLowerCase().includes(texto);
    const coincideEstado = estado === '' || ticket.status === estado;
    const coincidePrioridad = prioridad === '' || ticket.priority === prioridad;
    const coincideCategoria = categoria === '' || ticket.category === categoria;

    return coincideTexto && coincideEstado && coincidePrioridad && coincideCategoria;
  });

  dibujarTickets(filtrados);
}


filtroTexto.addEventListener('input', aplicarFiltros);
filtroEstado.addEventListener('change', aplicarFiltros);
filtroPrioridad.addEventListener('change', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);

const botonLimpiar = document.querySelector('#boton-limpiar');

botonLimpiar.addEventListener('click', () => {
  filtroTexto.value = '';
  filtroEstado.value = '';
  filtroPrioridad.value = '';
  filtroCategoria.value = '';
  aplicarFiltros();
});

await cargarTickets();
document.body.classList.remove('verificando');

