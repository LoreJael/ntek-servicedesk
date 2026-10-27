import { protegerRuta } from './sesion.js';
const rolActual = await protegerRuta(['tecnico', 'admin'], false);
import { crearHeaderEquipo } from './header-equipo.js';
import { activarBotonCerrarSesion, nombreUsuario } from './sesion.js';
import { supabase } from './supabase-client.js';
import { mostrarNotificacion } from './notificaciones.js';
import { escaparHTML } from './seguridad.js';
import { reglasAdjuntos, buscarGrupo } from './reglas-adjuntos.js';
import { crearItemEvento } from './eventos-auditoria.js';

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

function obtenerIniciales(nombre) {
    return nombre
        .split(' ')
        .filter((parte) => parte !== '')
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
}

const formatoFecha = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric' };
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
const listaHistorial = document.querySelector('#lista-historial');

function nombreEnHistorial(id) {
    const perfil = perfiles.find((p) => p.id === id);
    return perfil ? perfil.full_name : 'Equipo NTEK';
}

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
    const diaCreacion = new Date(ticket.created_at).toLocaleDateString('es-CL', formatoFecha);
    const cliente = perfiles.find((perfil) => perfil.id === ticket.created_by);
    const asignado = perfiles.find((perfil) => perfil.id === ticket.assigned_to);

    const pildoraEstado = `<span class="badge-estado badge-estado--${ticket.status}">${etiquetasEstado[ticket.status]}</span>`;
    const pildoraPrioridad = `<span class="badge-prioridad badge-prioridad--${ticket.priority}">${etiquetasPrioridad[ticket.priority]}</span>`;

    let textoAsignado = 'Sin asignar';
    if (asignado) {
        textoAsignado = escaparHTML(asignado.full_name);
    } else if (ticket.assigned_to !== null) {
        textoAsignado = 'Equipo NTEK';
    }

    const tarjetaCliente = cliente
        ? `<div class="persona">
            <span class="avatar" aria-hidden="true">${escaparHTML(obtenerIniciales(cliente.full_name))}</span>
            <div>
              <p class="persona-nombre">${escaparHTML(cliente.full_name)}</p>
              <p class="persona-empresa">${escaparHTML(cliente.company)}</p>
            </div>
          </div>`
        : '';

    contenedorDetalle.innerHTML = `
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
    ${tarjetaCliente}
  `;

    document.querySelector('#descripcion-ticket').textContent = ticket.description;

    document.querySelector('#detalles-ticket').innerHTML = `
    <div><dt>Cliente</dt><dd>${cliente ? escaparHTML(cliente.full_name) : 'No disponible'}</dd></div>
    <div><dt>Empresa</dt><dd>${cliente ? escaparHTML(cliente.company) : 'No disponible'}</dd></div>
    <div><dt>Asignado a</dt><dd>${textoAsignado}</dd></div>
    <div><dt>Categoría</dt><dd>${escaparHTML(ticket.category)}</dd></div>
    <div><dt>Creado</dt><dd>${fechaCreacion}</dd></div>
    <div><dt>Actualizado</dt><dd>${fechaActualizacion}</dd></div>
  `;
}

function dibujarGestion(ticket) {
    const esAdmin = rolActual === 'admin';

    if (!esAdmin && ticket.assigned_to === null) {
        contenedorGestion.innerHTML = '<p class="gestion-aviso">Toma este caso desde la bandeja para poder gestionarlo.</p>';
        return;
    }

    if (!esAdmin && ticket.status === 'cerrado') {
        contenedorGestion.innerHTML = '<p class="gestion-aviso">Este ticket está cerrado y no se puede modificar.</p>';
        return;
    }

    const opcionesTecnicos = tecnicos
        .map((tecnico) => `<option value="${tecnico.id}">${escaparHTML(tecnico.full_name)}</option>`)
        .join('');

    const campoAsignar = esAdmin && tecnicos.length > 0
        ? `<div class="campo">
        <label for="select-asignado">Asignar a</label>
        <select id="select-asignado">
          <option value="">Sin asignar</option>
          ${opcionesTecnicos}
        </select>
      </div>`
        : '';

    contenedorGestion.innerHTML = `
    <form id="form-gestion">
      <div class="campo">
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

      <div class="campo">
        <label for="select-prioridad">Prioridad</label>
        <select id="select-prioridad">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      ${campoAsignar}

      <button class="boton boton--ancho" type="submit">Guardar cambios</button>
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
        await cargarHistorial();
    });
}

function dibujarContextoOrigen(ticket) {
    if (!ticket.ticket_origen_id || !ticket.contexto_origen) {
        return;
    }

    const contexto = ticket.contexto_origen;

    document.querySelector('#panel-contexto-origen').hidden = false;
    document.querySelector('#numero-ticket-origen').textContent = ticket.ticket_origen_id.slice(0, 8);
    document.querySelector('#titulo-ticket-origen').textContent = contexto.titulo;
    document.querySelector('#descripcion-ticket-origen').textContent = contexto.descripcion;

    // Conversación del original (solo comentarios públicos)
    const listaComentariosOrigen = document.querySelector('#comentarios-ticket-origen');

    if (contexto.comentarios.length === 0) {
        listaComentariosOrigen.innerHTML = '<li class="hilo-vacio">El ticket original no tenía mensajes.</li>';
    }

    contexto.comentarios.forEach((comentario) => {
        const esDelCliente = comentario.autor_id === ticket.created_by;
        const autor = nombreEnHistorial(comentario.autor_id);
        const fechaHora = new Date(comentario.fecha).toLocaleString('es-CL', formatoFechaHora);

        const item = document.createElement('li');
        item.className = 'mensaje';
        item.innerHTML = `
        <span class="avatar ${esDelCliente ? '' : 'avatar--equipo'}" aria-hidden="true">${escaparHTML(obtenerIniciales(autor))}</span>
        <div class="mensaje-cuerpo">
          <p class="mensaje-cabecera">
            <span class="mensaje-autor">${escaparHTML(autor)}</span>
            <span class="mensaje-fecha">${fechaHora}</span>
          </p>
          <p class="mensaje-texto">${escaparHTML(comentario.texto)}</p>
        </div>
      `;

        listaComentariosOrigen.appendChild(item);
    });

    // Historial del original, del más nuevo al más antiguo
    const listaHistorialOrigen = document.querySelector('#historial-ticket-origen');

    if (contexto.eventos.length === 0) {
        listaHistorialOrigen.innerHTML = '<li class="historial-vacio">El ticket original no tenía cambios registrados.</li>';
    }

    [...contexto.eventos].reverse().forEach((evento) => {
        const eventoAdaptado = {
            action: evento.accion,
            actor_id: evento.actor_id,
            metadata: evento.metadata,
            created_at: evento.fecha,
            entity_id: ticket.ticket_origen_id
        };

        listaHistorialOrigen.appendChild(crearItemEvento(eventoAdaptado, nombreEnHistorial, false));
    });
}

async function cargarHistorial() {
    listaHistorial.innerHTML = '';

    const { data: eventos, error: errorEventos } = await supabase
        .from('audit_events')
        .select('id, actor_id, action, entity_id, metadata, created_at')
        .eq('entity', 'ticket')
        .eq('entity_id', ticket.id)
        .order('created_at', { ascending: false });

    if (errorEventos) {
        listaHistorial.innerHTML = '<li class="historial-vacio">No se pudo cargar el historial.</li>';
        return;
    }

    if (eventos.length === 0) {
        listaHistorial.innerHTML = '<li class="historial-vacio">Este ticket aún no tiene cambios registrados.</li>';
        return;
    }

    eventos.forEach((evento) => {
        listaHistorial.appendChild(crearItemEvento(evento, nombreEnHistorial, false));
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
        listaComentarios.innerHTML = '<li class="hilo-vacio">No se pudieron cargar los mensajes. Recarga la página para intentarlo de nuevo.</li>';
        return;
    }

    document.querySelector('#contador-comentarios').textContent = comentarios.length;

    if (comentarios.length === 0) {
        listaComentarios.innerHTML = '<li class="hilo-vacio">Aún no hay mensajes en este ticket.</li>';
        return;
    }

    comentarios.forEach((comentario) => {
        const esPropio = comentario.author_id === idUsuarioActual;
        const esDelCliente = comentario.author_id === ticket.created_by;
        const perfilAutor = perfiles.find((perfil) => perfil.id === comentario.author_id);

        let autor = 'Equipo NTEK';
        let iniciales = 'NT';
        if (esPropio) {
            autor = 'Tú';
            iniciales = obtenerIniciales(nombreUsuario);
        } else if (perfilAutor) {
            autor = perfilAutor.full_name;
            iniciales = obtenerIniciales(perfilAutor.full_name);
        }

        const fechaHora = new Date(comentario.created_at).toLocaleString('es-CL', formatoFechaHora);

        const item = document.createElement('li');
        item.className = 'mensaje';
        if (esPropio) {
            item.classList.add('mensaje--propio');
        }
        if (comentario.is_internal) {
            item.classList.add('mensaje--interna');
        }

        const etiquetaInterna = comentario.is_internal
            ? '<span class="mensaje-etiqueta">Nota interna</span>'
            : '';

        item.innerHTML = `
        <span class="avatar ${esDelCliente ? '' : 'avatar--equipo'}" aria-hidden="true">${escaparHTML(iniciales)}</span>
        <div class="mensaje-cuerpo">
          <p class="mensaje-cabecera">
            <span class="mensaje-autor">${escaparHTML(autor)}</span>
            <span class="mensaje-fecha">${fechaHora}</span>
            ${etiquetaInterna}
          </p>
          <p class="mensaje-texto">${escaparHTML(comentario.body)}</p>
        </div>
      `;

        listaComentarios.appendChild(item);
    });
}



function activarFormularioComentario() {
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
        <span class="archivo-icono ${icono.clase}" aria-hidden="true">${icono.texto}</span>
        <div class="archivo-datos">
          <p class="archivo-nombre">${etiquetasTipo[adjunto.mime_type]}</p>
          <p class="archivo-meta">${tamanoKB} KB · ${escaparHTML(autor)} · ${fechaHora}</p>
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

function activarFormularioAdjunto() {
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

                 botonSubir.disabled = false;
          botonSubir.textContent = 'Subir archivo';

        if (errorFicha) {
            await supabase.storage.from('adjuntos').remove([ruta]);
            mostrarNotificacion('No se pudo registrar el archivo. Intenta nuevamente.', 'error');
            return;
        }

        inputAdjunto.value = '';
        mostrarNotificacion('Archivo subido correctamente.', 'exito');
        await cargarAdjuntos();

                  botonSubir.disabled = false;
            botonSubir.textContent = 'Subir archivo';
    });
}

if (error || !ticket) {
    contenedorDetalle.innerHTML = '<div class="ticket-cabecera-texto"><h1>No se encontró el ticket solicitado</h1></div>';
    document.querySelector('.ticket-layout').hidden = true;
} else {
    dibujarDetalle(ticket);
    dibujarGestion(ticket);
    dibujarGestion(ticket);
    dibujarContextoOrigen(ticket);
    await Promise.all([cargarComentarios(), cargarAdjuntos(), cargarHistorial()]);
    activarFormularioComentario();
    activarFormularioAdjunto();
}

document.body.classList.remove('verificando');