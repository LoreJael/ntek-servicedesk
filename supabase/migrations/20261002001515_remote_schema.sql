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

CREATE TRIGGER profiles_proteger_ultimo_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_ultimo_admin();

GRANT EXECUTE ON FUNCTION "public"."proteger_ultimo_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

