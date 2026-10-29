import { nombreUsuario } from './sesion.js';
import { escaparHTML } from './seguridad.js';
import { icono } from './iconos.js';
import { crearLogo, crearEnlace, crearSeccion, obtenerIniciales } from './barra-lateral.js';

const etiquetasRol = {
  cliente: "Cliente"
};

export function crearHeaderCliente(rol) {
  return `
    <header class="header">
      ${crearLogo()}
      <nav class="nav-principal" aria-label="Principal">
        ${crearSeccion("Principal", `
          ${crearEnlace("panel.html", "Panel", "panel")}
          ${crearEnlace("mis-tickets.html", "Mis tickets", "tickets")}
          ${crearEnlace("nueva-solicitud.html", "Nueva solicitud", "nueva")}
        `)}
        ${crearSeccion("Cuenta", `
          ${crearEnlace("perfil.html", "Perfil", "perfil")}
        `)}
      </nav>
      <div class="header-usuario">
        <div class="usuario-info">
          <span class="usuario-avatar" aria-hidden="true">${escaparHTML(obtenerIniciales(nombreUsuario))}</span>
          <div class="usuario-datos">
            <span class="usuario-nombre">${escaparHTML(nombreUsuario)}</span>
            <span class="usuario-rol">${etiquetasRol[rol]}</span>
          </div>
        </div>
      </div>
      <button type="button" class="boton boton-salir" aria-label="Cerrar sesión" title="Cerrar sesión">
        ${icono("salir")}
      </button>
    </header>
  `;
}