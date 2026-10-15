import { protegerRuta, activarBotonCerrarSesion } from './sesion.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';

const rolActual = await protegerRuta(['admin'], false);

document.getElementById('header-placeholder').innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

const listaAuditoria = document.querySelector('#lista-auditoria');

const formatoFechaHora = {
    timeZone: 'America/Santiago',
    dateStyle: 'short',
    timeStyle: 'short'
};

const etiquetasAccion = {
    crear: 'creó el ticket',
    asignar: 'cambió la asignación',
    cambiar_estado: 'cambió el estado',
    cambiar_prioridad: 'cambió la prioridad',
    cerrar: 'cerró el ticket',
    reabrir: 'reabrió el ticket'
};

const iconosAccion = {
    crear: '＋',
    asignar: '⇄',
    cambiar_estado: '↻',
    cambiar_prioridad: '▲',
    cerrar: '✓',
    reabrir: '↺'
};

const etiquetasValor = {
    nuevo: 'Nuevo',
    en_revision: 'En revisión',
    en_progreso: 'En progreso',
    en_espera: 'En espera',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica'
};

let perfiles = [];

function nombreDe(id) {
    const perfil = perfiles.find((p) => p.id === id);
    return perfil ? perfil.full_name : 'Usuario desconocido';
}

function describirCambio(evento) {
    const { antes, despues } = evento.metadata;

    if (evento.action === 'crear') {
        return '';
    }

    let textoAntes;
    let textoDespues;

    if (evento.action === 'asignar') {
        textoAntes = antes ? escaparHTML(nombreDe(antes)) : 'Sin asignar';
        textoDespues = despues ? escaparHTML(nombreDe(despues)) : 'Sin asignar';
    } else {
        textoAntes = etiquetasValor[antes] ?? antes;
        textoDespues = etiquetasValor[despues] ?? despues;
    }

    return `
        <span class="pildora">${textoAntes}</span>
        <span class="flecha">→</span>
        <span class="pildora pildora--nueva">${textoDespues}</span>
    `;
}

function dibujarEventos(eventos) {
    listaAuditoria.innerHTML = '';

    if (eventos.length === 0) {
        mostrarEstadoVacio(listaAuditoria, 'Todavía no hay eventos registrados.');
        return;
    }

    eventos.forEach((evento) => {
        const actor = evento.actor_id ? nombreDe(evento.actor_id) : 'Sistema';
        const fecha = new Date(evento.created_at).toLocaleString('es-CL', formatoFechaHora);
        const idCorto = evento.entity_id.slice(0, 8);

        const item = document.createElement('li');
        item.className = `evento evento--${evento.action}`;
        item.innerHTML = `
            <span class="evento-icono" aria-hidden="true">${iconosAccion[evento.action]}</span>
            <div class="evento-cuerpo">
                <p class="evento-titulo"><strong>${escaparHTML(actor)}</strong> ${etiquetasAccion[evento.action]}</p>
                <p class="evento-detalle">
                    <a href="../equipo/detalle-ticket.html?id=${evento.entity_id}">Ticket ${idCorto}</a>
                    ${describirCambio(evento)}
                </p>
            </div>
            <time class="evento-fecha" datetime="${evento.created_at}">${fecha}</time>
        `;
        listaAuditoria.appendChild(item);
    });
}

async function cargarAuditoria() {
    const { data: datosPerfiles, error: errorPerfiles } = await supabase
        .from('profiles')
        .select('id, full_name');

    const { data: eventos, error: errorEventos } = await supabase
        .from('audit_events')
        .select('id, actor_id, action, entity_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (errorPerfiles || errorEventos) {
        mostrarErrorRecuperable(listaAuditoria, 'No pudimos cargar la auditoría.', () => location.reload());
        return;
    }

    perfiles = datosPerfiles;
    dibujarEventos(eventos);
}

await cargarAuditoria();
document.body.classList.remove('verificando');