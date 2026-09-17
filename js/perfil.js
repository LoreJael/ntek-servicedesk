import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente']);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';
import { supabase } from './supabase-client.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const { data: { session } } = await supabase.auth.getSession();

const { data: perfil, error: errorPerfil } = await supabase
  .from('profiles')
  .select('full_name, phone, company')
  .eq('id', session.user.id)
  .single();

const inputCorreo = document.getElementById('correo');
const inputNombre = document.getElementById('nombre');
const inputTelefono = document.getElementById('telefono');
const inputEmpresa = document.getElementById('empresa');

inputCorreo.value = session.user.email;

if (errorPerfil) {
  mostrarNotificacion('No se pudo cargar tu perfil. Intenta de nuevo.', 'error');
} else {
  inputNombre.value = perfil.full_name;
  inputTelefono.value = perfil.phone;
  inputEmpresa.value = perfil.company;
}

const formPerfil = document.getElementById('form-perfil');

formPerfil.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: inputNombre.value,
      phone: inputTelefono.value,
      company: inputEmpresa.value
    })
    .eq('id', session.user.id);

  if (error) {
    mostrarNotificacion('No se pudieron guardar los cambios. Intenta de nuevo.', 'error');
    return;
  }

  mostrarNotificacion('Perfil actualizado correctamente.', 'exito');
});