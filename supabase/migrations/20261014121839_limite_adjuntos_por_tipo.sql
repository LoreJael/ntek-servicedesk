create or replace function public.limitar_adjuntos_por_tipo()
returns trigger
language plpgsql
as $$
declare
  tipos_grupo text[];
  max_archivos int;
  cantidad int;
begin
  if new.mime_type in ('image/jpeg', 'image/png') then
    tipos_grupo := array['image/jpeg', 'image/png'];
    max_archivos := 3;
  elsif new.mime_type = 'application/pdf' then
    tipos_grupo := array['application/pdf'];
    max_archivos := 1;
  elsif new.mime_type = 'text/markdown' then
    tipos_grupo := array['text/markdown'];
    max_archivos := 5;
  else
    raise exception 'Tipo de archivo no permitido';
  end if;

  select count(*) into cantidad
  from public.attachments
  where ticket_id = new.ticket_id
    and mime_type = any(tipos_grupo);

  if cantidad >= max_archivos then
    raise exception 'Se alcanzó el máximo de archivos de este tipo para el ticket';
  end if;

  return new;
end;
$$;

create trigger attachments_limitar_por_tipo
before insert on public.attachments
for each row execute function public.limitar_adjuntos_por_tipo();