import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente'], false);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion, nombreUsuario } from './sesion.js';
import { supabase } from './supabase-client.js';
import { mostrarNotificacion } from './notificaciones.js';
import { escaparHTML } from './seguridad.js';
import { reglasAdjuntos, buscarGrupo } from './reglas-adjuntos.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderCliente(rolActual);
activarBotonCerrarSesion();

const etiquetasEstado = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_progreso: "En progreso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado"
};

const etiquetasPrioridad = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica"
};

function obtenerIniciales(nombre) {
  return nombre
    .split(' ')
    .filter((parte) => parte !== '')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}


const parametros = new URLSearchParams(window.location.search);
const idTicket = parametros.get('id');

const { data: ticket, error } = await supabase
  .from('tickets')
  .select('*')
  .eq('id', idTicket)
  .maybeSingle();

const encabezadoTicket = document.querySelector('#encabezado-ticket');

if (error || !ticket) {
  encabezadoTicket.innerHTML = '<div class="ticket-cabecera-texto"><h1>No se encontró el ticket solicitado</h1></div>';
  document.querySelector('.ticket-layout').hidden = true;
} else {
  const formatoFechaHora = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formatoFecha = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric' };
  const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-CL', formatoFechaHora);
  const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-CL', formatoFechaHora);
  const diaCreacion = new Date(ticket.created_at).toLocaleDateString('es-CL', formatoFecha);

  const pildoraEstado = `<span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>`;
  const pildoraPrioridad = `<span class="badge-prioridad badge-prioridad--${ticket.priority}">${etiquetasPrioridad[ticket.priority]}</span>`;

  encabezadoTicket.innerHTML = `
    <div class="ticket-cabecera-texto">
      <p class="eyebrow">Ticket N.° ${ticket.id.slice(0, 8)}</p>
      <h1>${escaparHTML(ticket.title)}</h1>
      <p class="ticket-cabecera-meta">
        ${pildoraEstado}
        ${pildoraPrioridad}
        <span class="separador" aria-hidden="true">|</span>
        <span>${escaparHTML(ticket.category)}</span>
        <span class="separador" aria-hidden="true">|</span>
        <span>Creado el ${diaCreacion}</span>
      </p>
    </div>
  `;

  document.querySelector('#descripcion-ticket').textContent = ticket.description;

  document.querySelector('#detalles-ticket').innerHTML = `
    <div><dt>Estado</dt><dd>${pildoraEstado}</dd></div>
    <div><dt>Prioridad</dt><dd>${pildoraPrioridad}</dd></div>
    <div><dt>Categoría</dt><dd>${escaparHTML(ticket.category)}</dd></div>
    <div><dt>Creado</dt><dd>${fechaCreacion}</dd></div>
    <div><dt>Actualizado</dt><dd>${fechaActualizacion}</dd></div>
  `;

  // Aceptar cierre (solo si el ticket está Resuelto)
  const avisoResuelto = document.querySelector('#aviso-resuelto');
  const botonAceptarCierre = document.querySelector('#boton-aceptar-cierre');

  if (ticket.status === 'resuelto') {
    avisoResuelto.hidden = false;

    botonAceptarCierre.addEventListener('click', async () => {
      const confirmado = confirm('¿Seguro que quieres cerrar este ticket? Una vez cerrado ya no podrás comentar ni adjuntar archivos.');

      if (!confirmado) {
        return;
      }

      botonAceptarCierre.disabled = true;
      botonAceptarCierre.textContent = 'Cerrando ticket...';

      const { error: errorCierre } = await supabase.rpc('aceptar_cierre', { id_ticket: ticket.id });

      if (errorCierre) {
        mostrarNotificacion('No se pudo cerrar el ticket. Intenta nuevamente.', 'error');
        botonAceptarCierre.disabled = false;
        botonAceptarCierre.textContent = 'Aceptar cierre';
        return;
      }

      mostrarNotificacion('Ticket cerrado. ¡Gracias por confirmar!', 'exito');
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  const { data: datosUsuario } = await supabase.auth.getUser();
  const idUsuarioActual = datosUsuario.user.id;

  const listaComentarios = document.querySelector('#lista-comentarios-ticket');

  async function cargarComentarios() {
    listaComentarios.innerHTML = '';

    const { data: comentarios, error: errorComentarios } = await supabase
      .from('comments')
      .select('id, body, author_id, created_at')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (errorComentarios) {
      listaComentarios.innerHTML = '<li class="hilo-vacio">No se pudieron cargar los mensajes. Recarga la página para intentarlo de nuevo.</li>';
      return;
    }

    document.querySelector('#contador-comentarios').textContent = comentarios.length;

    if (comentarios.length === 0) {
      listaComentarios.innerHTML = '<li class="hilo-vacio">Aún no hay mensajes. Si tienes novedades sobre tu caso, escríbelas abajo.</li>';
      return;
    }

    comentarios.forEach((comentario) => {
      const esPropio = comentario.author_id === idUsuarioActual;
      const autor = esPropio ? 'Tú' : 'Equipo NTEK';
      const iniciales = esPropio ? obtenerIniciales(nombreUsuario) : 'NT';
      const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', formatoFechaHora);

      const item = document.createElement('li');
      item.className = esPropio ? 'mensaje mensaje--propio' : 'mensaje';

      item.innerHTML = `
        <span class="avatar ${esPropio ? '' : 'avatar--equipo'}" aria-hidden="true">${escaparHTML(iniciales)}</span>
        <div class="mensaje-cuerpo">
          <p class="mensaje-cabecera">
            <span class="mensaje-autor">${autor}</span>
            <span class="mensaje-fecha">${fechaHora}</span>
          </p>
          <p class="mensaje-texto">${escaparHTML(comentario.body)}</p>
        </div>
      `;

      listaComentarios.appendChild(item);
    });

  }

  await cargarComentarios();

  // Formulario para responder
  const formComentario = document.querySelector('#form-comentario');
  const textoComentario = document.querySelector('#texto-comentario');
  const avisoTicketCerrado = document.querySelector('#aviso-ticket-cerrado');

  if (ticket.status === 'cerrado') {
    formComentario.hidden = true;
    avisoTicketCerrado.hidden = false;
  } else {
    formComentario.hidden = false;

    formComentario.addEventListener('submit', async (evento) => {
      evento.preventDefault();

      const texto = textoComentario.value.trim();

      const largoTexto = [...texto].length;

      if (largoTexto < 10 || largoTexto > 2000) {
        mostrarNotificacion('El comentario debe tener entre 10 y 2000 caracteres.', 'error');
        return;
      }

      const { error: errorInsert } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticket.id,
          author_id: idUsuarioActual,
          body: texto
        });

      if (errorInsert) {
        mostrarNotificacion('No se pudo enviar el comentario. Intenta nuevamente.', 'error');
        return;
      }

      textoComentario.value = '';
      mostrarNotificacion('Comentario enviado.', 'exito');
      await cargarComentarios();

    });
  }

  const formAdjunto = document.querySelector('#form-adjunto');
  const inputAdjunto = document.querySelector('#input-adjunto');


  const listaAdjuntos = document.querySelector('#lista-adjuntos');

  const etiquetasTipo = {
    'image/jpeg': 'Imagen JPG',
    'image/png': 'Imagen PNG',
    'application/pdf': 'Documento PDF',
    'text/markdown': 'Archivo Markdown'
  };

  const iconosTipo = {
    'image/jpeg': { texto: 'JPG', clase: '' },
    'image/png': { texto: 'PNG', clase: '' },
    'application/pdf': { texto: 'PDF', clase: 'archivo-icono--pdf' },
    'text/markdown': { texto: 'MD', clase: 'archivo-icono--md' }
  };

  let adjuntosActuales = [];

  async function cargarAdjuntos() {
    listaAdjuntos.innerHTML = '';

    const { data: adjuntos, error: errorAdjuntos } = await supabase
      .from('attachments')
      .select('id, path, mime_type, size_bytes, created_at, uploaded_by')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (errorAdjuntos) {
      listaAdjuntos.innerHTML = '<li class="archivos-vacio">No se pudieron cargar los archivos.</li>';
      return;
    }

    adjuntosActuales = adjuntos;
    document.querySelector('#contador-adjuntos').textContent = adjuntos.length;

    if (adjuntos.length === 0) {
      listaAdjuntos.innerHTML = '<li class="archivos-vacio">Este ticket aún no tiene archivos.</li>';
      return;
    }

    adjuntos.forEach((adjunto) => {
      const item = document.createElement('li');
      item.classList.add('archivo');

      const icono = iconosTipo[adjunto.mime_type];
      const tamanoKB = Math.ceil(adjunto.size_bytes / 1024);
      const fechaHora = new Date(adjunto.created_at).toLocaleString('es-CL', formatoFechaHora);
      const autor = adjunto.uploaded_by === idUsuarioActual ? 'Tú' : 'Equipo NTEK';

      item.innerHTML = `
        <span class="archivo-icono ${icono.clase}" aria-hidden="true">${icono.texto}</span>
        <div class="archivo-datos">
          <p class="archivo-nombre">${etiquetasTipo[adjunto.mime_type]}</p>
          <p class="archivo-meta">${tamanoKB} KB · ${autor} · ${fechaHora}</p>
        </div>
        <button type="button" class="archivo-descargar" aria-label="Descargar ${etiquetasTipo[adjunto.mime_type]}" title="Descargar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"></path><path d="M7 10l5 5 5-5"></path><path d="M5 21h14"></path></svg></button>
      `;

      item.querySelector('button').addEventListener('click', () => descargarAdjunto(adjunto.path));

      listaAdjuntos.appendChild(item);
    });
  }

  async function descargarAdjunto(ruta) {
    const { data, error } = await supabase.storage
      .from('adjuntos')
      .createSignedUrl(ruta, 20, { download: true });

    if (error) {
      mostrarNotificacion('No se pudo descargar el archivo. Intenta nuevamente.', 'error');
      return;
    }

    window.location.href = data.signedUrl;
  }

  await cargarAdjuntos();

  if (ticket.status !== 'cerrado') {
    formAdjunto.hidden = false;

    formAdjunto.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const botonSubir = formAdjunto.querySelector('button[type="submit"]');

      const archivo = inputAdjunto.files[0];
      inputAdjunto.value = '';

      if (!archivo) {
        mostrarNotificacion('Elige un archivo antes de subirlo.', 'error');
        return;
      }

      const grupo = buscarGrupo(archivo.type);

      if (!grupo) {
        mostrarNotificacion('Solo se permiten archivos JPG, PNG, PDF o Markdown (.md).', 'error');
        return;
      }

      const regla = reglasAdjuntos[grupo];

      if (archivo.size > regla.maxMB * 1024 * 1024) {
        mostrarNotificacion(`Este tipo de archivo no puede superar ${regla.maxMB} MB.`, 'error');
        return;
      }

      const cantidadEnGrupo = adjuntosActuales.filter(
        (adjunto) => buscarGrupo(adjunto.mime_type) === grupo
      ).length;

      if (cantidadEnGrupo >= regla.maxArchivos) {
        mostrarNotificacion(`Este ticket ya tiene el máximo de ${regla.maxArchivos} archivo(s) de este tipo.`, 'error');
        return;
      }

      botonSubir.disabled = true;
      botonSubir.textContent = 'Subiendo archivo...';

      const extension = archivo.name.split('.').pop().toLowerCase();
      const ruta = `${ticket.id}/${crypto.randomUUID()}.${extension}`;

      const { error: errorSubida } = await supabase.storage
        .from('adjuntos')
        .upload(ruta, archivo);

      if (errorSubida) {
        mostrarNotificacion('No se pudo subir el archivo. Intenta nuevamente.', 'error');
        botonSubir.disabled = false;
        botonSubir.textContent = 'Subir archivo';
        return;
      }

      const { error: errorFicha } = await supabase
        .from('attachments')
        .insert({
          ticket_id: ticket.id,
          uploaded_by: idUsuarioActual,
          path: ruta,
          mime_type: archivo.type,
          size_bytes: archivo.size
        });

      if (errorFicha) {
        await supabase.storage.from('adjuntos').remove([ruta]);
        mostrarNotificacion('No se pudo registrar el archivo. Intenta nuevamente.', 'error');
        botonSubir.disabled = false;
        botonSubir.textContent = 'Subir archivo';
        return;
      }

      inputAdjunto.value = '';
      mostrarNotificacion('Archivo subido correctamente.', 'exito');
      await cargarAdjuntos();

      botonSubir.disabled = false;
      botonSubir.textContent = 'Subir archivo';
    });
  }
}
document.body.classList.remove('verificando');