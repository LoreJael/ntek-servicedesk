-- 1. Permitir eventos sin actor (cambios hechos desde el panel de Supabase)
alter table public.audit_events
alter column actor_id drop not null;


create or replace function public.registrar_auditoria_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  accion text;
begin
  -- Caso A: se creó un ticket
  if tg_op = 'INSERT' then
    insert into public.audit_events (actor_id, action, entity, entity_id, metadata)
    values (auth.uid(), 'crear', 'ticket', new.id,
            jsonb_build_object('estado', new.status, 'prioridad', new.priority));
    return new;
  end if;

  -- Caso B: se modificó un ticket (cada cambio por separado)
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.audit_events (actor_id, action, entity, entity_id, metadata)
    values (auth.uid(), 'asignar', 'ticket', new.id,
            jsonb_build_object('antes', old.assigned_to, 'despues', new.assigned_to));
  end if;

  if new.priority is distinct from old.priority then
    insert into public.audit_events (actor_id, action, entity, entity_id, metadata)
    values (auth.uid(), 'cambiar_prioridad', 'ticket', new.id,
            jsonb_build_object('antes', old.priority, 'despues', new.priority));
  end if;

  if new.status is distinct from old.status then
    if new.status = 'cerrado' then
      accion := 'cerrar';
    elsif old.status in ('resuelto', 'cerrado') then
      accion := 'reabrir';
    else
      accion := 'cambiar_estado';
    end if;

    insert into public.audit_events (actor_id, action, entity, entity_id, metadata)
    values (auth.uid(), accion, 'ticket', new.id,
            jsonb_build_object('antes', old.status, 'despues', new.status));
  end if;

  return new;
end;
$$;


create trigger tickets_auditoria
after insert or update on public.tickets
for each row execute function public.registrar_auditoria_ticket();