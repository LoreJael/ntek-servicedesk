function mostrarNotificacion(mensaje, tipo = 'exito') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion--${tipo}`;
  notificacion.setAttribute('role', 'status');

  notificacion.innerHTML = `
    <p>${mensaje}</p>
    <button type="button" class="notificacion-cerrar" aria-label="Cerrar notificación">&times;</button>
  `;

  document.body.appendChild(notificacion);

  const cerrar = () => notificacion.remove();
  notificacion.querySelector('.notificacion-cerrar').addEventListener('click', cerrar);
  setTimeout(cerrar, 5000);
}

export { mostrarNotificacion };