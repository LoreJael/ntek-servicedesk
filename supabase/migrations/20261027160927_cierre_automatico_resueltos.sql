create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.cerrar_resueltos_vencidos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update tickets
  set status = 'cerrado'
  where status = 'resuelto'
    and resuelto_at <= now() - interval '7 days';
end;
$$;

revoke execute on function public.cerrar_resueltos_vencidos() from public, anon, authenticated;

select cron.schedule(
  'cerrar_resueltos_vencidos',
  '0 7 * * *',
  'select public.cerrar_resueltos_vencidos();'
);