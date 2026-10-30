create or replace function public.borrar_auditoria_antigua()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  borrados integer;
begin
  delete from audit_events e
  using tickets t
  where e.entity = 'ticket'
    and e.entity_id = t.id
    and t.status = 'cerrado'
    and t.updated_at < now() - interval '2 months';

  get diagnostics borrados = row_count;
  return borrados;
end;
$$;

revoke execute on function public.borrar_auditoria_antigua() from public, anon, authenticated;