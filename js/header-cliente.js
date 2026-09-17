const etiquetasRol = {
  cliente: "Cliente"
};

export function crearHeaderCliente(rol) {
  return `
    <header class="header">
      <p class="logo">NTEK ServiceDesk Lite</p>
      <nav class="nav-principal" aria-label="Principal">
        <a href="panel.html">Panel</a>
        <a href="mis-tickets.html">Mis tickets</a>
        <a href="nueva-solicitud.html">Nueva solicitud</a>
        <a href="perfil.html">Perfil</a>
      </nav>
      <span class="rol-badge">${etiquetasRol[rol]}</span>
      <button class="boton">Cerrar sesión</button>
    </header>
  `;
}