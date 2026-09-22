SET local check_function_bodies = off;

CREATE TABLE "public"."tickets" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "created_by"  uuid                     NOT NULL,
  "assigned_to" uuid,
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL,
  "category"    text                     NOT NULL,
  "priority"    text                     NOT NULL,
  "status"      text                     NOT NULL DEFAULT 'nuevo'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tickets_pkey" PRIMARY KEY (id),
  CONSTRAINT "tickets_priority_check" CHECK ((priority = ANY (ARRAY['baja'::text, 'media'::text, 'alta'::text, 'critica'::text]))),
  CONSTRAINT "tickets_status_check" CHECK ((status = ANY (ARRAY['nuevo'::text, 'en_revision'::text, 'en_progreso'::text, 'en_espera'::text, 'resuelto'::text, 'cerrado'::text])))
);

ALTER TABLE "public"."tickets"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  insert into public.profiles (id, full_name, phone, company)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'company'
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_cliente()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'cliente'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_tecnico()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'tecnico'
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);

ALTER TABLE "public"."tickets"
  ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "insert_ticket_cliente" ON "public"."tickets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((created_by = auth.uid()) AND public.is_cliente()));

CREATE POLICY "select_all_tickets_admin" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "select_own_tickets_cliente" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING ((created_by = auth.uid()));

CREATE POLICY "select_tickets_tecnico" ON "public"."tickets"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_tecnico() AND ((assigned_to = auth.uid()) OR (assigned_to IS NULL))));

CREATE POLICY "update_ticket_admin" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "update_ticket_tecnico" ON "public"."tickets"
  FOR UPDATE
  TO "authenticated"
  USING ((public.is_tecnico() AND ((assigned_to = auth.uid()) OR (assigned_to IS NULL))))
  WITH CHECK ((public.is_tecnico() AND ((assigned_to = auth.uid()) OR (assigned_to IS NULL))));

GRANT EXECUTE ON FUNCTION "public"."is_cliente"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tickets" TO "anon", "authenticated", "postgres", "service_role";

