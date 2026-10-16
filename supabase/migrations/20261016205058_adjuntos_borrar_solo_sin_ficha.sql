-- Cierra el hueco de delete_adjuntos_propios:
-- un usuario solo puede borrar de Storage archivos propios SIN ficha en attachments
-- (la limpieza cuando falla el insert de la ficha sigue funcionando).

create or replace function public.adjunto_tiene_ficha(ruta text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from attachments
    where attachments.path = ruta
  );
$$;

drop policy delete_adjuntos_propios on storage.objects;

create policy delete_adjuntos_propios
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'adjuntos'
  and owner_id = (auth.uid())::text
  and not public.adjunto_tiene_ficha(name)
);