import { protegerRuta } from './sesion.js';
import { supabase } from './supabase-client.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const formNuevaSolicitud = document.getElementById('form-nueva-solicitud');

const botonEnviar = formNuevaSolicitud.querySelector('button[type="submit"]');
const textoOriginalBoton = botonEnviar.textContent;

formNuevaSolicitud.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (titulo === '' || descripcion === '') {
    mostrarNotificacion('El título y la descripción no pueden estar vacíos.', 'error');
    return;
  }

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Procesando solicitud...';

  const { data: datosUsuario } = await supabase.auth.getUser();

  const nuevoTicket = {
    title: titulo,
    description: descripcion,
    category: document.getElementById('categoria').value,
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
    botonEnviar.disabled = false;
    botonEnviar.textContent = textoOriginalBoton;
    return;
  }

  const idCorto = data.id.slice(0, 8);
  mostrarNotificacion(`Solicitud creada con el N.° ${idCorto}. Quedó en estado Nuevo.`, 'exito');
    setTimeout(() => {
    window.location.href = `detalle-ticket.html?id=${data.id}`;
  }, 2000);
});