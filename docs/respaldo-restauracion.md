# Respaldo y restauración de la base de datos

## Qué se respalda

| Parte | Dónde queda | ¿En el repositorio? |
|---|---|---|
| Estructura (tablas, RLS, funciones, triggers) | Migraciones en `supabase/migrations/` | Sí |
| Estructura en un solo archivo | `respaldos/<fecha>_esquema.sql` | No |
| Datos (perfiles, tickets, comentarios, fichas de adjuntos, auditoría y cuentas de Auth) | `respaldos/<fecha>_datos.sql` | **No** |

La carpeta `respaldos/` está en `.gitignore`. El respaldo de datos contiene correos y contraseñas cifradas de las cuentas de Auth, y el repositorio es público. Los respaldos se guardan fuera de Git y se entregan por un canal privado.

**No incluye:**
- Los archivos guardados en Storage (buckets `adjuntos` y `auditoria`). Solo se respaldan sus fichas en `attachments`. Los archivos se descargan desde el panel de Supabase (Storage → bucket → carpeta).
- La configuración de Auth del panel (Site URL y Redirect URLs).
- Los secretos de la Edge Function y de Vault (por ejemplo, la clave `x-clave-auditoria`).

## Crear un respaldo

Requisitos: Docker Desktop abierto y el proyecto enlazado con `npx supabase link`.

```bash
npx supabase db dump -f respaldos/AAAA-MM-DD_esquema.sql
npx supabase db dump --data-only --use-copy -f respaldos/AAAA-MM-DD_datos.sql
```

El primer comando guarda la estructura. El segundo guarda solo los datos, con `COPY` (carga muchas filas de una vez).

Al respaldar los datos, `pg_dump` advierte que `tickets` tiene una llave foránea circular: `ticket_origen_id` apunta a otra fila de `tickets` (el subticket apunta a su original). No es un error. El archivo empieza con `SET session_replication_role = replica;`, que durante la restauración desactiva los triggers y la revisión de llaves foráneas. Así las filas se cargan en cualquier orden y los triggers (auditoría, `updated_at`, límites de adjuntos) no agregan ni cambian datos.

## Restaurar en un proyecto nuevo

1. Crear un proyecto nuevo en Supabase y copiar su cadena de conexión (Connect → Session pooler).
2. Enlazar la CLI al proyecto nuevo:

   ```bash
   npx supabase link --project-ref <ref-del-proyecto-nuevo>
   ```

3. Crear la estructura aplicando las migraciones:

   ```bash
   npx supabase db push
   ```

4. Cargar los datos con `psql`, **sin la sección `storage`**. Los buckets ya los crean las migraciones (si se cargan de nuevo, falla por llave duplicada) y las fichas de `storage.objects` no sirven sin los archivos, que no vienen en el respaldo.

   Primero buscar en qué línea empieza la sección `storage`:

   ```powershell
   Select-String -Path respaldos\AAAA-MM-DD_datos.sql -Pattern '^COPY "storage"' | Select-Object -First 1
   ```

   Luego cargar solo hasta la línea anterior (en el respaldo del 03-11, la sección empieza en la 427, así que se carga hasta la 426). Se usa `psql` desde la imagen oficial de Postgres en Docker, para no instalarlo aparte. El corte se hace con `head` dentro del contenedor, para no cambiar la codificación del archivo (Ñ, tildes, emoji):

   ```bash
   docker run --rm -v "${PWD}/respaldos:/respaldos" postgres:17 sh -c "head -n <línea-anterior> /respaldos/AAAA-MM-DD_datos.sql | psql '<cadena-de-conexión>' --single-transaction --variable ON_ERROR_STOP=1"
   ```

   `--single-transaction` hace que, si una línea falla, no se guarde nada (no queda una restauración a medias). `ON_ERROR_STOP=1` detiene la carga en el primer error.

5. Volver a configurar lo que no está en el respaldo: Site URL y Redirect URLs en Auth, secretos de la Edge Function y de Vault, y subir los archivos a los buckets.
6. Cambiar la URL y la llave `anon` en `js/supabase-client.js` por las del proyecto nuevo.

## Comprobar la restauración

- Iniciar sesión con una cuenta de prueba de cada rol.
- Comparar la cantidad de filas de `tickets`, `comments` y `audit_events` con las del proyecto original (`select count(*) from ...`).
- Revisar en Auditoría que no aparezcan eventos nuevos con la fecha de la restauración.

## Probar la restauración en local

Probado el 04-11 con el respaldo del 03-11 (detalle en `docs/pruebas.md`).

1. Con Docker Desktop abierto: `npx supabase start`. Levanta un Supabase local y aplica todas las migraciones (crea la estructura y los buckets). No toca el proyecto en la nube.
2. Cargar los datos como en el punto 4, con esta cadena de conexión:

   ```
   postgresql://postgres:postgres@host.docker.internal:54322/postgres
   ```

   Se usa `host.docker.internal` y no `127.0.0.1`, porque `psql` corre dentro de un contenedor: para el contenedor, `127.0.0.1` es él mismo.
3. Para iniciar sesión contra la base local, cambiar **temporalmente** en `js/supabase-client.js` la URL por `http://127.0.0.1:54321` y la llave por la `ANON_KEY` de `npx supabase status -o env`, y abrir la app con Live Server. Al terminar: `git restore js/supabase-client.js` (este cambio nunca se sube).
4. Apagar con `npx supabase stop`.

Si se vuelve a cargar sobre una base local que ya tiene datos, primero `npx supabase db reset` (sin `--linked`): borra la base **local** y vuelve a aplicar las migraciones.