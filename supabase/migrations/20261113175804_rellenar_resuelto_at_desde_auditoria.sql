begin;

alter table tickets disable trigger tickets_actualizar_updated_at;

update tickets t
set resuelto_at = (
  select max(a.created_at)
  from audit_events a
  where a.entity = 'ticket'
    and a.entity_id = t.id
    and a.metadata->>'despues' = 'resuelto'
)
where t.status = 'cerrado'
  and t.resuelto_at is null;

alter table tickets enable trigger tickets_actualizar_updated_at;

commit;