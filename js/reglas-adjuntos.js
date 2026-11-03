export const reglasAdjuntos = {
  imagen: { tipos: ['image/jpeg', 'image/png'], maxArchivos: 3, maxMB: 5 },
  pdf: { tipos: ['application/pdf'], maxArchivos: 1, maxMB: 5 },
  markdown: { tipos: ['text/markdown'], maxArchivos: 5, maxMB: 1 }
};

export function buscarGrupo(mime) {
  for (const grupo in reglasAdjuntos) {
    if (reglasAdjuntos[grupo].tipos.includes(mime)) {
      return grupo;
    }
  }
  return null;
}

export function obtenerTipoArchivo(archivo) {
  if (archivo.type) {
    return archivo.type;
  }

  const extension = archivo.name.split('.').pop().toLowerCase();

  if (extension === 'md') {
    return 'text/markdown';
  }

  return '';
}