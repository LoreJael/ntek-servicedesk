import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const formNuevaSolicitud = document.getElementById('form-nueva-solicitud');

formNuevaSolicitud.addEventListener('submit', (evento) => {
  evento.preventDefault();

  // Todavía no existe tabla de tickets en Supabase, así que por ahora
  // solo simulamos la confirmación con un ID inventado
  const idSimulado = Math.floor(Math.random() * 900) + 100;

  mostrarNotificacion(`Solicitud creada con el N.° ${idSimulado}. Quedó en estado Nuevo.`, 'exito');
  formNuevaSolicitud.reset();
});