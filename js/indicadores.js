import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';

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

const resumenPorEstado = document.querySelector('#resumen-por-estado');

if (error) {
  resumenPorEstado.innerHTML = '<p>No se pudieron cargar los indicadores.</p>';
} else {
  Object.keys(etiquetasEstado).forEach((estado) => {
    const cantidad = tickets.filter((ticket) => ticket.status === estado).length;

    const item = document.createElement('a');
    item.href = `bandeja-global.html?estado=${estado}`;
    item.classList.add('resumen-item');
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasEstado[estado]}</p>
    `;

    resumenPorEstado.appendChild(item);
  });
}

const resumenPorPrioridad = document.querySelector('#resumen-por-prioridad');

if (error) {
  resumenPorPrioridad.innerHTML = '<p>No se pudieron cargar los indicadores.</p>';
} else {
  Object.keys(etiquetasPrioridad).forEach((prioridad) => {
    const cantidad = tickets.filter((ticket) => ticket.priority === prioridad).length;

    const item = document.createElement('a');
    item.href = `bandeja-global.html?prioridad=${prioridad}`;
    item.classList.add('resumen-item');
    item.innerHTML = `
      <p class="resumen-numero">${cantidad}</p>
      <p class="resumen-etiqueta">${etiquetasPrioridad[prioridad]}</p>
    `;
    resumenPorPrioridad.appendChild(item);
  });
}

const listaAltaPrioridad = document.querySelector('#lista-alta-prioridad');
const listaRecientes = document.querySelector('#lista-recientes');

function pintarTickets(contenedor, lista, mensajeVacio) {
  if (lista.length === 0) {
    contenedor.innerHTML = `<li>${mensajeVacio}</li>`;
    return;
  }

  lista.forEach((ticket) => {
    const item = document.createElement('li');
    const fecha = new Date(ticket.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });

    item.innerHTML = `
      <a class="tarjeta-ticket" href="detalle-ticket.html?id=${ticket.id}">
        <p class="ticket-titulo">${escaparHTML(ticket.title)}</p>
        <p class="ticket-meta">
          <span class="badge-estado">${etiquetasEstado[ticket.status]}</span>
          <span>${etiquetasPrioridad[ticket.priority]}</span>
          <span>${fecha}</span>
        </p>
      </a>
    `;

    contenedor.appendChild(item);
  });
}

if (error) {
  listaAltaPrioridad.innerHTML = '<li>No se pudieron cargar los tickets.</li>';
  listaRecientes.innerHTML = '<li>No se pudieron cargar los tickets.</li>';
} else {
  const altaPrioridad = tickets
    .filter((ticket) => ticket.priority === 'alta' || ticket.priority === 'critica')
    .filter((ticket) => ticket.status !== 'resuelto' && ticket.status !== 'cerrado')
    .slice(0, 5);

  const recientes = tickets.slice(0, 5);

  pintarTickets(listaAltaPrioridad, altaPrioridad, 'No hay tickets de alta prioridad abiertos.');
  pintarTickets(listaRecientes, recientes, 'Aún no hay tickets.');
}

document.body.classList.remove('verificando');