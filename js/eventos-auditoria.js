import { escaparHTML } from './seguridad.js';

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

function describirCambio(evento, nombreDe) {
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

export function crearItemEvento(evento, nombreDe, mostrarEnlace) {
    const actor = evento.actor_id ? nombreDe(evento.actor_id) : 'Sistema';
    const fecha = new Date(evento.created_at).toLocaleString('es-CL', formatoFechaHora);

    const enlace = mostrarEnlace
        ? `<a href="../equipo/detalle-ticket.html?id=${evento.entity_id}">Ticket ${evento.entity_id.slice(0, 8)}</a>`
        : '';

    const item = document.createElement('li');
    item.className = `evento evento--${evento.action}`;
    item.innerHTML = `
        <span class="evento-icono" aria-hidden="true">${iconosAccion[evento.action]}</span>
        <div class="evento-cuerpo">
            <p class="evento-titulo"><strong>${escaparHTML(actor)}</strong> ${etiquetasAccion[evento.action]}</p>
            <p class="evento-detalle">
                ${enlace}
                ${describirCambio(evento, nombreDe)}
            </p>
        </div>
        <time class="evento-fecha" datetime="${evento.created_at}">${fecha}</time>
    `;

    return item;
}