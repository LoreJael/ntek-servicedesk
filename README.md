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
- [x] Etapa 5: Interacción — listos: comentarios y notas internas, adjuntos con límites por tipo, auditoría (RF-12), historial en ambos detalles y "Aceptar cierre" (F-03). subticket vinculado (CA-08) y cierre automático a los 7 días. 
- [x] Etapa 6: Panel y calidad — indicadores (RF-10), estados de carga/vacío/error, validación en formularios y en la base, rediseño con identidad NTEK, Lighthouse (Performance ≥ 80 y Accessibility ≥ 90), revisión responsive (360 / 768 / 1280 px), prueba en Firefox e índices en la base, PWA instalable (manifest y service worker)
- [ ] Etapa 7: DevOps — listos: Docker, Render, cabeceras de seguridad en nginx (nota A en securityheaders.com) y procedimiento de despliegue documentado. Pendiente: Cloudflare (subdominio de NTEK, HSTS y caché)
- [ ] Etapa 8: Cierre — listos: manual de usuario, memoria técnica (borrador), respaldo SQL y restauración probada. Pendiente: revisión final de la memoria, demostración final y traspaso

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

Pasos para levantar el sistema desde cero en un proyecto de Supabase y un servicio de Render nuevos.

### Requisitos

- Git y Node.js (para usar la CLI de Supabase con `npx`).
- Docker Desktop (para probar la imagen en local).
- Cuenta de Supabase y cuenta de Render conectada a GitHub.

### 1. Clonar el repositorio

```bash
git clone https://github.com/LoreJael/ntek-servicedesk.git
cd ntek-servicedesk
npm install
```

`npm install` instala la CLI de Supabase (v2.117.0), definida en `package.json`.

### 2. Crear la base de datos en Supabase

1. Crear un proyecto nuevo en Supabase y copiar su **Reference ID** (Project Settings → General).
2. Vincular el proyecto y aplicar las migraciones:

   ```bash
   npx supabase login
   npx supabase link --project-ref <reference-id>
   npx supabase db push
   ```

   Las migraciones de `supabase/migrations/` crean las tablas, restricciones, políticas RLS, triggers, funciones, los buckets `adjuntos` y `auditoria`, y las tareas de `pg_cron` (cierre automático y archivo semanal).

3. En **Authentication → URL Configuration**:
   - Site URL: la URL de Render (paso 5).
   - Redirect URLs: la URL de Render y la URL local que se use para desarrollo.

4. Configurar la Edge Function de auditoría y sus secretos: ver la sección [Archivo semanal de auditoría](#archivo-semanal-de-auditoría).

5. Crear el primer administrador: registrarse desde la app (queda con rol `cliente`) y luego, en el SQL Editor:

   ```sql
   update profiles
   set role = 'admin'
   where id = '<id-del-usuario>';
   ```

   El `id` se ve en Authentication → Users. Los demás roles se asignan después desde la pantalla Usuarios.

### 3. Conectar el front-end con el proyecto

Si se usa un proyecto de Supabase distinto al actual, cambiar la URL en dos archivos:

| Archivo | Qué cambiar |
|---|---|
| `js/supabase-client.js` | `SUPABASE_URL` y `SUPABASE_ANON_KEY` (Project Settings → API). La llave `anon` es pública; nunca usar la `service_role`. |
| `nginx.conf` | La URL de Supabase dentro de `connect-src` en `Content-Security-Policy`. Si no se cambia, el navegador bloquea las consultas. |

### 4. Probar en local

Ver [Ejecutar con Docker](#ejecutar-con-docker).

### 5. Desplegar en Render

1. New → Web Service → conectar el repositorio de GitHub.
2. Elegir **Docker** como entorno (en Settings aparece como Dockerfile Path: `./Dockerfile`). Branch: `main`.
3. Plan: Free. No se necesitan variables de entorno.
4. Crear el servicio y esperar el estado **Live**.
5. Settings → Health Checks → Health Check Path: `/health`. Esa ruta la responde nginx con `200 ok` (bloque `location = /health` en `nginx.conf`); Render la consulta cada pocos segundos y antes de cada despliegue.

Cada push a `main` vuelve a desplegar. Si el despliegue automático falla, usar Manual Deploy → Deploy latest commit. En el plan Free el servicio se suspende sin uso y la primera carga tarda unos segundos.

### 6. Cloudflare

Pendiente: el subdominio lo entrega NTEK. Pasos para cuando llegue:

| N.º | Dónde | Paso | Cómo se comprueba | Estado |
|---|---|---|---|---|
| 1 | Render → Settings → Custom Domains | Agregar el subdominio de NTEK | Render muestra el registro DNS que hay que crear | ⬜ |
| 2 | Cloudflare → DNS | Crear un CNAME del subdominio hacia `ntek-servicedesk.onrender.com`, primero en "Solo DNS" (nube gris) | Render marca el dominio como verificado y emite el certificado | ⬜ |
| 3 | Cloudflare → DNS | Activar el proxy (nube naranja) | El sitio carga por el subdominio | ⬜ |
| 4 | Cloudflare → SSL/TLS | Modo "Full (strict)" | Candado válido y sin bucle de redirecciones | ⬜ |
| 5 | Cloudflare → SSL/TLS → Edge Certificates | Activar "Always Use HTTPS" y HSTS (6 meses, sin `includeSubDomains` ni `preload`, porque el dominio es de NTEK) | securityheaders.com muestra `Strict-Transport-Security` | ⬜ |
| 6 | Supabase → Authentication → URL Configuration | Agregar el subdominio en Site URL y Redirect URLs (mantener la URL de Render) | Registro y recuperación de contraseña funcionan desde el subdominio | ⬜ |
| 7 | Cloudflare → Caching | Caché estándar para CSS/JS; purgar la caché después de cada despliegue | `cf-cache-status: HIT` en DevTools → Network | ⬜ |
| 8 | `docs/pruebas.md` | Repetir CA-12 y la fila 5 de seguridad en el subdominio | Ambos en ✅ | ⬜ |

### Respaldo y datos de demostración

El respaldo de esquema y datos, y cómo restaurarlo, están en [docs/respaldo-restauracion.md](docs/respaldo-restauracion.md).

Proyecto desarrollado durante la práctica profesional.

Despliegue:    https://ntek-servicedesk.onrender.com


## Uso y licencia
Uso interno de NTEK. Código desarrollado durante la práctica profesional de Loreto Pradel (Instituto Profesional Virginio Gómez) para NTEK. El repositorio es público para fines de revisión y evaluación; no se otorga licencia para reutilizar el código fuera de NTEK sin su autorización.
