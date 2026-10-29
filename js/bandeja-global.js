import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from "./header-equipo.js";
import { activarBotonCerrarSesion } from "./sesion.js";
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { mostrarNotificacion } from './notificaciones.js';
import { escaparHTML } from './seguridad.js';
import { obtenerPagina, pintarPaginacion } from './paginacion.js';

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
const contenedorPaginacion = document.querySelector('#paginacion');
let ticketsFiltrados = [];

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

  const tabla = document.createElement('table');
  tabla.classList.add('tabla');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th scope="col">N.º</th>
        <th scope="col">Título</th>
        <th scope="col">Cliente</th>
        <th scope="col">Estado</th>
        <th scope="col">Prioridad</th>
        <th scope="col">Asignado a</th>
        <th scope="col">Actualizado</th>
        <th scope="col">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const cuerpoTabla = tabla.querySelector('tbody');

    lista.forEach((ticket) => {
    const cliente = perfiles.find((perfil) => perfil.id === ticket.created_by);
    const tecnico = perfiles.find((perfil) => perfil.id === ticket.assigned_to);

    const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

      const botonTomarCaso = ticket.assigned_to === null && ticket.status !== 'cerrado'
      ? `<button class="boton" data-ticket-id="${ticket.id}">Tomar caso</button>`
      : '';

    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td data-label="N.º" class="celda-id">${ticket.id.slice(0, 8)}</td>
      <td data-label="Título" class="celda-titulo">${escaparHTML(ticket.title)}</td>
      <td data-label="Cliente">${cliente ? escaparHTML(cliente.company) : 'Cliente no disponible'}</td>
      <td data-label="Estado">
        <span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>
      </td>
      <td data-label="Prioridad">
        <span class="badge-prioridad badge-prioridad--${ticket.priority}">${etiquetasPrioridad[ticket.priority]}</span>
      </td>
      <td data-label="Asignado a">${tecnico ? escaparHTML(tecnico.full_name) : 'Sin asignar'}</td>
      <td data-label="Actualizado">${fecha}</td>
      <td data-label="Acciones" class="celda-acciones">
        <a class="boton" href="detalle-ticket.html?id=${ticket.id}">Ver detalle</a>
        ${botonTomarCaso}
      </td>
    `;

    const boton = fila.querySelector('button[data-ticket-id]');
    if (boton) {
      boton.addEventListener('click', () => tomarCaso(ticket.id));
    }

    cuerpoTabla.appendChild(fila);
  });

  listaTickets.appendChild(tabla);
}

function mostrarPagina(numeroPagina) {
  dibujarTickets(obtenerPagina(ticketsFiltrados, numeroPagina));
  pintarPaginacion(contenedorPaginacion, ticketsFiltrados.length, numeroPagina, mostrarPagina);
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

  mostrarNotificacion('Tomaste el caso.', 'exito');
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

  ticketsFiltrados = filtrados;
  mostrarPagina(1);
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

const parametros = new URLSearchParams(window.location.search);
filtroEstado.value = parametros.get('estado') || '';
filtroPrioridad.value = parametros.get('prioridad') || '';

await cargarTickets();
document.body.classList.remove('verificando');

