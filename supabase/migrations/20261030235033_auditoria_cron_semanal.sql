create extension if not exists pg_net;

select cron.schedule(
  'archivar_auditoria_semanal',
  '0 6 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'auditoria_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-clave-auditoria', (select decrypted_secret from vault.decrypted_secrets where name = 'auditoria_clave')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);