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

const vistaPerfil = document.getElementById('vista-perfil');
const verCorreo = document.getElementById('ver-correo');
const verNombre = document.getElementById('ver-nombre');
const verTelefono = document.getElementById('ver-telefono');
const verEmpresa = document.getElementById('ver-empresa');
const botonEditar = document.getElementById('boton-editar');
const botonCancelar = document.getElementById('boton-cancelar');

inputCorreo.value = session.user.email;

verCorreo.textContent = session.user.email;

if (errorPerfil) {
  mostrarNotificacion('No se pudo cargar tu perfil. Intenta de nuevo.', 'error');
} else {
  inputNombre.value = perfil.full_name;
  inputTelefono.value = perfil.phone;
  inputEmpresa.value = perfil.company;
  verNombre.textContent = perfil.full_name;
  verTelefono.textContent = perfil.phone;
  verEmpresa.textContent = perfil.company;
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

  verNombre.textContent = inputNombre.value;
  verTelefono.textContent = inputTelefono.value;
  verEmpresa.textContent = inputEmpresa.value;
  formPerfil.hidden = true;
  vistaPerfil.hidden = false;
});

  botonEditar.addEventListener('click', () => {
    vistaPerfil.hidden = true;
    formPerfil.hidden = false;
  });

  botonCancelar.addEventListener('click', () => {
    inputNombre.value = verNombre.textContent;
    inputTelefono.value = verTelefono.textContent;
    inputEmpresa.value = verEmpresa.textContent;
    formPerfil.hidden = true;
    vistaPerfil.hidden = false;
  });

