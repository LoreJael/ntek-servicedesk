begin;

drop trigger set_tickets_updated_at on public.tickets;
drop function public.set_updated_at();

alter table public.tickets disable trigger tickets_actualizar_updated_at;

update public.tickets t
set updated_at = coalesce(
  (select max(a.created_at)
   from public.audit_events a
   where a.entity = 'ticket' and a.entity_id = t.id),
  t.created_at
)
where t.updated_at = '2026-11-13 17:46:17.872311+00';

alter table public.tickets enable trigger tickets_actualizar_updated_at;

commit;