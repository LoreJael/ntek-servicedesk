insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'auditoria',
  'auditoria',
  false,
  5242880,
  array['text/plain']
)
on conflict (id) do nothing;

create policy "select_auditoria_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'auditoria'
  and public.is_admin()
);