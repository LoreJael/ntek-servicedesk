import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente', 'tecnico', 'admin'], false);
import { crearHeaderCliente } from './header-cliente.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { mostrarNotificacion } from './notificaciones.js';
import { supabase } from './supabase-client.js';
import { obtenerIniciales } from './barra-lateral.js';
import { cargarPanelAdmin } from './perfil-admin.js';

const etiquetasRol = {
  cliente: 'Cliente',
  tecnico: 'Técnico',
  admin: 'Administrador'
};

const esCliente = rolActual === 'cliente';
document.getElementById('header-placeholder').innerHTML = esCliente
  ? crearHeaderCliente(rolActual)
  : crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

const { data: { session } } = await supabase.auth.getSession();

const { data: perfil, error: errorPerfil } = await supabase
  .from('profiles')
  .select('full_name, phone, company, created_at')
  .eq('id', session.user.id)
  .single();

const inputCorreo = document.getElementById('correo');
const inputNombre = document.getElementById('nombre');
const inputTelefono = document.getElementById('telefono');
const inputEmpresa = document.getElementById('empresa');
const grupoEmpresa = document.getElementById('grupo-empresa');

const vistaPerfil = document.getElementById('vista-perfil');
const verCorreo = document.getElementById('ver-correo');
const verNombre = document.getElementById('ver-nombre');
const verTelefono = document.getElementById('ver-telefono');
const verEmpresa = document.getElementById('ver-empresa');
const verIniciales = document.getElementById('ver-iniciales');
const verNombreTitulo = document.getElementById('ver-nombre-titulo');
const verRol = document.getElementById('ver-rol');
const verDesde = document.getElementById('ver-desde');
const botonEditar = document.getElementById('boton-editar');
const botonCancelar = document.getElementById('boton-cancelar');

function actualizarVista(nombre, telefono, empresa) {
  verNombre.textContent = nombre;
  verTelefono.textContent = telefono;
  verEmpresa.textContent = empresa;
  verNombreTitulo.textContent = nombre;
  verIniciales.textContent = obtenerIniciales(nombre);

  document.querySelector('.usuario-nombre').textContent = nombre;
  document.querySelector('.usuario-avatar').textContent = obtenerIniciales(nombre);
}

inputCorreo.value = session.user.email;
verCorreo.textContent = session.user.email;
verRol.textContent = etiquetasRol[rolActual];

if (!esCliente) {
  grupoEmpresa.hidden = true;
  inputEmpresa.required = false;
}

if (errorPerfil) {
  mostrarNotificacion('No se pudo cargar tu perfil. Intenta de nuevo.', 'error');
} else {
  const empresa = esCliente ? perfil.company : 'Equipo NTEK';
  inputNombre.value = perfil.full_name;
  inputTelefono.value = perfil.phone;
  inputEmpresa.value = perfil.company;
  actualizarVista(perfil.full_name, perfil.phone, empresa);

  const fechaCreacion = new Date(perfil.created_at).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santiago'
  });
  verDesde.textContent = `Cuenta creada el ${fechaCreacion}`;
}

if (rolActual === 'admin') {
  await cargarPanelAdmin();
}

document.body.classList.remove('verificando');

const formPerfil = document.getElementById('form-perfil');

formPerfil.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const cambios = {
    full_name: inputNombre.value,
    phone: inputTelefono.value
  };

  if (esCliente) {
    cambios.company = inputEmpresa.value;
  }

  const { error } = await supabase
    .from('profiles')
    .update(cambios)
    .eq('id', session.user.id);

  if (error) {
    mostrarNotificacion('No se pudieron guardar los cambios. Intenta de nuevo.', 'error');
    return;
  }

  mostrarNotificacion('Perfil actualizado.', 'exito');

  actualizarVista(inputNombre.value, inputTelefono.value, esCliente ? inputEmpresa.value : 'Equipo NTEK');
  formPerfil.hidden = true;
  vistaPerfil.hidden = false;
  botonEditar.hidden = false;
});

botonEditar.addEventListener('click', () => {
  vistaPerfil.hidden = true;
  formPerfil.hidden = false;
  botonEditar.hidden = true;
  inputNombre.focus();
});

botonCancelar.addEventListener('click', () => {
  inputNombre.value = verNombre.textContent;
  inputTelefono.value = verTelefono.textContent;
  if (esCliente) {
    inputEmpresa.value = verEmpresa.textContent;
  }
  formPerfil.hidden = true;
  vistaPerfil.hidden = false;
  botonEditar.hidden = false;
  botonEditar.focus();
});
