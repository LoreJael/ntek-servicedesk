import { icono } from './iconos.js';

export function crearLogo() {
  return `
    <p class="logo">
      <span class="logo-marca">${icono('logo', 22)}</span>
      <span class="logo-texto">NTEK <small>ServiceDesk Lite</small></span>
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