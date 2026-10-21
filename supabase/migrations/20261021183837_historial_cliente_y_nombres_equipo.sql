-- 1) Nombres del equipo: entrega SOLO el nombre de técnicos y admins
create or replace function public.nombres_equipo(ids uuid[])
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name
  from public.profiles p
  where p.id = any(ids)
    and p.role in ('tecnico', 'admin');
$$;
 
revoke execute on function public.nombres_equipo(uuid[]) from public, anon;
grant execute on function public.nombres_equipo(uuid[]) to authenticated;
 
-- 2) El cliente ve el historial de sus propios tickets (sin cambios de prioridad)
create policy "Cliente ve historial de sus tickets"
on public.audit_events
for select
to authenticated
using (
  public.is_cliente()
  and entity = 'ticket'
  and action in ('crear', 'asignar', 'cambiar_estado', 'cerrar', 'reabrir')
  and exists (
    select 1
    from public.tickets
    where tickets.id = audit_events.entity_id
  )
);
 