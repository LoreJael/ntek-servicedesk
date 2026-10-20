create policy "Tecnico ve auditoria de sus tickets"
on public.audit_events
for select
to authenticated
using (
  public.is_tecnico()
  and entity = 'ticket'
  and exists (
    select 1
    from public.tickets
    where tickets.id = audit_events.entity_id
  )
);