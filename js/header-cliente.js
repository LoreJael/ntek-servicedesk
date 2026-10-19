import { nombreUsuario } from './sesion.js';
import { escaparHTML } from './seguridad.js';

const etiquetasRol = {
  cliente: "Cliente"
};

function crearEnlace(href, texto) {
  const esPaginaActual = location.pathname.endsWith(href);
  return `<a href="${href}" ${esPaginaActual ? 'aria-current="page"' : ''}>${texto}</a>`;
}

function obtenerIniciales(nombre) {
  return nombre
    .split(' ')
    .filter((parte) => parte !== '')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function crearHeaderCliente(rol) {
  return `
    <header class="header">
      <p class="logo">NTEK ServiceDesk Lite</p>
      <nav class="nav-principal" aria-label="Principal">
        ${crearEnlace("panel.html", "Panel")}
        ${crearEnlace("mis-tickets.html", "Mis tickets")}
        ${crearEnlace("nueva-solicitud.html", "Nueva solicitud")}
        ${crearEnlace("perfil.html", "Perfil")}
      </nav>
        <div class="header-usuario">
        <div class="usuario-info">
          <span class="usuario-avatar" aria-hidden="true">${obtenerIniciales(nombreUsuario)}</span>
          <div class="usuario-datos">
            <span class="usuario-nombre">${escaparHTML(nombreUsuario)}</span>
            <span class="usuario-rol">${etiquetasRol[rol]}</span>
          </div>
        </div>
      </div>
      <button type="button" class="boton boton-salir" aria-label="Cerrar sesión" title="Cerrar sesión">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path></svg>
      </button>
    </header>
  `;
}