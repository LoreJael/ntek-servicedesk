SET local check_function_bodies = off;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "full_name"  text,
  "phone"      text,
  "company"    text,
  "role"       text                     NOT NULL DEFAULT 'cliente'::text,
  "active"     boolean                  NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['cliente'::text, 'tecnico'::text, 'admin'::text])))
);

ALTER TABLE "public"."profiles"
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

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "select_all_profiles_admin" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "select_clients_tecnico" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((ROLE = 'cliente'::text) AND public.is_tecnico()));

CREATE POLICY "select_own_profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = auth.uid()));

CREATE POLICY "update_any_profile_admin" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "update_own_profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK (((id = auth.uid()) AND (role = ( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid()))) AND (active = ( SELECT profiles_1.active
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())))));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_tecnico"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

