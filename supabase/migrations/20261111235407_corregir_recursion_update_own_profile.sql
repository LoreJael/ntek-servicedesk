create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.activo_actual()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select active from public.profiles where id = auth.uid();
$$;

revoke execute on function public.rol_actual() from public, anon;
revoke execute on function public.activo_actual() from public, anon;

alter policy update_own_profile on public.profiles
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select rol_actual())
    and active = (select activo_actual())
  );