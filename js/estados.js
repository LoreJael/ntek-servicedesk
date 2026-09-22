function mostrarEstadoVacio(contenedor, mensaje) {
  contenedor.innerHTML = `<p class="estado-vacio">${mensaje}</p>`;
}

function mostrarErrorRecuperable(contenedor, mensaje, alReintentar) {
  contenedor.innerHTML = `
    <div class="estado-error">
      <p>${mensaje}</p>
      <button type="button" class="boton">Reintentar</button>
    </div>
  `;

  contenedor.querySelector('.boton').addEventListener('click', alReintentar);
}

export { mostrarEstadoVacio, mostrarErrorRecuperable };