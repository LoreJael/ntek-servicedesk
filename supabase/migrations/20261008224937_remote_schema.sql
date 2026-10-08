SET local check_function_bodies = off;

DROP POLICY "insert_attachment_cliente" ON "public"."attachments";

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

CREATE POLICY "insert_attachment_cliente" ON "public"."attachments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = attachments.ticket_id) AND (tickets.created_by = auth.uid()) AND (tickets.status <> 'cerrado'::text))))));

CREATE POLICY "delete_adjuntos_propios" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'adjuntos'::text) AND (owner_id = (auth.uid())::text)));

CREATE POLICY "insert_adjuntos_ticket_visible" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'adjuntos'::text) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id)::text = (storage.foldername(objects.name))[1])))));

CREATE POLICY "select_adjuntos_ticket_visible" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'adjuntos'::text) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id)::text = (storage.foldername(objects.name))[1])))));

