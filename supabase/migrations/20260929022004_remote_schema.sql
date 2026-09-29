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

CREATE TRIGGER tickets_actualizar_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

CREATE POLICY "admin actualiza cualquier ticket" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tecnico actualiza tickets propios o disponibles" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_tecnico() AND (status <> 'cerrado'::text) AND ((assigned_to IS NULL) OR (assigned_to = auth.uid()))))
  WITH CHECK ((public.is_tecnico() AND (assigned_to = auth.uid())));

GRANT EXECUTE ON FUNCTION "public"."actualizar_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

