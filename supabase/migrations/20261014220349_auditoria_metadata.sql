   alter table public.audit_events
   add column metadata jsonb not null default '{}'::jsonb;