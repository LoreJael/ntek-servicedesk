import { nombreUsuario } from './sesion.js';
import { escaparHTML } from './seguridad.js';
import { icono } from './iconos.js';
import { crearLogo, crearEnlace, crearSeccion, obtenerIniciales } from './barra-lateral.js';

const etiquetasRol = {
  tecnico: "Técnico",
  admin: "Administrador"
};

export function crearHeaderEquipo(rol) {
  const esAdmin = rol === "admin";

  const seccionAdmin = esAdmin
    ? crearSeccion("Administración", `
        ${crearEnlace("../admin/usuarios.html", "Usuarios", "usuarios")}
        ${crearEnlace("../admin/auditoria.html", "Auditoría", "auditoria")}
      `)
    : "";

  return `
    <header class="header">
      ${crearLogo()}
      <nav class="nav-principal" aria-label="Principal">
        ${crearSeccion("Gestión", `
          ${crearEnlace("../equipo/bandeja-global.html", "Bandeja", "bandeja")}
          ${crearEnlace("../equipo/indicadores.html", "Indicadores", "indicadores")}
        `)}
        ${seccionAdmin}
        ${crearSeccion("Cuenta", `
          ${crearEnlace("../equipo/perfil.html", "Perfil", "perfil")}
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