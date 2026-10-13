const etiquetasRol = {
  cliente: "Cliente"
};

function crearEnlace(href, texto) {
  const esPaginaActual = location.pathname.endsWith(href);
  return `<a href="${href}" ${esPaginaActual ? 'aria-current="page"' : ''}>${texto}</a>`;
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
        <span class="rol-badge">${etiquetasRol[rol]}</span>
        <button class="boton">Cerrar sesión</button>
      </div>
    </header>
  `;
}