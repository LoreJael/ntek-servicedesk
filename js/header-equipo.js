export function crearHeaderEquipo(rol) {
  const esAdmin = rol === "Administrador";

  const enlacesAdmin = esAdmin
    ? `
      <a href="../admin/usuarios.html">Usuarios</a>
      <a href="../admin/auditoria.html">Auditoría</a>`
    : "";

  return `
    <header class="header">
      <p class="logo">NTEK ServiceDesk Lite</p>
      <nav class="nav-principal" aria-label="Principal">
        <a href="bandeja-global.html">Bandeja global</a>
        <a href="indicadores.html">Indicadores</a>
        <a href="perfil.html">Perfil</a>${enlacesAdmin}
      </nav>
      <span class="rol-badge">${rol}</span>
      <button class="boton">Cerrar sesión</button>
    </header>
  `;
}

