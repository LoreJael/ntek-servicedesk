import { icono } from './iconos.js';

export function crearLogo() {
  return `
    <p class="logo">
      <img class="logo-imagen" src="../../img/logo-ntek.webp" alt="NTEK">
      <span class="logo-texto"><small>ServiceDesk Lite</small></span>
    </p>
  `;
}

export function crearEnlace(href, texto, nombreIcono) {
  const nombreArchivo = href.split('/').pop();
  const esPaginaActual = location.pathname.endsWith('/' + nombreArchivo);
  return `<a href="${href}" ${esPaginaActual ? 'aria-current="page"' : ''}>${icono(nombreIcono)}<span>${texto}</span></a>`;
}

export function crearSeccion(titulo, enlaces) {
  return `
    <div class="nav-grupo">
      <p class="nav-seccion">${titulo}</p>
      ${enlaces}
    </div>
  `;
}

export function obtenerIniciales(nombre) {
  return nombre
    .split(' ')
    .filter((parte) => parte !== '')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}