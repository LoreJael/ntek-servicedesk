import { protegerRuta } from './sesion.js';
import { supabase } from './supabase-client.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const formNuevaSolicitud = document.getElementById('form-nueva-solicitud');

function activarContador(campo, contador, maximo) {
  const actualizar = () => {
    contador.textContent = `${[...campo.value].length} / ${maximo}`;
  };

  campo.addEventListener('input', actualizar);
  actualizar();
}

activarContador(document.getElementById('titulo'), document.getElementById('contador-titulo'), 120);
activarContador(document.getElementById('descripcion'), document.getElementById('contador-descripcion'), 2000);

const botonEnviar = formNuevaSolicitud.querySelector('button[type="submit"]');
const textoOriginalBoton = botonEnviar.textContent;

formNuevaSolicitud.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

    const largoTitulo = [...titulo].length;
  const largoDescripcion = [...descripcion].length;

  if (largoTitulo < 5 || largoTitulo > 120) {
    mostrarNotificacion('El título debe tener entre 5 y 120 caracteres.', 'error');
    return;
  }

  if (largoDescripcion < 10 || largoDescripcion > 2000) {
    mostrarNotificacion('La descripción debe tener entre 10 y 2000 caracteres.', 'error');
    return;
  }
  
  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando solicitud...';

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
    mostrarNotificacion('No se pudo enviar la solicitud. Intenta de nuevo.', 'error');
    botonEnviar.disabled = false;
    botonEnviar.textContent = textoOriginalBoton;
    return;
  }

  const idCorto = data.id.slice(0, 8);
  mostrarNotificacion(`Ticket creado con el N.º ${idCorto}. Quedó en estado Nuevo.`, 'exito');
    setTimeout(() => {
    window.location.href = `detalle-ticket.html?id=${data.id}`;
  }, 2000);
});