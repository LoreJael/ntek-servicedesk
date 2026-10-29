import { supabase } from './supabase-client.js';
import { icono } from './iconos.js';
import { crearItemEvento } from './eventos-auditoria.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';

export async function cargarPanelAdmin() {
  const seccionAdmin = document.querySelector('#seccion-admin');
  const resumenUsuarios = document.querySelector('#resumen-usuarios');
  const listaActividad = document.querySelector('#lista-actividad');

  seccionAdmin.hidden = false;

  document.querySelectorAll('[data-icono]').forEach((elemento) => {
    elemento.innerHTML = icono(elemento.dataset.icono);
  });

  const [respuestaPerfiles, respuestaEventos] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, active'),
    supabase
      .from('audit_events')
      .select('id, actor_id, action, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const perfiles = respuestaPerfiles.data ?? [];

  function nombreDe(id) {
    const perfilEncontrado = perfiles.find((p) => p.id === id);
    return perfilEncontrado ? perfilEncontrado.full_name : 'Usuario desconocido';
  }

  if (respuestaPerfiles.error) {
    mostrarErrorRecuperable(resumenUsuarios, 'No pudimos cargar el resumen de usuarios.', () => location.reload());
  } else {
    const indicadores = [
      { etiqueta: 'Usuarios activos', cantidad: perfiles.filter((p) => p.active).length, color: 'resuelto' },
      { etiqueta: 'Desactivados', cantidad: perfiles.filter((p) => !p.active).length, color: 'cerrado' },
      { etiqueta: 'Clientes', cantidad: perfiles.filter((p) => p.role === 'cliente').length, color: 'nuevo' },
      { etiqueta: 'Equipo NTEK', cantidad: perfiles.filter((p) => p.role !== 'cliente').length, color: 'en_revision' }
    ];

    indicadores.forEach((indicador) => {
      const item = document.createElement('a');
      item.href = '../admin/usuarios.html';
      item.classList.add('resumen-item', `resumen-item--${indicador.color}`);
      item.innerHTML = `
        <p class="resumen-numero">${indicador.cantidad}</p>
        <p class="resumen-etiqueta">${indicador.etiqueta}</p>
      `;
      resumenUsuarios.appendChild(item);
    });
  }

  if (respuestaEventos.error) {
    mostrarErrorRecuperable(listaActividad, 'No pudimos cargar la actividad reciente.', () => location.reload());
  } else if (respuestaEventos.data.length === 0) {
    mostrarEstadoVacio(listaActividad, 'Todavía no hay movimientos registrados.');
  } else {
    respuestaEventos.data.forEach((evento) => {
      listaActividad.appendChild(crearItemEvento(evento, nombreDe, true));
    });
  }
}
