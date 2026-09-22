SET local check_function_bodies = off;

CREATE TABLE "public"."attachments" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id"   uuid                     NOT NULL,
  "uploaded_by" uuid                     NOT NULL,
  "path"        text                     NOT NULL,
  "mime_type"   text                     NOT NULL,
  "size_bytes"  bigint                   NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "attachments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."attachments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."comments" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id"   uuid                     NOT NULL,
  "author_id"   uuid                     NOT NULL,
  "body"        text                     NOT NULL,
  "is_internal" boolean                  NOT NULL DEFAULT false,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "comments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."comments"
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

ALTER TABLE "public"."attachments"
  ADD CONSTRAINT "attachments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

ALTER TABLE "public"."attachments"
  ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

CREATE POLICY "insert_attachment_cliente" ON "public"."attachments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = attachments.ticket_id) AND (tickets.created_by = auth.uid()))))));

CREATE POLICY "insert_attachment_equipo" ON "public"."attachments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((uploaded_by = auth.uid()) AND ((public.is_tecnico() AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = attachments.ticket_id) AND ((tickets.assigned_to = auth.uid()) OR (tickets.assigned_to IS NULL)))))) OR public.is_admin())));

CREATE POLICY "select_attachments_cliente" ON "public"."attachments"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = attachments.ticket_id) AND (tickets.created_by = auth.uid())))));

CREATE POLICY "select_attachments_equipo" ON "public"."attachments"
  FOR SELECT
  TO "authenticated"
  USING (((public.is_tecnico() AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = attachments.ticket_id) AND ((tickets.assigned_to = auth.uid()) OR (tickets.assigned_to IS NULL)))))) OR public.is_admin()));

CREATE POLICY "insert_comment_cliente" ON "public"."comments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((author_id = auth.uid()) AND (is_internal = false) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = comments.ticket_id) AND (tickets.created_by = auth.uid()))))));

CREATE POLICY "insert_comment_equipo" ON "public"."comments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((author_id = auth.uid()) AND ((public.is_tecnico() AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = comments.ticket_id) AND ((tickets.assigned_to = auth.uid()) OR (tickets.assigned_to IS NULL)))))) OR public.is_admin())));

CREATE POLICY "select_comments_cliente" ON "public"."comments"
  FOR SELECT
  TO "authenticated"
  USING (((is_internal = false) AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = comments.ticket_id) AND (tickets.created_by = auth.uid()))))));

CREATE POLICY "select_comments_equipo" ON "public"."comments"
  FOR SELECT
  TO "authenticated"
  USING (((public.is_tecnico() AND (EXISTS ( SELECT 1
   FROM public.tickets
  WHERE ((tickets.id = comments.ticket_id) AND ((tickets.assigned_to = auth.uid()) OR (tickets.assigned_to IS NULL)))))) OR public.is_admin()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."attachments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comments" TO "anon", "authenticated", "postgres", "service_role";

