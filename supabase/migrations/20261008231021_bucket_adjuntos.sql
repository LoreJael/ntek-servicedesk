insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'adjuntos',
  'adjuntos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;