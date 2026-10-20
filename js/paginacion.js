export const TICKETS_POR_PAGINA = 10;

export function obtenerPagina(lista, numeroPagina) {
  const inicio = (numeroPagina - 1) * TICKETS_POR_PAGINA;
  const fin = inicio + TICKETS_POR_PAGINA;
  return lista.slice(inicio, fin);
}

export function pintarPaginacion(contenedor, totalElementos, paginaActual, alCambiarPagina) {
  const totalPaginas = Math.ceil(totalElementos / TICKETS_POR_PAGINA);
  contenedor.innerHTML = '';

  if (totalPaginas <= 1) {
    return;
  }

  const botonAnterior = document.createElement('button');
  botonAnterior.type = 'button';
  botonAnterior.classList.add('boton');
  botonAnterior.textContent = '← Anterior';
  botonAnterior.disabled = paginaActual === 1;
  botonAnterior.addEventListener('click', () => alCambiarPagina(paginaActual - 1));

  const texto = document.createElement('span');
  texto.textContent = `Página ${paginaActual} de ${totalPaginas}`;

  const botonSiguiente = document.createElement('button');
  botonSiguiente.type = 'button';
  botonSiguiente.classList.add('boton');
  botonSiguiente.textContent = 'Siguiente →';
  botonSiguiente.disabled = paginaActual === totalPaginas;
  botonSiguiente.addEventListener('click', () => alCambiarPagina(paginaActual + 1));

  contenedor.append(botonAnterior, texto, botonSiguiente);
}