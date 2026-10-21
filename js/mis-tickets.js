import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente'], false);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { escaparHTML } from './seguridad.js';
import { obtenerPagina, pintarPaginacion } from './paginacion.js';

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
  .select('id, title, status, priority, category, updated_at')
  .order('updated_at', { ascending: false });

const listaTickets = document.querySelector('#lista-tickets');
const contenedorPaginacion = document.querySelector('#paginacion');
let ticketsFiltrados = [];

function mostrarPagina(numeroPagina) {
  listaTickets.innerHTML = '';

  if (ticketsFiltrados.length === 0) {
    mostrarEstadoVacio(listaTickets, 'No hay tickets que coincidan con los filtros.');
    contenedorPaginacion.innerHTML = '';
    return;
  }

  const ticketsDeLaPagina = obtenerPagina(ticketsFiltrados, numeroPagina);

  const tabla = document.createElement('table');
  tabla.classList.add('tabla');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Título</th>
        <th scope="col">Estado</th>
        <th scope="col">Prioridad</th>
        <th scope="col">Actualizado</th>
        <th scope="col">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const cuerpoTabla = tabla.querySelector('tbody');

  ticketsDeLaPagina.forEach((ticket) => {
    const fecha = new Date(ticket.updated_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td data-label="ID" class="celda-id">${ticket.id.slice(0, 8)}</td>
      <td data-label="Título" class="celda-titulo">${escaparHTML(ticket.title)}</td>
      <td data-label="Estado">
        <span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>
      </td>
      <td data-label="Prioridad">
        <span class="badge-prioridad badge-prioridad--${ticket.priority}">${etiquetasPrioridad[ticket.priority]}</span>
      </td>
      <td data-label="Actualizado">${fecha}</td>
      <td data-label="Acciones" class="celda-acciones">
        <a href="detalle-ticket.html?id=${ticket.id}" class="boton">Ver detalle</a>
      </td>
    `;

    cuerpoTabla.appendChild(fila);
  });

  listaTickets.appendChild(tabla);

  pintarPaginacion(contenedorPaginacion, ticketsFiltrados.length, numeroPagina, mostrarPagina);
}

const filtroTexto = document.querySelector('#filtro-texto');
const filtroEstado = document.querySelector('#filtro-estado');
const filtroPrioridad = document.querySelector('#filtro-prioridad');
const filtroCategoria = document.querySelector('#filtro-categoria');
const botonLimpiar = document.querySelector('#boton-limpiar');

function aplicarFiltros() {
  const texto = filtroTexto.value.toLowerCase();
  const estado = filtroEstado.value;
  const prioridad = filtroPrioridad.value;
  const categoria = filtroCategoria.value;

  ticketsFiltrados = tickets.filter((ticket) => {
    const coincideTexto = ticket.title.toLowerCase().includes(texto);
    const coincideEstado = estado === '' || ticket.status === estado;
    const coincidePrioridad = prioridad === '' || ticket.priority === prioridad;
    const coincideCategoria = categoria === '' || ticket.category === categoria;

    return coincideTexto && coincideEstado && coincidePrioridad && coincideCategoria;
  });

  mostrarPagina(1);
}

filtroTexto.addEventListener('input', aplicarFiltros);
filtroEstado.addEventListener('change', aplicarFiltros);
filtroPrioridad.addEventListener('change', aplicarFiltros);
filtroCategoria.addEventListener('change', aplicarFiltros);

botonLimpiar.addEventListener('click', () => {
  filtroTexto.value = '';
  filtroEstado.value = '';
  filtroPrioridad.value = '';
  filtroCategoria.value = '';
  aplicarFiltros();
});

if (error) {
  console.error(error);
  mostrarErrorRecuperable(listaTickets, 'No pudimos cargar tus tickets.', () => location.reload());
} else if (tickets.length === 0) {
  mostrarEstadoVacio(listaTickets, 'Aún no tienes solicitudes. Puedes crear una desde Nueva solicitud.');
} else {
  aplicarFiltros();
}

document.body.classList.remove('verificando');