import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['cliente'], false);
import { crearHeaderCliente } from './header-cliente.js';
import { activarBotonCerrarSesion } from './sesion.js';
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


const parametros = new URLSearchParams(window.location.search);
const idTicket = parametros.get('id');

const { data: ticket, error } = await supabase
  .from('tickets')
  .select('*')
  .eq('id', idTicket)
  .maybeSingle();

const contenedorDetalle = document.querySelector('#detalle-ticket');

if (error || !ticket) {
  contenedorDetalle.innerHTML = '<p>No se encontró el ticket solicitado.</p>';
} else {
  const formatoFechaHora = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-CL', formatoFechaHora);
  const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-CL', formatoFechaHora);

  contenedorDetalle.classList.add(`tarjeta--prioridad-${ticket.priority}`);
  contenedorDetalle.innerHTML = `
  <p class="ticket-id">N.° ${ticket.id.slice(0, 8)}</p>
    <h1>${escaparHTML(ticket.title)}</h1>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]} · ${escaparHTML(ticket.category)}</p>
    <p class="ticket-descripcion">${escaparHTML(ticket.description)}</p>
    <p class="ticket-fecha">Creado: ${fechaCreacion} · Última actualización: ${fechaActualizacion}</p>
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
      listaComentarios.innerHTML = '<li>No se pudieron cargar los comentarios.</li>';
      return;
    }

    comentarios.forEach((comentario) => {
      const item = document.createElement('li');
      item.classList.add('comentario');

      if (comentario.author_id === idUsuarioActual) {
        item.classList.add('comentario--propio');
      }

      const autor = comentario.author_id === idUsuarioActual ? 'Tú' : 'Equipo NTEK';
      const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', formatoFechaHora);

      item.innerHTML = `
        <p class="comentario-texto">${escaparHTML(comentario.body)}</p>
        <p class="comentario-meta">${autor} · ${fechaHora}</p>
      `;

      listaComentarios.appendChild(item);
    });

    listaComentarios.scrollTop = listaComentarios.scrollHeight;
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

      if (texto === '') {
        mostrarNotificacion('Escribe un comentario antes de enviarlo.', 'error');
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
    'text/markdown': 'Markdown'
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
      listaAdjuntos.innerHTML = '<li>No se pudieron cargar los archivos.</li>';
      return;
    }
    
    adjuntosActuales = adjuntos;

    if (adjuntos.length === 0) {
      listaAdjuntos.innerHTML = '<li>Este ticket aún no tiene archivos.</li>';
      return;
    }

    adjuntos.forEach((adjunto) => {
      const item = document.createElement('li');
      item.classList.add('adjunto');

      const tamanoKB = Math.ceil(adjunto.size_bytes / 1024);
      const fechaHora = new Date(adjunto.created_at).toLocaleString('es-CL', formatoFechaHora);
      const autor = adjunto.uploaded_by === idUsuarioActual ? 'Tú' : 'Equipo NTEK';

      item.innerHTML = `
        <p class="adjunto-tipo">${etiquetasTipo[adjunto.mime_type]} · ${tamanoKB} KB</p>
        <p class="adjunto-meta">${autor} · ${fechaHora}</p>
        <button type="button" class="boton">Descargar</button>
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
  }}
document.body.classList.remove('verificando');