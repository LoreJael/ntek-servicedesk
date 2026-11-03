# NTEK ServiceDesk Lite

Sistema web de solicitudes de soporte y seguimiento para clientes de NTEK.

## Stack
HTML, CSS, JavaScript (módulos ES, sin framework), Supabase (Auth, Postgres, Storage, RLS), Docker, Render, Cloudflare.

## Estructura del proyecto
- `pantallas/`: vistas por rol (publicas, cliente, equipo, admin, sistema)
- `js/`: lógica y componentes reutilizables
- `docs/`: historias de usuario, mapa de pantallas, modelo de datos
- `supabase/migrations/`: esquema de base de datos versionado

## Roles
- Cliente: crea y revisa sus propios tickets.
- Técnico: gestiona tickets asignados o sin asignar.
- Administrador: todo lo del técnico + usuarios y auditoría.

## Ejecutar con Docker

**Requisito:** Docker Desktop instalado y abierto (debe decir "Engine running").

La imagen usa `nginx:alpine` y sirve los archivos estáticos del proyecto. La configuración de nginx (`nginx.conf`) define las cabeceras de seguridad y la página 404 propia. Los archivos que no forman parte del sitio quedan fuera de la imagen mediante `.dockerignore`.

1. Construir la imagen desde la carpeta del proyecto:

   ```bash
   docker build --no-cache -t ntek-servicedesk .
   ```

2. Ejecutar el contenedor:

   ```bash
   docker run --rm -p 8080:80 --name ntek-local ntek-servicedesk
   ```

3. Abrir `http://localhost:8080`.

4. Para detenerlo, presionar `Ctrl + C` en la terminal.

**Configuración:** la app no usa variables de entorno. La URL de Supabase y la llave `anon` (pública) están en `js/supabase-client.js`; la seguridad de los datos depende de las políticas RLS, no de ocultar esa llave. La llave `service_role` nunca se usa en el front-end ni se guarda en el repositorio.

**Despliegue en Render:** el servicio está conectado a la rama `main` y usa este mismo Dockerfile. Cada push a `main` vuelve a desplegar. Si el despliegue automático falla, usar Manual Deploy → Deploy latest commit.

## Estado del proyecto
- [x] Etapa 1: Descubrimiento y diseño
- [x] Etapa 2: Base front-end
- [x] Etapa 3: Supabase y autenticación
- [x] Etapa 4: Tickets — creación, listado con paginación de 10, detalle, filtros, gestión y "Tomar caso"
- [x] Etapa 5: Interacción — listos: comentarios y notas internas, adjuntos con límites por tipo, auditoría (RF-12), historial en ambos detalles y "Aceptar cierre" (F-03). subticket vinculado (CA-08) y cierre automático a los 7 días. Pendiente: confirmación de las reglas del subticket por NTEK
- [x] Etapa 6: Panel y calidad — listos: indicadores (RF-10), estados de carga/vacío/error, validación en formularios y en la base, rediseño con identidad NTEK. En curso: Lighthouse y revisión responsive (360 / 768 / 1280 px)
- [ ] Etapa 7: DevOps — listos: Docker, Render y cabeceras de seguridad en nginx (nota A en securityheaders.com). Pendiente: Cloudflare (dominio, HSTS, caché) y documentar el despliegue
- [ ] Etapa 8: Cierre — manual de usuario, memoria técnica y respaldo SQL

## Validación cruzada
Guía para probar el sistema como usuario: [docs/guia-validacion.md](docs/guia-validacion.md).
Las credenciales de prueba se entregan por mensaje privado; nunca se suben al repositorio.

## Límites de adjuntos

Cada ticket acepta como máximo:

| Tipo | Formatos | Máx. archivos | Máx. peso por archivo |
|---|---|---|---|
| Imagen | JPG, PNG | 3 | 5 MB |
| PDF | PDF | 1 | 5 MB |
| Markdown | .md | 5 | 1 MB |

⚠️ Los límites están escritos en **dos lugares** y deben cambiarse en ambos:

- `js/reglas-adjuntos.js` → validación en el navegador (mensajes claros al usuario).
- Trigger `attachments_limitar_por_tipo` en Supabase (migración `limite_adjuntos_por_tipo`) → validación en la base (no se puede saltar desde la consola).

Si se cambia un número, crear una migración nueva con la función actualizada.

## Archivo semanal de auditoría

Cada lunes a las 06:00 UTC, `pg_cron` (tarea `archivar_auditoria_semanal`) llama con `pg_net` a la Edge Function `archivar-auditoria`. La función:

1. Lee los eventos de `audit_events` de la semana anterior (lunes a domingo, UTC).
2. Genera un `.txt` con una línea por evento y lo sube al bucket privado `auditoria` (solo el administrador puede leerlo).
3. Llama a `borrar_auditoria_antigua()`, que elimina los eventos de tickets cerrados sin cambios hace más de 2 meses.

Configuración necesaria (no está en el repositorio):

- Secreto de la función: `npx supabase secrets set AUDITORIA_CLAVE=<valor>`
- Secretos en Vault (SQL Editor): `auditoria_url` (URL de la función) y `auditoria_clave` (mismo valor que `AUDITORIA_CLAVE`)
- Despliegue: `npx supabase functions deploy archivar-auditoria --no-verify-jwt`

Para archivar una semana a mano, enviar `{"desde": "AAAA-MM-DD"}` (un lunes) con la cabecera `x-clave-auditoria`.

## Instalación y despliegue
Pendiente (etapa 7).

Proyecto desarrollado durante la práctica profesional.

Despliegue:    https://ntek-servicedesk.onrender.com
