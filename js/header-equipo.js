 const etiquetasRol = {
  tecnico: "Técnico",
  admin: "Administrador"
};

function crearEnlace(href, texto) {
  const nombreArchivo = href.split("/").pop();
  const esPaginaActual = location.pathname.endsWith(nombreArchivo);
  return `<a href="${href}" ${esPaginaActual ? 'aria-current="page"' : ''}>${texto}</a>`;
}

export function crearHeaderEquipo(rol) {
  const esAdmin = rol === "admin";

  const enlacesAdmin = esAdmin
    ? `
    ${crearEnlace("../admin/usuarios.html", "Usuarios")}
    ${crearEnlace("../admin/auditoria.html", "Auditoría")}
      `
    : "";

  return `
    <header class="header">
      <p class="logo">NTEK ServiceDesk Lite</p>
      <nav class="nav-principal" aria-label="Principal">
        ${crearEnlace("../equipo/bandeja-global.html", "Bandeja")}
        ${crearEnlace("../equipo/indicadores.html", "Indicadores")}
        ${crearEnlace("../equipo/perfil.html", "Perfil")}
        ${enlacesAdmin}
      </nav>
       <div class="header-usuario">
        <span class="rol-badge">${etiquetasRol[rol]}</span>
        <button class="boton">Cerrar sesión</button>
      </div>
    </header>
      
  `;
}