alter table public.tickets
  add column ticket_origen_id uuid unique references public.tickets(id),
  add column resuelto_at timestamptz;

update public.tickets
set resuelto_at = updated_at
where status = 'resuelto';