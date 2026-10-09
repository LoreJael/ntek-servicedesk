import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion } from './sesion.js';
import { supabase } from './supabase-client.js';
import { mostrarNotificacion } from './notificaciones.js';
import { escaparHTML } from './seguridad.js';

document.getElementById('header-placeholder').innerHTML = crearHeaderEquipo(rolActual);
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

const formatoFechaHora = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };

const parametros = new URLSearchParams(window.location.search);
const idTicket = parametros.get('id');

const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', idTicket)
    .maybeSingle();

const { data: datosPerfiles } = await supabase
    .from('profiles')
    .select('id, full_name, company');

const perfiles = datosPerfiles || [];

const contenedorDetalle = document.querySelector('#detalle-ticket');
const contenedorGestion = document.querySelector('#gestion-ticket');


const listaComentarios = document.querySelector('#lista-comentarios-ticket');
const formComentario = document.querySelector('#form-comentario');
const textoComentario = document.querySelector('#texto-comentario');
const casillaInterna = document.querySelector('#casilla-interna');


const { data: datosUsuario } = await supabase.auth.getUser();
const idUsuarioActual = datosUsuario.user.id;

let tecnicos = [];

if (rolActual === 'admin') {
    const { data: datosTecnicos } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['tecnico', 'admin'])
        .order('full_name');

    tecnicos = datosTecnicos || [];
}

function dibujarDetalle(ticket) {
    const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-CL', formatoFechaHora);
    const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-CL', formatoFechaHora);
    const cliente = perfiles.find((perfil) => perfil.id === ticket.created_by);
    const asignado = perfiles.find((perfil) => perfil.id === ticket.assigned_to);

    contenedorDetalle.className = `tarjeta tarjeta--prioridad-${ticket.priority}`;
    contenedorDetalle.innerHTML = `
    <p class="ticket-id">N.° ${ticket.id.slice(0, 8)}</p>
    <h1>${escaparHTML(ticket.title)}</h1>
    <p class="ticket-cliente">${cliente ? escaparHTML(cliente.full_name) + ' · ' + escaparHTML(cliente.company) : 'Cliente no disponible'}</p>
    <p class="ticket-estado">${etiquetasEstado[ticket.status]} · ${etiquetasPrioridad[ticket.priority]} · ${escaparHTML(ticket.category)}</p>
    <p class="ticket-asignado">${asignado ? 'Asignado a ' + escaparHTML(asignado.full_name) : 'Sin asignar'}</p>
    <p class="ticket-descripcion">${escaparHTML(ticket.description)}</p>
    <p class="ticket-fecha">Creado: ${fechaCreacion} · Última actualización: ${fechaActualizacion}</p>
  `;
}

function dibujarGestion(ticket) {
    const esAdmin = rolActual === 'admin';

    if (!esAdmin && ticket.assigned_to === null) {
        contenedorGestion.innerHTML = '<p>Toma este caso desde la bandeja para poder gestionarlo.</p>';
        return;
    }

    if (!esAdmin && ticket.status === 'cerrado') {
        contenedorGestion.innerHTML = '<p>Este ticket está cerrado y no se puede modificar.</p>';
        return;
    }

    const opcionesTecnicos = tecnicos
        .map((tecnico) => `<option value="${tecnico.id}">${escaparHTML(tecnico.full_name)}</option>`)
        .join('');

    const campoAsignar = esAdmin && tecnicos.length > 0
        ? `<div class="form-grupo">
        <label for="select-asignado">Asignar a</label>
        <select id="select-asignado">
          <option value="">Sin asignar</option>
          ${opcionesTecnicos}
        </select>
      </div>`
        : '';

    contenedorGestion.innerHTML = `
    <h2>Gestionar ticket</h2>
    <form id="form-gestion">
      <div class="form-grupo">
        <label for="select-estado">Estado</label>
        <select id="select-estado">
          <option value="nuevo">Nuevo</option>
          <option value="en_revision">En revisión</option>
          <option value="en_progreso">En progreso</option>
          <option value="en_espera">En espera</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      <div class="form-grupo">
        <label for="select-prioridad">Prioridad</label>
        <select id="select-prioridad">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      ${campoAsignar}

      <button class="boton" type="submit">Guardar cambios</button>
    </form>
  `;
    const selectEstado = contenedorGestion.querySelector('#select-estado');
    const selectPrioridad = contenedorGestion.querySelector('#select-prioridad');
    selectEstado.value = ticket.status;
    selectPrioridad.value = ticket.priority;

    const selectAsignado = contenedorGestion.querySelector('#select-asignado');
    if (selectAsignado) {
        selectAsignado.value = ticket.assigned_to === null ? '' : ticket.assigned_to;
    }

    contenedorGestion.querySelector('#form-gestion').addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const cambios = { status: selectEstado.value, priority: selectPrioridad.value };

        if (selectAsignado) {
            cambios.assigned_to = selectAsignado.value === '' ? null : selectAsignado.value;
        }

        const { data, error } = await supabase
            .from('tickets')
            .update(cambios)
            .eq('id', ticket.id)
            .select();

        if (error) {
            mostrarNotificacion('No se pudieron guardar los cambios. Intenta de nuevo.', 'error');
            return;
        }

        if (data.length === 0) {
            mostrarNotificacion('No tienes permiso para modificar este ticket.', 'error');
            return;
        }

        mostrarNotificacion('Cambios guardados correctamente.', 'exito');
        dibujarDetalle(data[0]);
        dibujarGestion(data[0]);
    });
}

async function cargarComentarios() {
    listaComentarios.innerHTML = '';

    const { data: comentarios, error: errorComentarios } = await supabase
        .from('comments')
        .select('id, body, author_id, is_internal, created_at')
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

        if (comentario.is_internal) {
            item.classList.add('comentario--interna');
        }

        const perfilAutor = perfiles.find((perfil) => perfil.id === comentario.author_id);

        let autor = 'Equipo NTEK';
        if (comentario.author_id === idUsuarioActual) {
            autor = 'Tú';
        } else if (perfilAutor) {
            autor = perfilAutor.full_name;
        }

        const etiquetaInterna = comentario.is_internal
            ? '<span class="comentario-etiqueta-interna">Nota interna</span>'
            : '';

        const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', formatoFechaHora);

        item.innerHTML = `
        ${etiquetaInterna}
        <p class="comentario-texto">${escaparHTML(comentario.body)}</p>
        <p class="comentario-meta">${escaparHTML(autor)} · ${fechaHora}</p>
      `;

        listaComentarios.appendChild(item);
    });

    listaComentarios.scrollTop = listaComentarios.scrollHeight;
}


function activarFormularioComentario() {
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
                body: texto,
                is_internal: casillaInterna.checked
            });

        if (errorInsert) {
            mostrarNotificacion('No se pudo enviar el comentario. Intenta nuevamente.', 'error');
            return;
        }

        textoComentario.value = '';
        casillaInterna.checked = false;
        mostrarNotificacion('Comentario enviado.', 'exito');
        await cargarComentarios();
    });
}

const listaAdjuntos = document.querySelector('#lista-adjuntos');
const formAdjunto = document.querySelector('#form-adjunto');
const inputAdjunto = document.querySelector('#input-adjunto');

const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
const tamanoMaximo = 5 * 1024 * 1024;

const etiquetasTipo = {
    'image/jpeg': 'Imagen JPG',
    'image/png': 'Imagen PNG',
    'application/pdf': 'Documento PDF'
};

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

    if (adjuntos.length === 0) {
        listaAdjuntos.innerHTML = '<li>Este ticket aún no tiene archivos.</li>';
        return;
    }

    adjuntos.forEach((adjunto) => {
        const item = document.createElement('li');
        item.classList.add('adjunto');

        const perfilAutor = perfiles.find((perfil) => perfil.id === adjunto.uploaded_by);

        let autor = 'Equipo NTEK';
        if (adjunto.uploaded_by === idUsuarioActual) {
            autor = 'Tú';
        } else if (perfilAutor) {
            autor = perfilAutor.full_name;
        }

        const tamanoKB = Math.ceil(adjunto.size_bytes / 1024);
        const fechaHora = new Date(adjunto.created_at).toLocaleString('es-CL', formatoFechaHora);

        item.innerHTML = `
        <p class="adjunto-tipo">${etiquetasTipo[adjunto.mime_type]} · ${tamanoKB} KB</p>
        <p class="adjunto-meta">${escaparHTML(autor)} · ${fechaHora}</p>
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

function activarFormularioAdjunto() {
    formAdjunto.hidden = false;

    formAdjunto.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const archivo = inputAdjunto.files[0];
        inputAdjunto.value = '';

        if (!archivo) {
            mostrarNotificacion('Elige un archivo antes de subirlo.', 'error');
            return;
        }

        if (!tiposPermitidos.includes(archivo.type)) {
            mostrarNotificacion('Solo se permiten archivos JPG, PNG o PDF.', 'error');
            return;
        }

        if (archivo.size > tamanoMaximo) {
            mostrarNotificacion('El archivo supera el máximo de 5 MB.', 'error');
            return;
        }

        const extension = archivo.name.split('.').pop().toLowerCase();
        const ruta = `${ticket.id}/${crypto.randomUUID()}.${extension}`;

        const { error: errorSubida } = await supabase.storage
            .from('adjuntos')
            .upload(ruta, archivo);

        if (errorSubida) {
            mostrarNotificacion('No se pudo subir el archivo. Intenta nuevamente.', 'error');
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
            return;
        }

        inputAdjunto.value = '';
        mostrarNotificacion('Archivo subido correctamente.', 'exito');
        await cargarAdjuntos();
    });
}

if (error || !ticket) {
    contenedorDetalle.innerHTML = '<p>No se encontró el ticket solicitado.</p>';
} else {
    dibujarDetalle(ticket);
    dibujarGestion(ticket);
    await cargarComentarios();        
    activarFormularioComentario();   
    await cargarAdjuntos();
    activarFormularioAdjunto(); 
}

document.body.classList.remove('verificando');