# Memoria técnica — NTEK ServiceDesk Lite

## 1. Arquitectura

El sistema es una aplicación web estática que se comunica directamente con Supabase. No hay un servidor propio con lógica de negocio: las reglas de acceso y de datos viven en la base (políticas RLS, restricciones, triggers y funciones).

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Front-end | HTML, CSS y JavaScript con módulos ES, sin framework | Pantallas por rol, validaciones de formulario, navegación y renderizado |
| Autenticación | Supabase Auth | Registro, inicio de sesión, recuperación de contraseña y sesión (JWT) |
| Datos | PostgreSQL de Supabase | Tablas, restricciones, triggers, funciones y políticas RLS |
| Archivos | Supabase Storage | Bucket privado `adjuntos` (archivos de tickets) y bucket privado `auditoria` (archivos semanales) |
| Procesos programados | `pg_cron`, `pg_net` y Edge Function `archivar-auditoria` | Cierre automático de tickets resueltos y archivo semanal de auditoría |
| Servidor web | Docker con `nginx:alpine` | Sirve los archivos estáticos, aplica cabeceras de seguridad y la página 404 propia |
| Hosting | Render (plan Free) | Despliegue automático en cada push a `main` |

### Organización del código

- `pantallas/`: una carpeta por rol (`publicas`, `cliente`, `equipo`, `admin`, `sistema`).
- `js/`: un archivo por pantalla y módulos reutilizables:
  - `sesion.js`: `protegerRuta()` verifica la sesión, el rol y si la cuenta está activa antes de mostrar una pantalla privada.
  - `barra-lateral.js`, `header-cliente.js`, `header-equipo.js`: navegación según el rol.
  - `estados.js`: estados de vacío y de error recuperable.
  - `seguridad.js`: `escaparHTML()` para mostrar datos de usuario como texto.
  - `paginacion.js`, `reglas-adjuntos.js`, `notificaciones.js`, `eventos-auditoria.js`.
- `supabase/migrations/`: esquema versionado (31 migraciones).
- `docs/`: modelo de datos, pruebas, manual de usuario, respaldo y restauración.

### Recorrido de una consulta

1. El usuario inicia sesión y Supabase Auth entrega un token de sesión (JWT).
2. El JavaScript consulta una tabla con `supabase-js`, usando la llave `anon` (pública) y el token.
3. PostgreSQL identifica al usuario con `auth.uid()` y aplica las políticas RLS de esa tabla.
4. La base devuelve solo las filas permitidas. El JavaScript no filtra por usuario: ese filtro lo hace la RLS.

## 2. Modelo de datos

| Tabla | Propósito |
|---|---|
| `profiles` | Datos de cada usuario (nombre, teléfono, empresa, rol y si está activo). Se crea sola al registrarse, con el trigger `on_auth_user_created`. |
| `tickets` | Solicitudes de soporte: autor, técnico asignado, título, descripción, categoría, prioridad, estado y fechas. |
| `comments` | Respuestas públicas y notas internas (`is_internal`). |
| `attachments` | Ficha de cada archivo subido (ruta en Storage, tipo MIME y tamaño). |
| `audit_events` | Registro de cambios relevantes: actor, acción, entidad, antes → después (`metadata`) y fecha. |

### Restricciones en la base

- Estados permitidos: `nuevo`, `en_revision`, `en_progreso`, `en_espera`, `resuelto`, `cerrado`.
- Prioridades permitidas: `baja`, `media`, `alta`, `critica`.
- Categorías permitidas: `Software`, `Hardware`, `Red`, `Cuenta`.
- Largos: título de 5 a 120 caracteres, descripción de 10 a 2000 y comentario de 10 a 2000.
- Fechas en UTC (`timestamptz`). La hora de Chile se aplica solo al mostrarlas.

### Triggers y funciones principales

| Nombre | Qué hace |
|---|---|
| `on_auth_user_created` → `handle_new_user()` | Crea el perfil con rol `cliente` al registrarse |
| `profiles_proteger_ultimo_admin` | Impide quitar el rol o desactivar al último administrador |
| `tickets_actualizar_updated_at` | Actualiza `updated_at` en cada cambio del ticket |
| `tickets_auditoria` → `registrar_auditoria_ticket()` | Registra crear, asignar, cambiar estado o prioridad, cerrar y reabrir |
| `tickets_resuelto_at` | Guarda la fecha en que el ticket pasó a Resuelto |
| `attachments_limitar_por_tipo` | Limita por ticket: 3 imágenes, 1 PDF y 5 Markdown |
| `aceptar_cierre()` | El cliente cierra su ticket Resuelto |
| `abrir_subticket()` | El cliente protesta un ticket Resuelto: cierra el original y crea un subticket vinculado |
| `nombres_equipo()` | Entrega al cliente solo los nombres del equipo, sin otros datos del perfil |
| `cerrar_resueltos_vencidos()` | Cierra los tickets resueltos hace más de 7 días sin respuesta del cliente |
| `borrar_auditoria_antigua()` | Elimina eventos de tickets cerrados sin cambios hace más de 2 meses |

### Cambios respecto al modelo orientativo de los requisitos

| Cambio | Justificación |
|---|---|
| `tickets.ticket_origen_id` (único, referencia a `tickets`) | Vincula el subticket con su ticket original (CA-08). Al ser único, cada ticket tiene como máximo un subticket. |
| `tickets.resuelto_at` | Permite calcular el plazo de 7 días para protestar o para el cierre automático. |
| `tickets.contexto_origen` (jsonb) | Copia del historial y de los comentarios públicos del original, para que el subticket conserve el contexto aunque se archive la auditoría. |
| `audit_events.entity` en vez de `entity_type` | Mismo propósito, nombre más corto. `entity_id` no es una FK real, porque depende de la entidad. |
| Sin borrado de usuarios ni de tickets | Se desactiva en vez de eliminar (CA-09), para conservar el historial. |

## 3. Seguridad

Principio general: el front-end mejora la experiencia (mensajes claros, botones bloqueados, pantallas por rol), pero **ninguna regla de acceso depende solo del navegador**. Cualquier persona puede abrir la consola y llamar a Supabase directamente con la llave `anon`, por lo que toda regla importante se repite o se aplica en la base.

### 3.1 Qué se controla en el front y qué en la base

| Control | Front-end | Base de datos |
|---|---|---|
| Acceso a pantallas privadas | `protegerRuta()` revisa sesión, rol y cuenta activa; redirige al login o a "Acceso denegado" | Políticas RLS: sin sesión válida no se obtienen filas |
| Qué tickets ve cada usuario | No filtra por usuario | RLS: el cliente ve solo los suyos; el técnico, los asignados a él o sin asignar; el admin, todos |
| Notas internas | No se muestran en el detalle de cliente | RLS de `comments`: el cliente nunca recibe filas con `is_internal = true` |
| Cambios en tickets | Botones según rol y estado | RLS de update por rol; el cliente no modifica tickets directamente, solo mediante `aceptar_cierre()` y `abrir_subticket()`, que validan dueño, estado y plazo |
| Cuenta desactivada | `protegerRuta()` cierra la sesión | Política `solo_usuarios_activos` en `tickets`, `comments` y `attachments` |
| Rol y estado del propio perfil | El formulario de perfil no muestra esos campos | `with check` de `update_own_profile`: el usuario no puede cambiar su propio `role` ni `active` |
| Último administrador | Confirmación antes de cambiar rol | Trigger `profiles_proteger_ultimo_admin` |
| Largo de campos y categoría | Validación en formularios con mensajes | Restricciones `check` en `tickets` y `comments` |
| Adjuntos: tipo, peso y cantidad | `reglas-adjuntos.js` valida antes de subir | Configuración del bucket (MIME y peso) y trigger `attachments_limitar_por_tipo` (cantidad por tipo) |
| Solicitudes duplicadas | Botón deshabilitado mientras se procesa (cooldown) | — |
| Inyección de HTML (XSS) | `escaparHTML()` en todo dato de usuario mostrado con `innerHTML` | — |
| Cabeceras HTTP | — | nginx (ver 3.4) |

### 3.2 Políticas RLS por tabla

Todas las tablas expuestas tienen RLS activa. Las funciones `is_admin()`, `is_tecnico()` e `is_cliente()` leen el rol desde `profiles` y no desde el navegador.

| Tabla | Cliente | Técnico | Administrador |
|---|---|---|---|
| `profiles` | Lee y edita solo el suyo (sin rol ni estado) | Lee el suyo y los perfiles de clientes | Lee y edita todos |
| `tickets` | Lee los suyos; crea a su nombre | Lee y actualiza los asignados a él o sin asignar; toma solo para sí mismo; no modifica tickets cerrados | Lee y actualiza todos |
| `comments` | Lee los públicos de sus tickets; comenta si el ticket no está cerrado | Lee y escribe en los tickets que ve, incluidas notas internas | Igual que técnico, en todos |
| `attachments` | Lee los de sus tickets; sube si el ticket no está cerrado | Lee y sube en los tickets que ve | Igual que técnico, en todos |
| `audit_events` | Ve el historial de sus tickets, sin cambios de prioridad | Ve los eventos de los tickets que ve | Ve todo |

Nadie puede insertar, modificar ni borrar en `audit_events` desde la API: los eventos los escribe el trigger `tickets_auditoria`.

Lecciones del modelado:
- La RLS limita **filas**, no columnas. Por eso el `with check` de `update_own_profile` compara `role` y `active` con los valores actuales.
- Las políticas permisivas se suman: dos políticas de update duplicadas abrían más permisos de los esperados y se eliminaron.
- Si falla el `using`, la consulta devuelve 0 filas sin error; si falla el `with check`, la base responde con error.

### 3.3 Archivos (Storage)

- Bucket `adjuntos` privado, con lista permitida de MIME (JPG, PNG, PDF, Markdown) y límite de peso.
- Ruta física `id_ticket/uuid.extensión`: el nombre es aleatorio y no se guarda el nombre original.
- Las políticas de Storage solo permiten leer o subir en la carpeta de un ticket que el usuario puede ver según la RLS de `tickets`.
- La descarga usa un link firmado de 20 segundos (`createSignedUrl`).
- Un usuario solo puede borrar de Storage archivos propios que **no** tengan ficha en `attachments`; esto se usa para limpiar si la subida falla a mitad de camino.
- Bucket `auditoria` privado: solo el administrador puede leer los archivos semanales; nadie puede subir desde la API.

### 3.4 Servidor y secretos

- Cabeceras en nginx: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y `X-Frame-Options: DENY`. Resultado: nota A en securityheaders.com. HSTS queda para Cloudflare.
- La llave `anon` está en `js/supabase-client.js` porque es pública por diseño; la protección depende de la RLS.
- La llave `service_role` nunca se usa en el front-end ni está en el repositorio.
- La clave de la Edge Function de auditoría se guarda como secreto de Supabase y en Vault, fuera del repositorio.
- Las funciones internas (`cerrar_resueltos_vencidos()`, `borrar_auditoria_antigua()`) tienen el permiso de ejecución quitado para `anon` y `authenticated`: no se pueden llamar desde el navegador.

### 3.5 Pruebas de permisos

Las pruebas de aislamiento se hicieron desde la consola del navegador con sesiones de dos clientes de empresas distintas, dos técnicos y el administrador (CA-03, CA-05, CA-09 y pruebas de RLS en `docs/pruebas.md`).

## 4. Procesos automáticos

Los dos procesos corren en la base con `pg_cron`, sin intervención del usuario. Las funciones que ejecutan no se pueden llamar desde el navegador.

| Tarea (`pg_cron`) | Horario | Qué hace |
|---|---|---|
| `cerrar_resueltos_vencidos` | Todos los días a las 07:00 UTC (04:00 en Chile) | Cierra los tickets que llevan 7 días o más en Resuelto sin respuesta del cliente. El trigger de auditoría registra el evento `cerrar` con actor "Sistema". |
| `archivar_auditoria_semanal` | Lunes a las 06:00 UTC | Llama con `pg_net` a la Edge Function `archivar-auditoria`, que genera un `.txt` con los eventos de la semana anterior, lo guarda en el bucket `auditoria` y luego ejecuta `borrar_auditoria_antigua()`. |

`borrar_auditoria_antigua()` solo elimina eventos de tickets cerrados sin cambios hace más de 2 meses, para que la tabla no crezca sin límite. El historial reciente se mantiene consultable en la vista de Auditoría, y el subticket conserva su propia copia del historial del original (`contexto_origen`).

## 5. Decisiones relevantes

| Decisión | Motivo |
|---|---|
| JavaScript sin framework, con módulos ES | Lo exige el documento de requisitos; los componentes repetidos (barra lateral, estados, paginación) se resolvieron con funciones reutilizables. |
| Las consultas no filtran por usuario en el JavaScript | El filtro lo hace la RLS; así una consulta manipulada desde la consola tampoco obtiene datos ajenos. |
| Desactivar en vez de eliminar usuarios | El usuario pierde el acceso, pero su historial se conserva (CA-09). |
| Tickets y comentarios no se borran ni se editan | Mantener la trazabilidad del caso. |
| El cliente no comenta ni adjunta en tickets cerrados; el equipo sí | Un caso cerrado no se reabre por el cliente; el equipo puede dejar constancia. |
| Subticket en vez de reapertura | Indicación de NTEK: el cliente protesta un ticket Resuelto con "No estoy conforme" (motivo de 15 a 2000 caracteres) dentro de 7 días; el original pasa a Cerrado y la atención sigue en un subticket vinculado. Máximo un subticket por ticket y no se permite subticket de un subticket. |
| Cierre automático a los 7 días | Si el cliente no acepta ni protesta, el caso no queda abierto indefinidamente. |
| El cliente ve el nombre del técnico | Para seguimiento o reclamos; se entrega solo el nombre mediante `nombres_equipo()`, sin el resto del perfil. |
| El cliente no ve los cambios de prioridad en su historial | La prioridad es una decisión interna del equipo. |
| Límites de adjuntos: 3 imágenes, 1 PDF y 5 Markdown por ticket | Confirmados por NTEK para controlar el uso de Storage; `.txt` queda fuera. |
| Link de descarga firmado de 20 segundos | El archivo no queda accesible por una URL permanente. |
| Paginación de 10 en listados y máximo 5 en "Alta prioridad abiertos" | Indicación de NTEK: el panel muestra solo lo necesario. |
| Fechas en UTC en la base y hora de Chile al mostrar | Evita errores con cambios de horario. |
| Cargas en paralelo con `Promise.all` en los detalles | Lighthouse Mobile Performance del detalle de equipo subió de 77–80 a 95. |
| Repositorio público sin credenciales | Las cuentas de prueba se entregan por canal privado. |
| La vista de Auditoría muestra los últimos 7 días | Indicación de NTEK; coincide con el archivo semanal, que guarda cada semana en Storage. |

## 6. Pendientes conocidos

- **Cloudflare (etapa 7):** NTEK entregará un subdominio; con él se configuran HTTPS con HSTS y caché, y se cierra CA-12.
- **Logo oficial de NTEK:** la barra lateral usa texto mientras tanto.
- **Auditoría:** hoy muestra los últimos 50 eventos; por confirmar si se pagina y si se muestra el título del ticket junto al N.º.
- **README:** completar la sección "Instalación y despliegue".
- **Plan Free de Render:** el servicio se suspende sin uso y tarda en responder la primera vez.
- **Supabase CLI:** se mantiene la versión v2.117.0 hasta la entrega, para no cambiar el entorno con que se probó la restauración.
- **Opcional:** PWA instalable, solo si alcanza el tiempo.