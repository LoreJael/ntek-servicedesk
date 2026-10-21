alter table public.tickets
  add constraint tickets_titulo_largo
    check (char_length(btrim(title)) between 5 and 120),
  add constraint tickets_descripcion_largo
    check (char_length(btrim(description)) between 10 and 2000),
  add constraint tickets_categoria_valida
    check (category in ('Software', 'Hardware', 'Red', 'Cuenta'));

alter table public.comments
  add constraint comments_cuerpo_largo
    check (char_length(btrim(body)) between 10 and 2000) not valid;