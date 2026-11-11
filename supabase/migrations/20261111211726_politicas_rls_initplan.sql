/*Tickets */
alter policy "admin actualiza cualquier ticket" on public.tickets
  using ((select is_admin()))
  with check ((select is_admin()));

alter policy insert_ticket_cliente on public.tickets
  with check (created_by = (select auth.uid()) and (select is_cliente()));

alter policy select_all_tickets_admin on public.tickets
  using ((select is_admin()));

alter policy select_own_tickets_cliente on public.tickets
  using (created_by = (select auth.uid()));

alter policy select_tickets_tecnico on public.tickets
  using ((select is_tecnico()) and (assigned_to = (select auth.uid()) or assigned_to is null));

alter policy "tecnico actualiza tickets propios o disponibles" on public.tickets
  using ((select is_tecnico()) and status <> 'cerrado' and (assigned_to is null or assigned_to = (select auth.uid())))
  with check ((select is_tecnico()) and assigned_to = (select auth.uid()));

  /*profiles*/

  alter policy select_all_profiles_admin on public.profiles
  using ((select is_admin()));

alter policy select_clients_tecnico on public.profiles
  using (role = 'cliente' and (select is_tecnico()));

alter policy select_own_profile on public.profiles
  using (id = (select auth.uid()));

alter policy update_any_profile_admin on public.profiles
  using ((select is_admin()))
  with check ((select is_admin()));

alter policy update_own_profile on public.profiles
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select profiles_1.role from public.profiles profiles_1 where profiles_1.id = (select auth.uid()))
    and active = (select profiles_1.active from public.profiles profiles_1 where profiles_1.id = (select auth.uid()))
  );

  /*comments*/

  alter policy insert_comment_cliente on public.comments
  with check (
    author_id = (select auth.uid())
    and is_internal = false
    and exists (
      select 1 from public.tickets
      where tickets.id = comments.ticket_id
        and tickets.created_by = (select auth.uid())
        and tickets.status <> 'cerrado'
    )
  );

alter policy insert_comment_equipo on public.comments
  with check (
    author_id = (select auth.uid())
    and (
      ((select is_tecnico()) and exists (
        select 1 from public.tickets
        where tickets.id = comments.ticket_id
          and (tickets.assigned_to = (select auth.uid()) or tickets.assigned_to is null)
      ))
      or (select is_admin())
    )
  );

alter policy select_comments_cliente on public.comments
  using (
    is_internal = false
    and exists (
      select 1 from public.tickets
      where tickets.id = comments.ticket_id
        and tickets.created_by = (select auth.uid())
    )
  );

alter policy select_comments_equipo on public.comments
  using (
    ((select is_tecnico()) and exists (
      select 1 from public.tickets
      where tickets.id = comments.ticket_id
        and (tickets.assigned_to = (select auth.uid()) or tickets.assigned_to is null)
    ))
    or (select is_admin())
  );

  /*attachments*/

  alter policy insert_attachment_cliente on public.attachments
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.tickets
      where tickets.id = attachments.ticket_id
        and tickets.created_by = (select auth.uid())
        and tickets.status <> 'cerrado'
    )
  );

alter policy insert_attachment_equipo on public.attachments
  with check (
    uploaded_by = (select auth.uid())
    and (
      ((select is_tecnico()) and exists (
        select 1 from public.tickets
        where tickets.id = attachments.ticket_id
          and (tickets.assigned_to = (select auth.uid()) or tickets.assigned_to is null)
      ))
      or (select is_admin())
    )
  );

alter policy select_attachments_cliente on public.attachments
  using (
    exists (
      select 1 from public.tickets
      where tickets.id = attachments.ticket_id
        and tickets.created_by = (select auth.uid())
    )
  );

alter policy select_attachments_equipo on public.attachments
  using (
    ((select is_tecnico()) and exists (
      select 1 from public.tickets
      where tickets.id = attachments.ticket_id
        and (tickets.assigned_to = (select auth.uid()) or tickets.assigned_to is null)
    ))
    or (select is_admin())
  );

  /*audit_events*/

  alter policy "Admin puede ver auditoria" on public.audit_events
  using ((select is_admin()));

alter policy "Cliente ve historial de sus tickets" on public.audit_events
  using (
    (select is_cliente())
    and entity = 'ticket'
    and action = any (array['crear', 'asignar', 'cambiar_estado', 'cerrar', 'reabrir'])
    and exists (select 1 from public.tickets where tickets.id = audit_events.entity_id)
  );

alter policy "Tecnico ve auditoria de sus tickets" on public.audit_events
  using (
    (select is_tecnico())
    and entity = 'ticket'
    and exists (select 1 from public.tickets where tickets.id = audit_events.entity_id)
  );