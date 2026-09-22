SET local check_function_bodies = off;

CREATE TABLE "public"."audit_events" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"   uuid                     NOT NULL,
  "action"     text                     NOT NULL,
  "entity"     text                     NOT NULL,
  "entity_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_events_action_check"
    CHECK ((action = ANY (ARRAY['crear'::text, 'asignar'::text, 'cambiar_estado'::text, 'cambiar_prioridad'::text, 'cerrar'::text, 'reabrir'::text]))),
  CONSTRAINT "audit_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_events"
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

ALTER TABLE "public"."audit_events"
  ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id);

CREATE POLICY "Admin puede ver auditoria" ON "public"."audit_events"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_events" TO "anon", "authenticated", "postgres", "service_role";

