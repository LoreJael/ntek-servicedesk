alter table public.tickets
  add column contexto_origen jsonb;

create or replace function public.abrir_subticket(id_ticket uuid, motivo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  original public.tickets;
  id_subticket uuid;
  contexto jsonb;
begin
  -- 1) Validar el motivo
  if motivo is null or char_length(trim(motivo)) < 15 or char_length(motivo) > 2000 then
    raise exception 'El motivo debe tener entre 15 y 2000 caracteres.';
  end if;

  -- 2) Cerrar el original, solo si cumple todas las reglas
  update tickets
  set status = 'cerrado'
  where id = id_ticket
    and created_by = auth.uid()
    and status = 'resuelto'
    and ticket_origen_id is null
    and resuelto_at > now() - interval '7 days'
    and exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.active = true
    )
  returning * into original;

  if not found then
    raise exception 'No se puede abrir un subticket para este ticket.';
  end if;

  -- 3) Armar la copia del original (solo lo que el cliente ya podía ver)
  contexto := jsonb_build_object(
    'titulo', original.title,
    'descripcion', original.description,
    'creado', original.created_at,
    'eventos', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'accion', e.action,
               'actor_id', e.actor_id,
               'metadata', e.metadata,
               'fecha', e.created_at
             ) order by e.created_at), '[]'::jsonb)
      from audit_events e
      where e.entity = 'ticket'
        and e.entity_id = original.id
        and e.action <> 'cambiar_prioridad'
    ),
    'comentarios', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'autor_id', c.author_id,
               'texto', c.body,
               'fecha', c.created_at
             ) order by c.created_at), '[]'::jsonb)
      from comments c
      where c.ticket_id = original.id
        and c.is_internal = false
    )
  );

  -- 4) Crear el subticket
  insert into tickets (created_by, title, description, category, priority,
                       ticket_origen_id, contexto_origen)
  values (original.created_by,
          left('Subticket: ' || original.title, 120),
          motivo,
          original.category,
          original.priority,
          original.id,
          contexto)
  returning id into id_subticket;

  return id_subticket;
end;
$$;


revoke execute on function public.abrir_subticket(uuid, text) from public, anon;
grant execute on function public.abrir_subticket(uuid, text) to authenticated;