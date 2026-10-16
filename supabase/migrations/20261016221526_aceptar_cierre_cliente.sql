create or replace function public.aceptar_cierre(id_ticket uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update tickets
  set status = 'cerrado'
  where id = id_ticket
    and created_by = auth.uid()
    and status = 'resuelto'
    and exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.active = true
    );

  if not found then
    raise exception 'No se puede aceptar el cierre de este ticket.';
  end if;
end;
$$;