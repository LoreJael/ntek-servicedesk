import { createClient } from 'npm:@supabase/supabase-js@2';

const etiquetasAccion: Record<string, string> = {
  crear: 'creó el ticket',
  asignar: 'cambió la asignación',
  cambiar_estado: 'cambió el estado',
  cambiar_prioridad: 'cambió la prioridad',
  cerrar: 'cerró el ticket',
  reabrir: 'reabrió el ticket',
};

const etiquetasValor: Record<string, string> = {
  nuevo: 'Nuevo', en_revision: 'En revisión', en_progreso: 'En progreso',
  en_espera: 'En espera', resuelto: 'Resuelto', cerrado: 'Cerrado',
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
};

Deno.serve(async (req) => {
  const clave = req.headers.get('x-clave-auditoria');
  if (clave !== Deno.env.get('AUDITORIA_CLAVE')) {
    return new Response('No autorizado', { status: 401 });
  }

  const cuerpo: { desde?: string } = await req.json().catch(() => ({}));
  const unDia = 24 * 60 * 60 * 1000;
  let desde: Date;

  if (cuerpo.desde) {
    desde = new Date(cuerpo.desde + 'T00:00:00Z');
  } else {
    const hoy = new Date();
    const diasDesdeLunes = (hoy.getUTCDay() + 6) % 7;
    desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - diasDesdeLunes - 7));
  }

  const hasta = new Date(desde.getTime() + 7 * unDia);
  const domingo = new Date(hasta.getTime() - unDia);
  const nombreArchivo = `${desde.toISOString().slice(0, 10)}_a_${domingo.toISOString().slice(0, 10)}.txt`;

    const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: eventos, error: errorEventos } = await supabase
    .from('audit_events')
    .select('action, actor_id, entity_id, metadata, created_at')
    .gte('created_at', desde.toISOString())
    .lt('created_at', hasta.toISOString())
    .order('created_at');

  const { data: perfiles, error: errorPerfiles } = await supabase
    .from('profiles')
    .select('id, full_name');

  if (errorEventos || errorPerfiles) {
    console.error(errorEventos ?? errorPerfiles);
    return new Response('Error al leer los datos', { status: 500 });
  }

    const nombreDe = (id: string | null, siVacio: string) => {
    if (!id) return siVacio;
    return perfiles.find((p) => p.id === id)?.full_name ?? 'Usuario desconocido';
  };

  const lineas = eventos.map((e) => {
    const fecha = new Date(e.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    let cambio = '';

    if (e.action === 'asignar') {
      cambio = `${nombreDe(e.metadata.antes, 'Sin asignar')} → ${nombreDe(e.metadata.despues, 'Sin asignar')}`;
    } else if (e.action !== 'crear') {
      cambio = `${etiquetasValor[e.metadata.antes] ?? e.metadata.antes} → ${etiquetasValor[e.metadata.despues] ?? e.metadata.despues}`;
    }

    return `${fecha} | ${nombreDe(e.actor_id, 'Sistema')} | ${etiquetasAccion[e.action]} | Ticket ${e.entity_id.slice(0, 8)} | ${cambio}`;
  });

  const texto = [
    `Auditoría NTEK ServiceDesk — semana del ${nombreArchivo.replace('.txt', '').replace('_a_', ' al ')} (UTC)`,
    `Total de eventos: ${eventos.length}`,
    '',
    ...(lineas.length > 0 ? lineas : ['Sin eventos en esta semana.']),
  ].join('\n');

    const { error: errorSubida } = await supabase.storage
    .from('auditoria')
    .upload(nombreArchivo, new Blob([texto], { type: 'text/plain' }), {
      contentType: 'text/plain',
      upsert: true,
    });

  if (errorSubida) {
    console.error(errorSubida);
    return new Response('Error al subir el archivo', { status: 500 });
  }

  const { data: borrados, error: errorBorrado } = await supabase.rpc('borrar_auditoria_antigua');

  if (errorBorrado) {
    console.error(errorBorrado);
    return new Response('Archivo subido, pero falló el borrado', { status: 500 });
  }

  return new Response(
    JSON.stringify({ archivo: nombreArchivo, eventos: eventos.length, borrados }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});