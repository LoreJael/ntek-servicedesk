create or replace function public.registrar_resuelto_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resuelto' and old.status is distinct from 'resuelto' then
    new.resuelto_at = now();
  end if;

  return new;
end;
$$;

create trigger tickets_resuelto_at
before update on public.tickets
for each row execute function public.registrar_resuelto_at();