import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderEquipo(rolActual);
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
  .select('id, title, status, priority, created_at')
  .order('created_at', { ascending: false });

const contenido = document.querySelector('#indicadores-contenido');

function pintarTickets(contenedor, lista, mensajeVacio) {
  contenedor.innerHTML = '';

  if (lista.length === 0) {
    mostrarEstadoVacio(contenedor, mensajeVacio);
    return;
  }

  const tabla = document.createElement('table');
  tabla.classList.add('tabla', 'tabla--compacta');
  tabla.innerHTML = `
    <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Título</th>
        <th scope="col">Estado</th>
        <th scope="col">Prioridad</th>
        <th scope="col">Creado</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const cuerpoTabla = tabla.querySelector('tbody');

  lista.forEach((ticket) => {
    const fecha = new Date(ticket.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td data-label="ID" class="celda-id">${ticket.id.slice(0, 8)}</td>
      <td data-label="Título" class="celda-titulo">
        <a class="enlace-ticket" href="detalle-ticket.html?id=${ticket.id}">${escaparHTML(ticket.title)}</a>
      </td>
      <td data-label="Estado">
        <span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>
      </td>
      <td data-label="Prioridad">
        <span class="badge-prioridad badge-prioridad--${ticket.priority}">${etiquetasPrioridad[ticket.priority]}</span>
      </td>
      <td data-label="Creado">${fecha}</td>
    `;

    cuerpoTabla.appendChild(fila);
  });

  contenedor.appendChild(tabla);
}

if (error) {
  console.error(error);
  mostrarErrorRecuperable(contenido, 'No pudimos cargar los indicadores.', () => location.reload());
} else if (tickets.length === 0) {
  mostrarEstadoVacio(contenido, 'Aún no hay tickets para mostrar.');
} else {
  const resumenPorEstado = document.querySelector('#resumen-por-estado');

  Object.keys(etiquetasEstado).forEach((estado) => {
    const cantidad = tickets.filter((ticket) => ticket.status === estado).length;

    const item = document.createElement('a');
    item.href = `bandeja-global.html?estado=${estado}`;
    item.classList.add('resumen-item', `resumen-item--${estado}`);
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasEstado[estado]}</p>
    `;

    resumenPorEstado.appendChild(item);
  });

  const resumenPorPrioridad = document.querySelector('#resumen-por-prioridad');

  Object.keys(etiquetasPrioridad).forEach((prioridad) => {
    const cantidad = tickets.filter((ticket) => ticket.priority === prioridad).length;

    const item = document.createElement('a');
    item.href = `bandeja-global.html?prioridad=${prioridad}`;
    item.classList.add('resumen-item', `resumen-item--${prioridad}`);
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasPrioridad[prioridad]}</p>
    `;

    resumenPorPrioridad.appendChild(item);
  });

  const listaAltaPrioridad = document.querySelector('#lista-alta-prioridad');
  const listaRecientes = document.querySelector('#lista-recientes');

  const altaPrioridad = tickets
    .filter((ticket) => ticket.priority === 'alta' || ticket.priority === 'critica')
    .filter((ticket) => ticket.status !== 'resuelto' && ticket.status !== 'cerrado')
    .slice(0, 5);

  const recientes = tickets.slice(0, 5);

  pintarTickets(listaAltaPrioridad, altaPrioridad, 'No hay tickets de alta prioridad abiertos.');
  pintarTickets(listaRecientes, recientes, 'Aún no hay tickets.');
}

document.body.classList.remove('verificando');