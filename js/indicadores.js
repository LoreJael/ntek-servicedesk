import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { etiquetasEstado, etiquetasPrioridad } from './etiquetas.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

const { data: tickets, error } = await supabase
  .from('tickets')
  .select('id, title, status, priority, created_at, resuelto_at')
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
        <th scope="col">N.º</th>
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
      <td data-label="N.º" class="celda-id">${ticket.id.slice(0, 8)}</td>
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

function formatearDuracion(milisegundos) {
  const horasTotales = Math.round(milisegundos / (1000 * 60 * 60));
  const dias = Math.floor(horasTotales / 24);
  const horas = horasTotales % 24;

  if (dias === 0) {
    return `${horas} h`;
  }

  return `${dias} d ${horas} h`;
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

  const tiempoPromedio = document.querySelector('#tiempo-promedio');

  const ticketsResueltos = tickets.filter((ticket) =>
    (ticket.status === 'resuelto' || ticket.status === 'cerrado') && ticket.resuelto_at
  );

  if (ticketsResueltos.length === 0) {
    mostrarEstadoVacio(tiempoPromedio, 'Aún no hay tickets resueltos para calcular este indicador.');
  } else {
    let sumaMilisegundos = 0;

    ticketsResueltos.forEach((ticket) => {
      sumaMilisegundos += new Date(ticket.resuelto_at) - new Date(ticket.created_at);
    });

    const promedio = sumaMilisegundos / ticketsResueltos.length;

    tiempoPromedio.innerHTML = `
      <p class="resumen-numero">${formatearDuracion(promedio)}</p>
      <p class="resumen-etiqueta">Calculado sobre ${ticketsResueltos.length} tickets resueltos o cerrados</p>
    `;
  }

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