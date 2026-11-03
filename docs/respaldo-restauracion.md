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

4. Cargar los datos con `psql`. Se usa desde la imagen oficial de Postgres en Docker, para no instalarlo aparte:

   ```bash
   docker run --rm -v "${PWD}/respaldos:/respaldos" postgres:17 psql "<cadena-de-conexión>" --single-transaction --variable ON_ERROR_STOP=1 --file /respaldos/AAAA-MM-DD_datos.sql
   ```

   `--single-transaction` hace que, si una línea falla, no se guarde nada (no queda una restauración a medias). `ON_ERROR_STOP=1` detiene la carga en el primer error.

5. Volver a configurar lo que no está en el respaldo: Site URL y Redirect URLs en Auth, secretos de la Edge Function y de Vault, y subir los archivos a los buckets.
6. Cambiar la URL y la llave `anon` en `js/supabase-client.js` por las del proyecto nuevo.

## Comprobar la restauración

- Iniciar sesión con una cuenta de prueba de cada rol.
- Comparar la cantidad de filas de `tickets`, `comments` y `audit_events` con las del proyecto original (`select count(*) from ...`).
- Revisar en Auditoría que no aparezcan eventos nuevos con la fecha de la restauración.