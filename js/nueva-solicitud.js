import { protegerRuta } from './sesion.js';
import { supabase } from './supabase-client.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const formNuevaSolicitud = document.getElementById('form-nueva-solicitud');

formNuevaSolicitud.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const { data: datosUsuario } = await supabase.auth.getUser();

  const nuevoTicket = {
    title: document.getElementById('titulo').value,
    category: document.getElementById('categoria').value,
    description: document.getElementById('descripcion').value,
    priority: document.getElementById('prioridad').value,
    created_by: datosUsuario.user.id
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(nuevoTicket)
    .select('id')
    .single();

  if (error) {
    console.error(error);
    mostrarNotificacion('No se pudo crear la solicitud. Inténtalo de nuevo.', 'error');
    return;
  }

  const idCorto = data.id.slice(0, 8);
  mostrarNotificacion(`Solicitud creada con el N.° ${idCorto}. Quedó en estado Nuevo.`, 'exito');
  formNuevaSolicitud.reset();
});