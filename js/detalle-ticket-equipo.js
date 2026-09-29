import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin']);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { mostrarNotificacion } from './notificaciones.js';

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

const parametros = new URLSearchParams(window.location.search);
const idTicket = parametros.get('id');

const { data: ticket, error } = await supabase
  .from('tickets')
  .select('*')
  .eq('id', idTicket)
  .maybeSingle();

const contenedorDetalle = document.querySelector('#detalle-ticket');
const contenedorGestion = document.querySelector('#gestion-ticket');

function dibujarDetalle(ticket) {
  const formatoFechaHora = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-CL', formatoFechaHora);
  const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-CL', formatoFechaHora);

  contenedorDetalle.className = `tarjeta tarjeta--prioridad-${ticket.priority}`;
  contenedorDetalle.innerHTML = `
    <p class="ticket-id">N.° ${ticket.id.slice(0, 8)}</p>
    <h1>${ticket.title}</h1>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]} · ${ticket.category}</p>
    <p class="ticket-descripcion">${ticket.description}</p>
    <p class="ticket-fecha">Creado: ${fechaCreacion} · Última actualización: ${fechaActualizacion}</p>
  `;
}

function dibujarGestion(ticket) {
  const esAdmin = rolActual === 'admin';

  if (!esAdmin && ticket.assigned_to === null) {
    contenedorGestion.innerHTML = '<p>Toma este caso desde la bandeja para poder gestionarlo.</p>';
    return;
  }

  if (!esAdmin && ticket.status === 'cerrado') {
    contenedorGestion.innerHTML = '<p>Este ticket está cerrado y no se puede modificar.</p>';
    return;
  }

    contenedorGestion.innerHTML = `
    <h2>Gestionar ticket</h2>
    <form id="form-gestion">
      <div class="form-grupo">
        <label for="select-estado">Estado</label>
        <select id="select-estado">
          <option value="nuevo">Nuevo</option>
          <option value="en_revision">En revisión</option>
          <option value="en_progreso">En progreso</option>
          <option value="en_espera">En espera</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      <div class="form-grupo">
        <label for="select-prioridad">Prioridad</label>
        <select id="select-prioridad">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      <button class="boton" type="submit">Guardar cambios</button>
    </form>
  `;
  const selectEstado = contenedorGestion.querySelector('#select-estado');
  const selectPrioridad = contenedorGestion.querySelector('#select-prioridad');
  selectEstado.value = ticket.status;
  selectPrioridad.value = ticket.priority;

  contenedorGestion.querySelector('#form-gestion').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const { data, error } = await supabase
      .from('tickets')
      .update({ status: selectEstado.value, priority: selectPrioridad.value })
      .eq('id', ticket.id)
      .select();

    if (error) {
      mostrarNotificacion('No se pudieron guardar los cambios. Intenta de nuevo.', 'error');
      return;
    }

    if (data.length === 0) {
      mostrarNotificacion('No tienes permiso para modificar este ticket.', 'error');
      return;
    }

    mostrarNotificacion('Cambios guardados correctamente.', 'exito');
    dibujarDetalle(data[0]);
    dibujarGestion(data[0]);
  });
}

if (error || !ticket) {
  contenedorDetalle.innerHTML = '<p>No se encontró el ticket solicitado.</p>';
} else {
  dibujarDetalle(ticket);
  dibujarGestion(ticket);
}