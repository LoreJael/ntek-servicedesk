import { protegerRuta, activarBotonCerrarSesion } from './sesion.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { supabase } from './supabase-client.js';
import { crearItemEvento } from './eventos-auditoria.js';

const rolActual = await protegerRuta(['admin'], false);

document.getElementById('header-placeholder').innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

const listaAuditoria = document.querySelector('#lista-auditoria');

let perfiles = [];

function nombreDe(id) {
    const perfil = perfiles.find((p) => p.id === id);
    return perfil ? perfil.full_name : 'Usuario desconocido';
}

function dibujarEventos(eventos) {
    listaAuditoria.innerHTML = '';

    if (eventos.length === 0) {
        mostrarEstadoVacio(listaAuditoria, 'Todavía no hay movimientos registrados.');
        return;
    }

    eventos.forEach((evento) => {
        listaAuditoria.appendChild(crearItemEvento(evento, nombreDe, true));
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