SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.proteger_ultimo_admin()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if old.role = 'admin' and old.active = true
     and (new.role <> 'admin' or new.active = false) then

    if not exists (
      select 1 from public.profiles
      where role = 'admin' and active = true and id <> old.id
    ) then
      raise exception 'No se puede quitar el rol ni desactivar al último administrador activo.';
    end if;

  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.usuario_activo()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select coalesce(
    (select active from public.profiles where id = auth.uid()),
    false
  );
$function$;

