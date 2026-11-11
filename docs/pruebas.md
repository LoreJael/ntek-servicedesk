# Pruebas de permisos — NTEK ServiceDesk Lite

## RF-07: políticas RLS de UPDATE en `tickets` (28-09-2026)

**Objetivo:** comprobar que cada rol solo puede modificar los tickets que le corresponden y que dos técnicos no pueden tomar el mismo caso.

**Método:** peticiones directas desde la consola del navegador (sitio en Render), iniciando sesión con cada cuenta de prueba.

**Ticket usado:** `3d0bb17b` — "lentitud en el sistema" (creado por un cliente, inicialmente sin asignar).

| # | Cuenta | Intento | Esperado | Resultado |
|---|---|---|---|---|
| 1 | Técnico 1 (Diego) | Tomar ticket sin asignar | 1 fila modificada | ✅ |
| 2 | Técnico 1 (Diego) | Asignar el ticket a otro técnico | Error 403 (RLS) | ✅ |
| 3 | Técnico 1 (Diego) | Cambiar estado a `en_progreso` | 1 fila modificada | ✅ |
| 4 | Técnico 2 (Camila) | Tomar el ticket ya asignado a Diego | 0 filas | ✅ |
| 5 | Técnico 2 (Camila) | Cambiar el estado del ticket de Diego | 0 filas | ✅ |
| 6 | Cliente (dueño del ticket) | Cambiar el estado a `cerrado` | 0 filas | ✅ |
| 7 | Administrador (Andrea) | Reasignar el ticket a Camila | 1 fila modificada | ✅ |
| 8 | Técnico 1 (Diego) | Soltar su propio caso (`assigned_to: null`) | Error 42501 (RLS) | ✅ |
| 9 | Técnico 1 (Diego) | Cambiar el estado de un ticket cerrado | 0 filas | ✅ |

**Corrección (08-10-2026):** las pruebas 8 y 9 detectaron que seguían activas las políticas antiguas `update_ticket_tecnico` y `update_ticket_admin` (22-09), que se sumaban a las nuevas y permitían al técnico soltar casos y modificar tickets cerrados. Se eliminaron y las pruebas pasan.

**Extra:** en las pruebas 1, 3 y 7, `updated_at` se actualizó automáticamente (trigger `tickets_actualizar_updated_at`).

## RF-11 — Gestión de usuarios (02-10-2026)

| # | Prueba | Cuenta | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|---|
| 1 | Desactivar con confirmación (cancelar) | Andrea (admin) | "Desactivar" en Loreto → Cancelar | No cambia nada | ✅ |
| 2 | Desactivar con confirmación (aceptar) | Andrea (admin) | "Desactivar" en Loreto → Aceptar | Notificación de éxito; tarjeta muestra "Inactivo" y botón "Activar" | ✅ |
| 3 | Activar sin confirmación | Andrea (admin) | "Activar" en Loreto | Vuelve a "Activo" sin preguntar | ✅ |
| 4 | Usuario desactivado inicia sesión | Loreto (cliente, inactiva) | Login normal | Se cierra la sesión y vuelve al login con aviso "cuenta desactivada" | ✅ |
| 5 | Usuario desactivado consulta datos por consola | Loreto (cliente, inactiva) | `signInWithPassword` + `from('tickets').select('*')` desde la consola | `data: []` (la política restrictiva bloquea) | ✅ |
| 6 | Usuario reactivado vuelve a ver sus datos | Loreto (cliente, activa) | Mismo `select` de la prueba 5 | Aparecen sus tickets | ✅ |
| 7 | Técnico activo no se ve afectado | Diego (técnico) | Abrir bandeja global | La bandeja muestra tickets normal | ✅ |
| 8 | Último admin protegido | SQL Editor | `update` de Andrea a rol cliente | Error del trigger `proteger_ultimo_admin` | ✅ (01-10) |
| 9 | Tarjeta propia bloqueada | Andrea (admin) | Revisar su propia tarjeta | Select y botones desactivados ("Tu Cuenta") | ✅ |


## RF-08 — Comentarios y notas internas (CA-05)

**Fecha:** 06-10-2026
**Cuentas:** Diego Muñoz (técnico), Loreto (cliente)
**Ticket:** 4daf62d9

| # | Prueba | Cómo se hizo | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | El técnico escribe una respuesta pública | Pantalla de detalle de equipo, sin marcar la casilla | Se guarda y se ve con el formato normal | ✅ |
| 2 | El técnico escribe una nota interna | Pantalla de detalle de equipo, con la casilla "Nota interna" | Se guarda y se ve con fondo amarillo y la etiqueta "Nota interna" | ✅ |
| 3 | El equipo ve el nombre del autor | Pantalla de detalle de equipo | Propios como "Tú", clientes con su nombre | ✅ |
| 4 | El cliente no ve las notas internas en pantalla | Pantalla de detalle de cliente | Solo aparecen las respuestas públicas | ✅ |
| 5 | El cliente pide todos los comentarios desde la consola | `select` a `comments` del ticket | Ninguna fila con `is_internal: true` | ✅ |
| 6 | El cliente pide solo las notas internas desde la consola | `select` con `.eq('is_internal', true)` | `[]` (lista vacía, sin error) | ✅ |
| 7 | El cliente intenta crear una nota interna desde la consola | `insert` con `is_internal: true` | Error 42501 de RLS | ✅ |

**Conclusión:** CA-05 cumplido. Las notas internas se protegen en la pantalla y en la base de datos (RLS).

## RF-SEG-03 — Aislamiento entre clientes (CA-03)

**Fecha:** 06-10-2026
**Cuentas:** Loreto (cliente). Ticket objetivo: uno de Pedro González (otro cliente)

| # | Prueba | Cómo se hizo | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1 | El cliente intenta abrir un ticket de otro cliente conociendo su id | Consola: `select` a `tickets` con `.eq('id', uuid de Pedro)` | `[]` sin error | ✅ |
| 2 | El cliente intenta listar todos los tickets (enumerar) | Consola: `select('*')` a `tickets` sin `.eq` | Solo llegan los tickets de Loreto | ✅ |

**Conclusión:** CA-03 cumplido. Aunque el cliente tenga el id de un ticket ajeno o pida la tabla completa, la RLS solo le entrega sus propios tickets.

## RF-09 — Archivos adjuntos (CA-06)

**Fecha:** 08-10-2026
**Cuentas:** Loreto (cliente), Diego Muñoz (técnico), Andrea Soto (admin)

| # | Prueba | Cuenta | Cómo se hizo | Resultado esperado | Resultado |
|---|---|---|---|---|---|
| 1 | Subir una imagen válida | Loreto (cliente) | Detalle de un ticket abierto → elegir PNG → "Subir archivo" | Notificación de éxito; el archivo aparece en la lista, en el bucket (carpeta con el id del ticket, nombre aleatorio) y en `attachments` | ✅ |
| 2 | Subir sin elegir archivo | Loreto (cliente) | "Subir archivo" sin seleccionar nada | Mensaje "Elige un archivo antes de subirlo." | ✅ |
| 3 | Subir un archivo de más de 5 MB | Loreto (cliente) | Imagen PNG de 6,7 MB | Mensaje "El archivo supera el máximo de 5 MB."; no se sube nada | ✅ |
| 4 | Subir un tipo no permitido | Loreto (cliente) | En el explorador, "Todos los archivos" → elegir un `.txt` | Mensaje "Solo se permiten archivos JPG, PNG o PDF."; no se sube nada | ✅ |
| 5 | Ticket cerrado (cliente) | Loreto (cliente) | Abrir el detalle de un ticket cerrado | Se ve la lista de archivos, pero no el formulario | ✅ |
| 6 | Descargar un archivo | Loreto (cliente) | Botón "Descargar" | El archivo se descarga sin salir de la página | ✅ |
| 7 | Link firmado vencido | Loreto (cliente) | Copiar el link de descarga (`Ctrl + J`), esperar más de 20 s y abrirlo en otro navegador | Error de Supabase por token vencido | ✅ |
| 8 | El equipo ve los archivos del cliente | Diego (técnico) | Detalle de equipo del mismo ticket | Aparecen con el nombre del cliente como autor | ✅ |
| 9 | El equipo sube un archivo | Diego (técnico) | Detalle de equipo → subir imagen | Aparece como "Tú"; el cliente lo ve como "Equipo NTEK" | ✅ |
| 10 | El equipo adjunta en ticket cerrado | Diego / Andrea | Detalle de equipo de un ticket cerrado | El formulario aparece y la subida funciona | ✅ |

**Conclusión:** CA-06 cumplido. El tipo y el tamaño se validan en la pantalla (mensaje comprensible) y en el bucket (límite de 5 MB y lista de tipos permitidos). Los archivos se guardan en un bucket privado con nombre no predecible, y se descargan con un link firmado que vence a los 20 segundos.

## RF-09 — Límites de adjuntos por tipo (13-10 y 14-10)

Reglas: imagen JPG/PNG máx. 3 (5 MB), PDF máx. 1 (5 MB), Markdown `.md` máx. 5 (1 MB) por ticket.

### Interfaz (validación en el navegador)

| # | Vista | Caso | Resultado esperado | Estado |
|---|---|---|---|---|
| 11 | Cliente | Subir `.md` | Se sube y aparece como "Markdown" | ✅ |
| 12 | Cliente | Subir `.txt` | Rechazado: tipo no permitido | ✅ |
| 13 | Cliente | Subir 2.º PDF en el mismo ticket | Rechazado: máximo de archivos de este tipo | ✅ |
| 14 | Equipo | Subir `.md` | Se sube y aparece como "Markdown" | ✅ |
| 15 | Equipo | Subir `.txt` | Rechazado: tipo no permitido | ✅|
| 16 | Equipo | Subir 2.º PDF en el mismo ticket | Rechazado: máximo de archivos de este tipo | ✅ |

### Base de datos (trigger `attachments_limitar_por_tipo`)

| # | Quién | Caso | Resultado esperado | Estado |
|---|---|---|---|---|
| 17 | Cliente (Loreto) | `insert` directo por consola de un 2.º PDF | `data: null`, error "Se alcanzó el máximo de archivos de este tipo para el ticket" | ✅ |
| 18 | Cliente (Loreto) | `insert` directo por consola con `mime_type: 'text/plain'` | `data: null`, error "Tipo de archivo no permitido" | ✅ |
| 19 | Cliente (Loreto) | Dos pestañas del mismo ticket sin PDF; subir un PDF en cada una sin recargar | 1.ª se sube; 2.ª rechazada por la base ("No se pudo registrar el archivo") y el archivo se elimina de Storage | ✅ |

Hallazgo: la primera prueba 17 permitió el insert porque la migración se había creado (`migration new`) pero no aplicado (`db push`). Se detectó con `npx supabase migration list` (columna Remote vacía).

### Limpieza de datos de prueba

- Un adjunto vive en dos lugares: el archivo en Storage (`adjuntos/<ticket_id>/...`) y la ficha en `attachments`. Si se borra uno solo, queda un huérfano.
- Para revisar: comparar `select id, path from attachments where ticket_id = '...'` con los archivos de la carpeta del ticket en Storage.
- Siempre usar `delete ... where id = '...'` (nunca `delete` sin `where`).
- 14-10: se borraron la ficha falsa `prueba/falso.pdf` y 3 fichas sin archivo en el ticket `93f0916e`.

### RF-09 — Borrado de archivos en Storage (16-10-2026)

Defecto detectado el 14-10: la política `delete_adjuntos_propios` permitía que un usuario borrara desde la consola un archivo propio en Storage, dejando su ficha en `attachments` huérfana. Corrección: la política ahora solo permite borrar archivos propios **sin ficha** (función `adjunto_tiene_ficha()`, `security definer`).

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Desde la consola, intentar borrar de Storage un adjunto propio que tiene ficha | Cliente (Loreto) | 0 archivos borrados, sin error; el adjunto sigue descargable desde la app | `data: []`, `error: null`; descarga correcta | ✅ |
| 2 | Desde la consola, subir a Storage un archivo sin crear ficha y luego borrarlo (simula la limpieza cuando falla el insert) | Cliente (Loreto) | 1 archivo borrado | `data: [1 elemento]`, `error: null`; el archivo ya no está en el panel | ✅ |


## RF-12 — Auditoría (trigger `tickets_auditoria`)

| # | Escenario | Rol | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Crear ticket desde Nueva solicitud | Cliente | 1 evento `crear`, actor = cliente | ✅ 15-10 — 1 evento `crear`, actor = Loreto Jael Pradel, metadata `{"estado":"nuevo","prioridad":"media"}` |
| 2 | "Tomar caso" en un ticket sin asignar | Técnico | 1 evento `asignar`, sin asignar → técnico | ✅ 15-10 — 1 evento `asignar`, actor = Diego Muñoz, metadata `{"antes":null,"despues":"<id Diego>"}` |
| 3 | Cambiar prioridad y estado en un solo guardar | Técnico | 2 eventos: `cambiar_prioridad` y `cambiar_estado` | ✅ 15-10 — 2 eventos con el mismo `created_at`: `cambiar_prioridad` (media → alta) y `cambiar_estado` (nuevo → en_revision), actor = Diego Muñoz |
| 4 | Guardar sin cambiar nada | Técnico | 0 eventos nuevos | ✅ 15-10 — Guardar sin cambios: `updated_at` cambió (el update llegó), 0 eventos nuevos en `audit_events` |
| 5 | Marcar Resuelto y luego Cerrado | Técnico | `cambiar_estado` y luego `cerrar` | ✅ 15-10 — 2 eventos con horas distintas: `cambiar_estado` (en_revision → resuelto) y `cerrar` (resuelto → cerrado), actor = Diego Muñoz |
| 6 | Reabrir un ticket cerrado | Admin | 1 evento `reabrir` | ✅ 15-10 — Diego (técnico asignado) hace `update` de prioridad en ticket cerrado desde la consola → `[] null`; ticket sin cambios; 0 eventos nuevos |
| 7 | Reasignar de un técnico a otro | Admin | 1 evento `asignar`, técnico A → técnico B | ✅ 15-10 — Admin reasigna en ticket cerrado: 1 evento `asignar`, actor = Andrea Soto, Diego Muñoz → Camila Rojas |
| 8 | `update` desde el SQL Editor | — | 1 evento con actor `null`, se ve como "Sistema" | ✅ 15-10 — `update` desde el SQL Editor: `cambiar_prioridad` (alta → media) con `actor_id` NULL; auditoria.html lo muestra como "Sistema" |
| 9 | Leer `audit_events` desde la consola | Técnico y Cliente | `[]` sin error (la RLS oculta las filas) | ✅ 15-10 — Diego hace `select` en `audit_events` desde la consola → `[] null` (sin política de lectura para técnico) |
| 10 | Insertar en `audit_events` desde la consola | Técnico | Error de RLS, no se inserta nada | ✅ 15-10 — `select` en `audit_events` desde la consola: Diego (técnico) y Loreto Jael Pradel (cliente) → `[] null` (solo el admin tiene política de lectura) |
| 11 | Abrir `admin/auditoria.html` | Admin / Técnico | Admin ve la lista; técnico recibe acceso denegado | ✅ 15-10 — Admin ve la lista (prueba 8). Diego abre admin/auditoria.html → redirige al login (no ve datos). Observación: debería ir a una pantalla "Acceso denegado" (inventario de pantallas, "Sistema"), no al login. |

### Defecto 15-10 — Rol no permitido redirige al login (corregido 16-10)

`protegerRuta` trataba igual "no se pudo leer el perfil" y "rol no permitido". Se separaron: el primero va al login y el segundo a Acceso denegado.

| N.º | Prueba | Cuenta | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Abrir `admin/usuarios.html` | Técnico (Diego) | Pantalla Acceso denegado | ✅ |
| 2 | Abrir `admin/auditoria.html` | Técnico (Diego) | Pantalla Acceso denegado | ✅ |
| 3 | Abrir `equipo/bandeja-global.html` | Cliente (Pedro) | Pantalla Acceso denegado | ✅ |
| 4 | Abrir `admin/usuarios.html` | Admin (Andrea) | Entra normalmente | ✅ |
| 5 | Abrir `admin/usuarios.html` sin sesión (incógnito) | — | Login | ✅ |

### F-03 — Aceptar cierre (cliente) — función `aceptar_cierre` (16-10-2026)

El cliente no tiene permiso de `update` en `tickets`. Acepta el cierre mediante la función `aceptar_cierre(id_ticket)` (`security definer`), que solo cierra si el ticket es suyo, está Resuelto y su cuenta está activa. Ante cualquier fallo devuelve el mismo mensaje genérico, para no revelar si el ticket existe.

| N.º | Prueba (desde la consola) | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Aceptar cierre de un ticket Resuelto de otro cliente | Cliente (Pedro) | Error genérico, el ticket no cambia | `400`, `P0001`, mensaje genérico | ✅ |
| 2 | Aceptar cierre de un ticket propio en estado Nuevo | Cliente (Pedro) | Error genérico, el ticket no cambia | | ✅ |
| 3 | Aceptar cierre de un ticket propio en estado Resuelto | Cliente (Pedro) | Ticket pasa a Cerrado; evento `cerrar` en auditoría con Pedro como actor | `204`; auditoría muestra a Pedro | ✅ |


#### Interfaz — botón "Aceptar cierre" en el detalle de cliente (19-10-2026)

La tarjeta "¿Se solucionó tu problema?" solo se muestra si el ticket está Resuelto. El botón pide confirmación, se deshabilita mientras espera la respuesta ("Cerrando ticket...") y recarga la página al terminar.

| N.º | Prueba (desde la pantalla) | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 4 | Abrir el detalle de un ticket propio en estado Resuelto | Loreto Jael Pradel | Aparece la tarjeta con el botón "Aceptar cierre" | Como se esperaba | ✅ |
| 5 | Abrir el detalle de un ticket propio en estado Nuevo / En progreso | Loreto Jael Pradel | La tarjeta no aparece | Como se esperaba | ✅ |
| 6 | Apretar "Aceptar cierre" y cancelar la confirmación | Loreto Jael Pradel | No pasa nada; el botón sigue activo | Como se esperaba | ✅ |
| 7 | Apretar "Aceptar cierre" y confirmar | Loreto Jael Pradel | Notificación de éxito; al recargar, el ticket aparece Cerrado, sin formularios de comentario ni adjuntos y con el aviso de ticket cerrado | Como se esperaba | ✅ |
| 8 | Revisar la página de auditoría después de la prueba 7 | Admin (Andrea) | Evento `cerrar` con el cliente como actor (no "Sistema") | Como se esperaba | ✅ |


## RF-10 — Panel de indicadores (19-10-2026)

Página `equipo/indicadores.html`. Una sola consulta a `tickets`; la RLS decide qué tickets llegan (admin: todos; técnico: asignados a él y sin asignar). Los totales se calculan en el navegador y cada tarjeta enlaza a la bandeja con el filtro aplicado (`?estado=` o `?prioridad=`).

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Abrir Indicadores desde el header | Admin (Andrea) | Página carga sin 404; link marcado como página actual | Como se esperaba | ✅ |
| 2 | Sumar las tarjetas por estado y por prioridad | Admin (Andrea) | Ambos grupos suman el total de tickets (23) | 23 y 23 | ✅ |
| 3 | Sumar las tarjetas por estado y por prioridad | Técnico (Diego) | Ambos grupos suman solo sus tickets + los sin asignar (15) | 15 y 15; coincide con el conteo en el SQL Editor | ✅ |
| 4 | "Alta prioridad abiertos" | Admin (Andrea) | Máximo 5; solo Alta o Crítica; ninguno Resuelto ni Cerrado | Como se esperaba | ✅ |
| 5 | "Casos recientes" | Admin (Andrea) | Los 5 tickets más nuevos | Como se esperaba | ✅ |
| 6 | Clic en una tarjeta de lista | Admin (Andrea) | Abre el detalle de equipo de ese ticket | Como se esperaba | ✅ |
| 7 | Clic en una tarjeta de estado | Admin / Técnico | Bandeja abre con el filtro de estado aplicado y la misma cantidad | Como se esperaba | ✅ |
| 8 | Clic en una tarjeta de prioridad | Admin / Técnico | Bandeja abre con el filtro de prioridad aplicado y la misma cantidad | Como se esperaba | ✅ |
| 9 | "Limpiar filtros" en la bandeja después del clic | Admin | Vuelven a aparecer todos los tickets | Como se esperaba | ✅ |
| 10 | Entrar a la bandeja desde el header (sin parámetros) | Admin | Sin filtros, igual que antes | Como se esperaba | ✅ |
| 11 | Error forzado (`.from('ticketz')`, revertido) | Admin | Un solo mensaje con "Reintentar"; detalle solo en la consola | Como se esperaba | ✅ |
| 12 | Vacío forzado (`.eq('status', 'inexistente')`, revertido) | Admin | Mensaje "Aún no hay tickets para mostrar." | Como se esperaba | ✅ |
| 13 | Vista en 360 px | Admin | Tarjetas se acomodan sin desplazamiento horizontal | Como se esperaba | ✅ |

## RF-12 — Lectura de auditoría por rol (política del técnico, 20-10)

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Diego (técnico) | Consola: `select('entity_id, action')` en `audit_events` | Solo eventos de tickets asignados a él o sin asignar | ✅ |
| 2 | Diego (técnico) | Comparar los `entity_id` con `select('id, assigned_to')` en `tickets` | Todos los `entity_id` están entre sus tickets visibles; no aparecen tickets de Camila | ✅ |
| 3 | Loreto (cliente) | Consola: `select('entity_id, action')` en `audit_events` | `data = []`, `error = null` (la RLS no entrega filas, sin error) | ✅ |
| 4 | Andrea (admin) | Abrir Auditoría después de mover el dibujo de eventos a un módulo reutilizable | Se ve igual que antes: íconos, píldoras antes → después, nombres, fechas y links | ✅ |

## RF-05 / CA-07 — Historial en el detalle de equipo (20-10)

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Andrea (admin) | Abrir el detalle de un ticket con cambios | Historial en orden cronológico con actor, píldoras antes → después y fecha | ✅ |
| 2 | Andrea (admin) | Cambiar estado y prioridad en un solo "Guardar cambios" | Aparecen 2 eventos nuevos al final, sin recargar la página | ✅ |
| 3 | Diego (técnico) | Abrir uno de sus tickets con cambios hechos por Andrea | Los cambios de Andrea dicen "Equipo NTEK"; los suyos, "Diego Muñoz" | ✅ |
| 4 | Diego (técnico) | Cambiar el estado de su ticket | El evento nuevo aparece con su nombre y la hora actual | ✅ |
| 5 | Andrea (admin) | Abrir un ticket creado antes del 14-10 (sin trigger) | "Este ticket aún no tiene cambios registrados." (esperado: no hay eventos antiguos) | ✅ |
| 6 | Andrea (admin) | Detalle en 360 px | Historial al final, en una columna, sin desplazamiento horizontal | ✅ |

## RNF-05 — Cabeceras de seguridad en nginx (21-10)

| N.º | Dónde | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | localhost:8080 | Network → documento → Response Headers | Aparecen `content-security-policy`, `x-content-type-options: nosniff` y `referrer-policy: strict-origin-when-cross-origin` | ✅ |
| 2 | localhost:8080 | Recorrer login, Mis tickets, detalle, adjuntos, bandeja y Tomar caso | Todo funciona; la CSP no bloquea nada de la app | ✅ |
| 3 | localhost:8080 | Consola: insertar `<img src=x onerror="alert(1)">` con `insertAdjacentHTML` | La imagen se crea (404), pero la CSP bloquea el `onerror`: no hay alert | ✅ |
| 4 | localhost:8080 | Abrir la consola con DevTools después de agregar jsDelivr a `connect-src` | Ya no aparecen los errores de los archivos `.map` | ✅ |
| 5 | localhost:8080 | Agregar `Permissions-Policy` y revisar Response Headers | `permissions-policy: camera=(), microphone=(), geolocation=()`; la app funciona igual | ✅ |
| 6 | localhost:8080 | Agregar `X-Frame-Options` y revisar Response Headers | `x-frame-options: DENY`; la app funciona igual | ✅ |
| 7 | Render | Response Headers en producción + análisis en securityheaders.com | Las cinco cabeceras presentes (CSP, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options); solo falta HSTS, que queda para Cloudflare | ✅ |

## RF-07 — "Tomar caso" en tickets cerrados (21-10)

Defecto: la bandeja mostraba "Tomar caso" en tickets Cerrados sin asignar. La RLS ya bloqueaba el cambio para técnicos (`status <> 'cerrado'`), pero el técnico recibía el mensaje equivocado "Este caso ya fue tomado por otro técnico".

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 0 | Diego (técnico) | Antes del arreglo: "Tomar caso" en "mouse malo" | 0 filas por RLS → mensaje "ya fue tomado" (defecto) | ✅ reproducido |
| 1 | Diego (técnico) | Bandeja después del arreglo: "mouse malo" | Sin botón "Tomar caso" | ✅ |
| 2 | Andrea (admin) | Bandeja después del arreglo: "mouse malo" | Sin botón "Tomar caso" | ✅ |
| 3 | Diego (técnico) | Ticket Nuevo sin asignar | "Tomar caso" visible y funcional | ✅ |

## RF-05 / CA-07 — Historial y nombres del equipo en el detalle de cliente (21-10)

Cambios: función `nombres_equipo(ids)` (`security definer`, entrega solo `id` y `full_name` de técnicos y admins) y política "Cliente ve historial de sus tickets" en `audit_events` (sin `cambiar_prioridad`).

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto (cliente) | Abrir un ticket asignado | "Atendido por" con el nombre del técnico; sus mensajes con nombre + etiqueta "Equipo NTEK" | ✅ |
| 2 | Loreto (cliente) | Ver el Historial de un ticket con cambios | Creación, asignación y estados; sin cambios de prioridad | ✅ |
| 3 | Loreto (cliente) | Consola: contar eventos de prioridad y de tickets ajenos en `audit_events` | `0` y `0` | ✅ |
| 4 | Pedro (cliente) | Consola: mismo conteo | `0` y `0` (no ve eventos de Loreto) | ✅ |
| 5 | Loreto (cliente) | Consola: `rpc('nombres_equipo')` con el id de Pedro | `data: []` (no entrega nombres de clientes) | ✅ |
| 6 | Loreto (cliente) | Consola: `rpc('nombres_equipo')` con el id de Diego | Solo `id` y `full_name` | ✅ |
| 7 | Diego (técnico) | Abrir el detalle de equipo | Sin cambios | ✅ |

### Defecto 15-10 — Header se desborda a ~960 px (RNF-01) (corregido con la barra lateral, 19-10)

El header horizontal no cabía a anchos intermedios y generaba desplazamiento horizontal en la página. Con el rediseño (barra lateral) el menú ya no compite por el ancho. En las tablas el desplazamiento queda dentro de `.tabla-contenedor` (`overflow-x: auto`), no en la página.

| N.º | Prueba | Cuenta | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | `admin/auditoria.html` a 960 px | Admin (Andrea) | Sin desplazamiento horizontal de la página; textos completos | ✅ 23-10 |
| 2 | `equipo/bandeja-global.html` a 960 px | Admin (Andrea) | Solo la tabla se desplaza dentro de su caja; la página no | ✅ 23-10 |

## RNF-02 / RNF-03 — Lighthouse en Render (23-10)

Medido en ventana de incógnito, modo Navigation, dispositivo Mobile, con la simulación de red por defecto. Objetivos: Performance ≥ 80 y Accessibility ≥ 90.

| N.º | Pantalla | Cuenta | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|
| 1 | Login | __ | 99 | 100 | 100 | 90 |
| 2 | Bandeja global | Admin (Andrea) | 81 | 96 | 100 | 90 |
| 3 | Detalle de equipo | Admin (Andrea) | 77 | 96 | 100 | 90 |
| 4 | Detalle de cliente | Cliente (Loreto Jael Pradel) | Mobile: 81 antes / 90 después (Desktop: 96) | 96 | 100 | 90 |

Defecto corregido: el link activo de la barra lateral (`aria-current="page"`) tenía un contraste justo (4,74:1, fondo `#11844c`). Se cambió a `--color-acento` (`#0d8148`, 4,94:1).

Falso positivo: Lighthouse marca los botones "Ver detalle" de la Bandeja por contraste bajo. Revisado con el selector de color de DevTools: 4,94:1 (cumple AA). La columna Acciones queda dentro del scroll horizontal de la tabla a 960 px y Lighthouse no detecta su fondo.

Detalle de equipo: Performance entre 77 y 80 (bajo el objetivo de 80). El `<h1>` aparece tarde porque la página hace 6 esperas seguidas a Supabase antes de mostrarse. Se pasaron comentarios, adjuntos e historial a `Promise.all`, sin mejora medible: la espera principal está antes (`getUser()` y las consultas iniciales). Pendiente para la semana 11: revisar la cadena de consultas, `preconnect` al CDN y caché con Cloudflare.
**Resuelto el 02-11** (ver sección "RNF-02 — Consultas en paralelo en el detalle de equipo").

Compresión revisada el 11-11: Render ya entrega CSS y JS comprimidos con Brotli (`content-encoding: br`) desde su propia red, así que no hace falta activarla en nginx. Pendiente para la etapa de Cloudflare: caché de CSS/JS. `preconnect` al CDN de Supabase: hecho el 10-11.

## RNF-02 — Carga en paralelo en el detalle de cliente (24-10)

Cambio: comentarios, historial y adjuntos se cargan con `Promise.all` en vez de uno tras otro. Las tres cargas comparten `cargarNombresEquipo`, que marcaba cada id como pedido antes de recibir la respuesta. En paralelo, una carga podía encontrar el id marcado, seguir sin esperar y mostrar "Equipo NTEK" en vez del nombre. Se corrigió guardando cada consulta de nombres en curso en `consultasNombres` y esperándolas todas con `Promise.all` antes de dibujar.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto (cliente) | Abrir un ticket con mensajes y adjuntos del técnico | El nombre del técnico aparece en la conversación, el historial, los adjuntos y "Atendido por" (no "Equipo NTEK") | ✅ |
| 2 | Loreto (cliente) | Abrir un ticket sin mensajes ni adjuntos | Estados vacíos de Conversación y Adjuntos visibles | ✅ |
| 3 | Loreto (cliente) | Enviar una respuesta y subir un archivo | La lista se recarga y el contador se actualiza | ✅ |
| 4 | Loreto (cliente) | Network → Fetch/XHR → Waterfall | `comments`, `audit_events` y `attachments` salen al mismo tiempo, no en escalera | ✅ |
| 5 | Loreto (cliente) | Consola durante los flujos anteriores | Sin errores | ✅ |
| 6 | Loreto (cliente) | Lighthouse en Render, Mobile, mismo ticket (antes: 81) | Performance ≥ 80 → 90 | ✅ |

## F-03 / CA-08 — Subticket (27-10)

Si el cliente no está conforme con un ticket Resuelto, abre un subticket vinculado al original. Reglas: solo desde Resuelto, dentro de 7 días desde `resuelto_at`, motivo de 15 a 2000 caracteres, máximo un subticket por ticket (`unique` en `ticket_origen_id`) y sin subticket de un subticket. El original pasa a Cerrado y la atención sigue en el subticket.

El subticket guarda en `contexto_origen` una copia del original (título, descripción, eventos y comentarios públicos), para que el técnico que lo atienda tenga el contexto aunque el original lo haya trabajado otro técnico. Como la RLS limita filas y no columnas, el cliente también puede leer esa copia: por eso no incluye notas internas ni cambios de prioridad.

### Trigger `tickets_resuelto_at`

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Cambiar un ticket de En progreso a Resuelto desde la app | Técnico (Diego) | `resuelto_at` con la fecha del cambio | `resuelto_at` con la hora del cambio (UTC) | ✅ |
| 2 | Cambiar solo la prioridad de un ticket que ya está Resuelto | Técnico (Diego) | `updated_at` cambia; `resuelto_at` se mantiene | `resuelto_at` sin cambios | ✅ |

### Función `abrir_subticket` (desde la consola)

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 3 | Abrir subticket de un ticket Resuelto de otro cliente | Cliente (Pedro) | Error genérico; el ticket no cambia | Error "No se puede abrir un subticket para este ticket." | ✅ |
| 4 | Abrir subticket con motivo de menos de 15 caracteres | Cliente (Loreto Jael Pradel) | Error de validación del motivo | Error "El motivo debe tener entre 15 y 2000 caracteres." | ✅ |
| 5 | Abrir subticket de un ticket propio Resuelto con motivo válido | Cliente (Loreto Jael Pradel) | Devuelve el `id` del subticket; original en Cerrado; subticket en Nuevo con `ticket_origen_id` y `contexto_origen` | Original "VPN no conecta desde casa" en Cerrado; "Subticket: VPN no conecta desde casa" en Nuevo, vinculado al original | ✅ |
| 6 | Repetir la prueba 5 sobre el mismo ticket | Cliente (Loreto Jael Pradel) | Error genérico (el original ya está Cerrado) | Error genérico | ✅ |
| 7 | Revisar `contexto_origen` del subticket | — | Incluye el evento `cerrar` del original con la clienta como actor | Eventos `cambiar_estado` (Diego) y `cerrar` (Loreto Jael Pradel) | ✅ |
| 8 | Abrir subticket de un ticket con nota interna y respuesta pública | Cliente | Cubierta por la prueba 14 | | ✅ |
| 9 | Abrir subticket de un subticket Resuelto | Cliente | Cubierta por la prueba 26| | ✅ |


Nota: el ticket de la prueba 5 fue creado el 24-09, antes del trigger de auditoría (14-10), por eso su copia no incluye el evento `crear`.

### Interfaz — "No estoy conforme" en el detalle de cliente (27-10)

La tarjeta de ticket Resuelto muestra la fecha límite (7 días desde `resuelto_at`) y dos botones: "Aceptar cierre" y "No estoy conforme". Este último despliega un formulario con el motivo (mínimo 15 caracteres), pide confirmación, se deshabilita mientras espera la respuesta ("Abriendo subticket...") y redirige al detalle del subticket. El botón no aparece si el plazo venció o si el ticket ya es un subticket.

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 10 | Abrir un ticket propio en estado Resuelto | Cliente (Loreto Jael Pradel) | Tarjeta con la fecha límite y los botones "No estoy conforme" y "Aceptar cierre" | Tarjeta con fecha límite y ambos botones | ✅ |
| 11 | "No estoy conforme" → "Cancelar" | Cliente (Loreto Jael Pradel) | El formulario se oculta y se borra lo escrito | Formulario oculto y vacío | ✅ |
| 12 | Enviar el formulario con un motivo de 5 caracteres | Cliente (Loreto Jael Pradel) | Notificación de error; el botón no queda deshabilitado | Notificación de error; botón activo | ✅ |
| 13 | Enviar con motivo válido y aceptar la confirmación | Cliente (Loreto Jael Pradel) | "Abriendo subticket...", notificación de éxito y redirección al detalle del subticket | Redirección al subticket nuevo | ✅ |
| 14 | Revisar `contexto_origen` del subticket en el SQL Editor (el original tenía una respuesta pública y una nota interna de Diego) | — | La copia trae la respuesta pública y no la nota interna | Solo la respuesta pública | ✅ |
| 15 | Volver al ticket original desde Mis tickets | Cliente (Loreto Jael Pradel) | Estado Cerrado y sin la tarjeta de Resuelto | Cerrado, sin tarjeta | ✅ |
| 16 | Abrir un segundo subticket de un ticket que ya tiene uno (el admin lo había vuelto a dejar Resuelto) | Cliente (Loreto Jael Pradel) | Rechazado por el `unique`; el original no cambia (la transacción se deshace) | Notificación de error; el ticket sigue Resuelto | ✅ |

Limitación corregida el 27-10: el botón "No estoy conforme" ya no aparece si el ticket tiene un subticket (ver pruebas 22 y 24).

### Interfaz — panel "Ticket original" en el detalle de equipo (27-10)

En un subticket, el detalle de equipo muestra la copia guardada en `contexto_origen`: título, descripción, conversación pública e historial del original. No consulta el ticket original, así que el técnico ve el contexto aunque el original lo haya atendido otro técnico, sin ampliar la RLS.

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 17 | Abrir un ticket normal | Técnico (Diego) | No aparece el panel "Ticket original" | Panel oculto | ✅ |
| 18 | Tomar el subticket de la prueba 13 (original atendido por Diego) y abrirlo | Técnico (Camila) | Panel con el N.º del original, título, descripción, la respuesta pública de Diego (sin la nota interna) y el historial con el cierre de la clienta | Panel completo, sin la nota interna | ✅ |
| 19 | Revisar la consola durante la prueba 18 | Técnico (Camila) | Sin errores | Sin errores | ✅ |
| 20 | Abrir el mismo subticket | Admin (Andrea) | Mismo panel, con los nombres del equipo completos | Panel completo con nombres | ✅ |

### Interfaz — vínculo entre ticket original y subticket en el detalle de cliente (27-10)

El detalle de cliente muestra una franja con link al ticket relacionado. En un subticket se usa `ticket_origen_id`; en un ticket normal se consulta si existe un ticket con `ticket_origen_id` igual a su `id` (`maybeSingle`, a lo más uno por el `unique`). Si el ticket ya tiene un subticket, se oculta "No estoy conforme".

| N.º | Prueba | Cuenta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| 21 | Abrir un subticket | Cliente (Loreto Jael Pradel) | Franja "Este es un subticket del ticket N.º …" con link al original | Franja visible; el link abre el original | ✅ |
| 22 | Abrir el ticket original desde el link de la prueba 21 | Cliente (Loreto Jael Pradel) | Franja "…seguimos atendiendo tu caso en el ticket N.º …" con link al subticket | Franja visible; el link abre el subticket | ✅ |
“texto actualizado el 29-10 según el glosario”.
| 23 | Abrir un ticket sin subticket | Cliente (Loreto Jael Pradel) | Sin franja | Sin franja | ✅ |
| 24 | Abrir un ticket Resuelto que ya tiene subticket (VPN) | Cliente (Loreto Jael Pradel) | Franja hacia el subticket; tarjeta de Resuelto sin "No estoy conforme" ni "avísanos antes del…" | Solo "Aceptar cierre", con la fecha de cierre automático | ✅ |
| 25 | Abrir un subticket en estado Resuelto | Cliente (Loreto Jael Pradel) | Solo "Aceptar cierre", con la fecha de cierre automático | Solo "Aceptar cierre" | ✅ |
| 26 | Llamar a `abrir_subticket` desde la consola sobre el subticket Resuelto de la prueba 25 | Cliente (Loreto Jael Pradel) | Error genérico; el subticket sigue Resuelto (la regla la cumple la base, no solo la pantalla) | Error genérico; sin cambios | ✅ |

## RF-12 — Archivo semanal de auditoría (Edge Function `archivar-auditoria`, 30-10)

| # | Escenario | Cuenta | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Llamar a la función sin la cabecera `x-clave-auditoria` (`net.http_post` desde el SQL Editor) | — | 401 "No autorizado"; no se crea archivo | ✅ 30-10 — 401 "No autorizado" |
| 2 | Archivar la semana del 12-10 (`{"desde": "2026-10-12"}`) | — | 200; archivo `2026-10-12_a_2026-10-18.txt` en el bucket `auditoria` | ✅ 30-10 — archivo creado, `text/plain`, 1,72 KB |
| 3 | Archivar la semana del 19-10 (`{"desde": "2026-10-19"}`) | — | 200; archivo `2026-10-19_a_2026-10-25.txt` | ✅ 30-10 — archivo creado |
| 4 | Abrir el `.txt` descargado | Admin (panel) | Una línea por evento con nombres, tildes y flechas legibles | ✅ |
| 5 | `borrar_auditoria_antigua` sin tickets cerrados hace más de 2 meses | — | `borrados: 0`; `audit_events` sin cambios | ✅ 30-10 — `borrados: 0` |
| 6 | Instrucción de la tarea `archivar_auditoria_semanal` (URL y clave leídas desde Vault) | — | 200; se reemplaza el archivo de la semana anterior (`upsert`) | ✅ 30-10 |
| 7 | `supabase.storage.from('auditoria').list()` desde la consola | Admin (Andrea) | Lista los archivos | ✅ 02-11 — 3 archivos, error null |
| 8 | `supabase.storage.from('auditoria').list()` desde la consola | Técnico (Diego) y Cliente | `[]` (la política solo permite al admin) | ✅ 02-11 — [] sin error (Diego y cliente) |
| 9 | `supabase.storage.from('auditoria').upload('prueba.txt', new Blob(['x']))` desde la consola | Admin | Error de RLS: nadie sube archivos desde la app | ✅ 02-11 — 400 "new row violates row-level security policy" |
| 10 | Ejecución automática de la tarea `archivar_auditoria_semanal` (pg_cron) | — | Aparece el archivo de la semana anterior sin ejecutarlo a mano | ✅ 02-11 — `2026-10-26_a_2026-11-01.txt` creado el __ |

## RNF-02 — Consultas en paralelo en el detalle de equipo (02-11)

Problema: antes de mostrarse, la página esperaba 7 respuestas una detrás de otra (sesión, perfil, ticket, perfiles, `getUser()`, técnicos y luego comentarios/adjuntos/historial). El `<h1>` aparecía tarde y Performance quedaba en 77–80.

Cambios:
- `preconnect` a Supabase y al CDN de `supabase-js` en el `<head>`.
- `getUser()` → `getSession()`: el id del usuario se lee de la sesión guardada, sin petición al servidor de Auth. La RLS sigue validando con `auth.uid()`.
- Ticket y perfiles en un mismo `Promise.all`.
- La lista de técnicos para "Asignar a" se obtiene filtrando los perfiles (`.filter` por rol) en vez de una consulta aparte.
- Se borró un `dibujarGestion(ticket)` duplicado.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Andrea (admin) | Abrir el detalle | "Asignar a" muestra técnicos y admin en orden alfabético | ✅ |
| 2 | Andrea (admin) | Cambiar estado y guardar | Un solo evento por cambio en el historial | ✅ |
| 3 | Diego (técnico) | Abrir el detalle de un ticket suyo | Carga, gestiona y muestra nombres | ✅ |
| 4 | Andrea (admin) | Network → Fetch/XHR → Waterfall | `tickets` y `profiles` salen al mismo tiempo | ✅ |
| 5 | Andrea (admin) | Abrir un id inexistente | "No se encontró el ticket solicitado" | ✅ |
| 6 | Andrea (admin) | Lighthouse Mobile en Render | Performance ≥ 80 | ✅ 95 (antes 77–80) · Accessibility 96 · Best Practices 100 · SEO 90 |

Despliegue: el auto-deploy de `b56e713` falló en Render (error del servicio, sin cambios en Dockerfile ni nginx). Se resolvió con Manual Deploy → Deploy latest commit.

## RNF-01 / RNF-03 / CA-10 — Revisión responsive y teclado (02-11)

Revisado en Live Server con DevTools (modo dispositivo, ancho 360, 768 y 1280 px) y navegación con Tab.

| Pantalla | Cuenta | 360 | 768 | 1280 | Teclado | Observación |
|---|---|---|---|---|---|---|
| Inicio | — | ✅  | ✅  | ✅  | ✅  | |
| Login | — | ✅  | ✅  | ✅  | ✅  | |
| Registro | — | ✅  | ✅  | ✅  | ✅  | |
| Recuperar contraseña | — | ✅  | ✅  | ✅  | ✅  | |
| Panel de cliente | Loreto | ✅  | ✅  | ✅  | ✅  | |
| Nueva solicitud | Loreto | ✅  | ✅  | ✅  | ✅  | |
| Mis tickets | Loreto | ✅  | ✅  | ✅  | ✅  | |
| Detalle de cliente | Loreto | ✅  | ✅  | ✅  | ✅  | |
| Perfil de cliente | Loreto | ✅  | ✅  | ✅  | ✅  | |
| Bandeja global | Diego | ✅  | ✅  | ✅  | ✅  | |
| Detalle de equipo | Diego | ✅  | ✅  | ✅  | ✅  | |
| Indicadores | Diego | ✅  | ✅  | ✅  | ✅  | |
| Perfil de equipo | Diego | ✅ | ✅ | ✅ | ✅ | |
| Usuarios | Andrea | ✅ | ✅ | ✅ | ✅ | Ver defecto 1 |
| Auditoría | Andrea | ✅| ✅ | ✅ | ✅ | |
| Perfil de admin | Andrea | ✅ | ✅ | ✅ | ✅ | |
| 404 | — | ✅ | ✅ | ✅ | ✅ | |
| Acceso denegado | — | ✅ | ✅ | ✅ | ✅ | |

### Defectos encontrados

| N.º | Pantalla | Defecto | Corrección | Estado |
|---|---|---|---|---|
| 1 | Usuarios | `TypeError` en `usuarios.js:31`: no existía `#buscar-usuario`. El HTML del rediseño del 29-10 no quedó comiteado (solo el JS). | Se rehízo el HTML con encabezado, tarjeta y buscador. | ✅ |
| 2 | Panel de cliente | En anchos intermedios la tabla "Últimos tickets" era más ancha que su tarjeta y la columna Actualizado quedaba detrás de "Últimos comentarios". | Se agregó `tabla-contenedor` al contenedor de la tabla (`overflow-x: auto`, igual que en las demás tablas). | ✅ |

## Datos de demostración (sección 09 de los requisitos, 03-11)

Revisado en el SQL Editor: 27 tickets en total. Clientes de empresas distintas: Pedro González (Panadería El Trigal Ltda.), Loreto Jael Pradel (Fairy Pole&Circus SpA), Sofía Herrera (Ferretería Los Andes Ltda.) y Matías Contreras (Transportes Biobío SpA). Equipo NTEK: Diego Muñoz y Camila Rojas (técnicos) y Andrea Soto (admin). Nombres y empresas actualizados el 05-11 desde el SQL Editor. Todos los datos son ficticios.

| N.º | Caso que cubre | Ticket | Título | Cliente | Asignado | Detalle | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Estado Nuevo | `9afb74cd` | WiFi de la sala de ensayo se corta | Lore Jael | Sin asignar | | ✅ |
| 2 | Estado En revisión | `e4d25850` | Error al abrir el sistema de facturación | Lore Jael | Diego Muñoz | | ✅ |
| 3 | Estado En progreso | `5d027099` | Correo no sincroniza en el celular | Loreto Jael Pradel | Camila Rojas | | ✅ |
| 4 | Estado En espera | `95ac757d` | Notebook de recepción no enciende | Lore Jael | Camila Rojas | | ✅ |
| 5 | Estado Resuelto | `0d39b32e` | Configurar red para nueva oficina | Loreto | Diego Muñoz | | ✅ |
| 6 | Estado Cerrado | `6af4f944` | Instalar Office en equipo nuevo | Pedro González | Diego Muñoz | | ✅ |
| 7 | Prioridad Baja | `0d4fb41f` | Crear cuenta de correo para nuevo colaborador | Loreto Jael Pradel | Diego Muñoz | | ✅ |
| 8 | Prioridad Media | `353c24f2` | Programa de contabilidad se cierra al imprimir | Lore Jael | Andrea Soto | | ✅ |
| 9 | Prioridad Alta | `178bc8c4` | Error al exportar informe de ventas a Excel | Loreto Jael Pradel | Sin asignar | | ✅ |
| 10 | Prioridad Crítica | `4a74a41b` | Sin internet en sucursal | Pedro González | Camila Rojas | | ✅ |
| 11 | Sin asignar | `c63ae86f` | Monitor defectuoso | Loreto Jael Pradel | Sin asignar | | ✅ |
| 12 | Con adjunto | `4daf62d9` | Impresora de caja no imprime boletas | Pedro González | Sin asignar | 1 adjunto | ✅ |
| 13 | Con nota interna | `0d9fb9eb` | Batería de notebook dura menos de una hora | Lore Jael | Camila Rojas | 1 respuesta pública y 1 nota interna | ✅ |
| 14 | Subticket vinculado (F-03 / CA-08) | `6182cb67` | Subticket: No puedo acceder a la carpeta compartida | Loreto Jael Pradel | Sin asignar | Original `0acb644b` (Cerrado) | ✅ |

## RNF-02 / RNF-03 — Lighthouse en el resto de las pantallas (03-11)

Medido en ventana de incógnito, modo Navigation, dispositivo Mobile, con la simulación de red por defecto. Objetivos: Performance ≥ 80 y Accessibility ≥ 90. Continúa la tabla del 23-10 (pruebas 1 a 4).

| N.º | Pantalla | Cuenta | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|
| 5 | Inicio | — | 100 | 100 | 100 | 90 |
| 6 | Panel de cliente | Cliente (Loreto Jael Pradel) | 93 | 96 | 100 | 90 |
| 7 | Mis tickets | Cliente (Loreto Jael Pradel) | 95 | 96 | 100 | 90 |
| 8 | Nueva solicitud | Cliente (Loreto Jael Pradel) | 91 | 96 | 100 | 90 |
| 9 | Perfil de cliente | Cliente (Loreto Jael Pradel) | 94 | 95 | 100 | 90 |
| 10 | Indicadores | Técnico (Diego) | 94 | 95 | 100 | 90 |
| 11 | Perfil de equipo | Técnico (Diego) | 92 | 95 | 100 | 90 |
| 12 | Usuarios | Admin (Andrea) | 90 | 96 | 100 | 90 |
| 13 | Auditoría | Admin (Andrea) | 90 | 95 | 100 | 90 |

## RNF-04 — Prueba básica en Firefox (03-11)

Firefox (última versión estable), sitio en Render. El modo de diseño adaptable de Firefox también se abre con Ctrl + Shift + M.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto (cliente) | Iniciar sesión | Llega al panel con su nombre y rol | ✅ |
| 2 | Loreto (cliente) | Crear un ticket con Ñ y tildes en el título | Cooldown del botón; detalle con su ID y el texto bien escrito | ✅ |
| 3 | Loreto (cliente) | Subir un PNG en el detalle | Se sube y aparece en la lista | ✅ |
| 4 | Loreto (cliente) | Subir un `.md` | Se sube y aparece como "Markdown" (Firefox puede informar otro tipo MIME) | ✅ |
| 5 | Loreto (cliente) | Descargar el archivo | Se descarga sin salir de la página | ✅ |
| 6 | Diego (técnico) | Bandeja: filtrar y cambiar de página | Filtros y paginación funcionan | ✅ |
| 7 | Diego (técnico) | Detalle: cambiar estado y guardar | El cambio aparece en el historial | ✅ |
| 8 | — | Consola durante los flujos anteriores | Sin errores | ✅ |
| 9 | Loreto (cliente) | Recorrer panel y detalle en 360 px | Sin desplazamiento horizontal | ✅ |

### Defectos encontrados

| 1 | Detalle de cliente y de equipo | Firefox no asigna tipo MIME a los archivos `.md` (`archivo.type` llega vacío): primero `buscarGrupo` los rechazaba y, después de corregirlo, Storage los recibía como `application/octet-stream` y el bucket los rechazaba. | Función `obtenerTipoArchivo()` en `reglas-adjuntos.js` (si no hay tipo y la extensión es `.md`, usa `text/markdown`). Antes de subir se crea una copia del archivo con ese tipo (`new File(...)`), porque Supabase toma el tipo del archivo y no la opción `contentType`. | ✅ |

## RNF-04 — Prueba en Edge (11-11)

Microsoft Edge (última versión estable) en el PC, sitio en Render. Vista adaptable con Ctrl + Shift + M.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto (cliente) | Iniciar sesión | Llega al panel con su nombre y rol | ✅ |
| 2 | Loreto (cliente) | Crear un ticket con Ñ y tildes en el título | Cooldown del botón; detalle con su ID y el texto bien escrito | ✅ |
| 3 | Loreto (cliente) | Subir un PNG y un `.md` en el detalle | Se suben y aparecen en la lista | ✅ |
| 4 | Loreto (cliente) | Descargar un archivo | Se descarga sin salir de la página | ✅ |
| 5 | Diego (técnico) | Bandeja: filtrar y cambiar de página | Filtros y paginación funcionan | ✅ |
| 6 | Diego (técnico) | Detalle: cambiar estado y guardar | El cambio aparece en el historial | ✅ |
| 7 | Andrea (admin) | Abrir Usuarios y Auditoría | Las dos páginas cargan con datos | ✅ |
| 8 | — | Consola durante los flujos anteriores | Sin errores | ✅ |
| 9 | Loreto (cliente) | Recorrer panel y detalle en 360 px | Sin desplazamiento horizontal | ✅ |

## RNF-04 — Prueba básica en Safari (iPhone, 11-11)

Safari en iPhone, sitio en Render.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto (cliente) | Iniciar sesión | Llega al panel con su nombre y rol | ✅ |
| 2 | Loreto (cliente) | Abrir Mis tickets y un detalle | Lista y detalle cargan; tablas pasan a bloques con rótulos | ✅ |
| 3 | Loreto (cliente) | Crear un ticket desde Nueva solicitud | Cooldown del botón; llega al detalle con su ID | ✅ |
| 4 | Loreto (cliente) | Recorrer las pantallas en vertical | Sin desplazamiento horizontal ni texto cortado | ✅ |
| 5 | Loreto (cliente) | Cerrar sesión | Vuelve al login | ✅ |

## CA-11 — Reconstruir el contenedor desde cero (03-11)

Construido en local con `docker build --no-cache` (sin usar capas guardadas de builds anteriores) y ejecutado con `docker run -p 8080:80`, siguiendo solo los pasos del README.

| N.º | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| 1 | `docker build --no-cache -t ntek-servicedesk .` | Build exitoso, sin errores | ✅ |
| 2 | `ls -la /usr/share/nginx/html` dentro de la imagen | Están `index.html`, `css`, `js` y `pantallas`; no están `.git`, `.vscode`, `docs`, `supabase`, `Dockerfile`, `README.md` ni `package.json` | ✅ |
| 3 | Abrir `http://localhost:8080` | Inicio con estilos | ✅ |
| 4 | Login con cliente y abrir un ticket | Panel y detalle con datos reales | ✅ |
| 5 | Response headers del documento | CSP, nosniff, Referrer-Policy, Permissions-Policy y X-Frame-Options | ✅ |
| 6 | Abrir `/no-existe` | Página 404 propia, Status 404 | ✅ |
| 7 | Abrir `/pantallas/cliente/a/b/no-existe` | Página 404 propia con estilos | ✅ |
| 8 | "Ir al inicio" desde el 404 | Vuelve a la página de inicio | ✅ |

### Defectos encontrados

| N.º | Pantalla | Defecto | Corrección | Estado |
|---|---|---|---|---|
| 1 | 404 | nginx mostraba su página 404 por defecto ("404 Not Found nginx/1.31.8") en vez de la propia, en local y en Render. | `error_page 404 /pantallas/sistema/404.html;` en `nginx.conf`. Las rutas de `404.html` pasaron de relativas (`../../`) a absolutas (`/`), porque nginx entrega la página en la URL que pidió el usuario. | ✅ |
| 2 | Imagen Docker | Se copiaban al sitio publicado archivos que no son parte de la app (`.vscode`, `README.md`, `.gitignore`, `package.json`, `package-lock.json`). | Se agregaron a `.dockerignore`. `nginx.conf` se mantiene porque el Dockerfile lo necesita para su propio `COPY`. | ✅ |

## Matriz de casos de aceptación (CA-01 a CA-12) (03-11)

| CA | Escenario | Dónde se probó | Estado |
|---|---|---|---|
| CA-01 | Cliente válido inicia sesión y llega a su panel | "CA-01 / CA-02 / CA-04 — Flujo principal (03-11)" | ✅  |
| CA-02 | Cliente crea ticket con campos obligatorios | "CA-01 / CA-02 / CA-04 — Flujo principal (03-11)"; evento `crear` en RF-12 prueba 1 | ✅  |
| CA-03 | Cliente A intenta abrir URL de ticket de Cliente B | RF-SEG-03 — Aislamiento entre clientes (06-10) | ✅ |
| CA-04 | Técnico filtra por estado y toma asignación | "CA-01 / CA-02 / CA-04 — Flujo principal (03-11)"; RLS en RF-07 (28-09) | ✅  |
| CA-05 | Técnico agrega nota interna y respuesta pública | RF-08 — Comentarios y notas internas (06-10) | ✅ |
| CA-06 | Adjuntar tipo o tamaño no permitido | RF-09 — Archivos adjuntos (08-10) y límites por tipo (13-10 y 14-10) | ✅ |
| CA-07 | Nuevo → En progreso → Resuelto con historial | RF-12 — Auditoría (15-10); RF-05 / CA-07 historial en los detalles (20-10 y 21-10) | ✅ |
| CA-08 | Cliente solicita reapertura de caso resuelto | F-03 / CA-08 — Subticket (27-10). Según lo acordado con Tomás, el original pasa a Cerrado y la atención sigue en un subticket vinculado | ✅ |
| CA-09 | Administrador desactiva un perfil cliente | RF-11 — Gestión de usuarios (02-10), pruebas 4 a 6 | ✅ |
| CA-10 | Flujo principal en 360 px | RNF-01 / RNF-03 / CA-10 — Revisión responsive y teclado (02-11) | ✅ |
| CA-11 | Reconstruir el contenedor desde cero | CA-11 — Reconstruir el contenedor desde cero (03-11) | ✅ |
| CA-12 | Actualizar la rama de despliegue | "CA-12 — Despliegue en Render (03-11)". La parte de Cloudflare (HTTPS en el subdominio) queda pendiente para la semana 12 | ⏳ |

## CA-01 / CA-02 / CA-04 — Flujo principal (03-11)

Probado en Render desde la interfaz.

| N.º | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | Loreto Jael Pradel (cliente) | Iniciar sesión | Llega al panel de cliente; saludo con su nombre y rol "Cliente" en la barra lateral | ✅ |
| 2 | Loreto Jael Pradel (cliente) | Abrir Perfil | Nombre, teléfono y empresa propios; el correo como identificador | ✅ |
| 3 | Loreto Jael Pradel (cliente) | Nueva solicitud con título vacío | Mensaje de validación; no se crea ticket | ✅ |
| 4 | Loreto Jael Pradel (cliente) | Nueva solicitud con todos los campos | Redirige al detalle con N.º, estado Nuevo, fecha de creación y su nombre como autor | ✅ |
| 5 | Diego (técnico) | Bandeja: filtrar por estado Nuevo | Aparece el ticket de la prueba 4, solo tickets Nuevo | ✅ |
| 6 | Diego (técnico) | "Tomar caso" en ese ticket | Notificación de éxito; "Asignado" cambia a Diego Muñoz | ✅ |
| 7 | Diego (técnico) | Recargar la página (F5) | La asignación se mantiene (quedó guardada en la base) | ✅ |
| 8 | Andrea (admin) | Abrir Auditoría | Eventos `crear` (Loreto Jael Pradel) y `asignar` (Diego Muñoz) del ticket | ✅ |

## CA-12 — Despliegue en Render (03-11)

| N.º | Acción | Resultado esperado | Estado |
|---|---|---|---|
| 1 | Push a `main` con la corrección del 404 | Render inicia el despliegue automático y queda en Live | ✅ |
| 2 | Abrir `https://ntek-servicedesk.onrender.com/no-existe` | Página 404 propia, con estilos (confirma que se publicó la versión nueva) | ✅ |
| 3 | Abrir `https://ntek-servicedesk.onrender.com/package.json` | 404 (el archivo ya no está en la imagen) | ✅ |
| 4 | Revisar el candado del navegador en el sitio | HTTPS activo (certificado de Render) | ✅ Certificado válido para `onrender.com`, emitido por Google Trust Services, vence el 20-12-2026 (Render lo renueva automáticamente) |
| 5 | HTTPS en el subdominio de NTEK con Cloudflare | Pendiente: semana 12, cuando Tomás entregue el subdominio | ⏳ |

## Respaldo y restauración — prueba en Supabase local (04-11)

Restauración del respaldo `2026-11-03_datos.sql` en un Supabase local (`npx supabase start`), siguiendo `docs/respaldo-restauracion.md`.

| N.º | Prueba | Resultado esperado | Estado |
|---|---|---|---|
| 1 | `npx supabase start` | Se aplican las 31 migraciones sin errores (estructura, RLS, funciones, triggers y buckets) | ✅ |
| 2 | Cargar los datos con `psql` (hasta antes de la sección `storage`) | Sin errores; `COPY` con 7 usuarios de Auth, 7 perfiles, 29 tickets, 13 adjuntos, 46 eventos y 15 comentarios | ✅ |
| 3 | Comparar conteos entre la nube y local | `auth.users`, `profiles`, `tickets`, `comments` y `attachments` iguales | ✅ |
| 4 | `audit_events`: nube 48, local 46 | Diferencia explicada: 2 eventos `cerrar` del cierre automático (pg_cron) del 04-11 a las 04:00, posteriores al respaldo | ✅ |
| 5 | Fecha del último evento en local | 03-11 17:04, anterior al respaldo: la carga no disparó los triggers de auditoría | ✅ |
| 6 | Request URL en la pestaña Red | Las consultas van a `127.0.0.1:54321` (base local); `Content-Range: 0-28/*` = 29 tickets | ✅ |
| 7 | Login con Andrea (admin) | Bandeja con todos los tickets; los 2 tickets cerrados en la nube a las 04:00 siguen Resueltos en local | ✅ |
| 8 | Login con Pedro (cliente) | Solo ve sus propios tickets (RLS restaurada) | ✅ |
| 9 | Login con Diego (técnico) | Bandeja con sus tickets y los sin asignar | ✅ |
| 10 | `git restore js/supabase-client.js` | El archivo vuelve a apuntar a la nube; no queda en `git status` | ✅ |

### Defectos encontrados

| N.º | Parte | Defecto | Corrección | Estado |
|---|---|---|---|---|
| 1 | `storage.buckets` | Las migraciones ya insertan los buckets `adjuntos` y `auditoria`; cargar el respaldo completo choca por llave duplicada. | Se carga solo hasta antes de la sección `storage`; los buckets los crean las migraciones. Documentado en el punto 4. | ✅ |
| 2 | Versión de Storage | `column "lifecycle_configuration" of relation "buckets" does not exist`: Storage en la nube es más nuevo que el de la CLI v2.117.0. Con `--single-transaction` no se guardó nada. | Mismo corte: no se carga la sección `storage`. No se actualiza la CLI hasta después de la entrega. | ✅ |
| 3 | Documento | El punto 4 usaba `127.0.0.1` dentro del contenedor y cargaba el archivo completo. | `host.docker.internal` para pruebas locales y carga sin `storage`. | ✅ |

## Cooldown contra solicitudes duplicadas (06-11)

Probado con la red simulada en Slow 3G (DevTools → Network), para que la respuesta tarde y se puedan hacer varios clics.

| N.º | Pantalla | Cuenta | Acción | Resultado esperado | Estado |
|---|---|---|---|---|---|
| 1 | Nueva solicitud | Cliente | Hacer 3 clics seguidos en Enviar | Botón deshabilitado con "Procesando solicitud..."; se crea un solo ticket | ✅ |
| 2 | Nueva solicitud | Cliente | Enviar con el título vacío | Mensaje de validación; el botón sigue habilitado | ✅ |
| 3 | Detalle de cliente | Cliente | Hacer 3 clics seguidos en subir adjunto | Botón deshabilitado con "Subiendo archivo..."; se sube un solo archivo | ✅ |
| 4 | Detalle de cliente | Cliente | Intentar subir un tipo no permitido | Mensaje de error; el botón sigue habilitado | ✅ |
| 5 | Detalle de equipo | Técnico | Hacer 3 clics seguidos en subir adjunto | Un solo archivo subido | ✅ |

## Registro de defectos corregidos

Resumen de los defectos encontrados durante el desarrollo y las pruebas. El detalle y las pruebas de cada uno están en la sección indicada.

| N.º | Fecha | Área | Defecto | Corrección | Sección con la prueba |
|---|---|---|---|---|---|
| 1 | 08-10 | Seguridad (RLS) | Dos políticas de update duplicadas en `tickets` (`update_ticket_tecnico`, `update_ticket_admin`) se sumaban a las nuevas y abrían más permisos de los esperados. | Se eliminaron; quedan solo las políticas de RF-07. | RF-07: políticas RLS de UPDATE (28-09) |
| 2 | 09-10 | Nueva solicitud | Con mala conexión, varios clics en "Enviar" creaban tickets duplicados (observación de NTEK). | Cooldown: botón deshabilitado y mensaje "Procesando solicitud..." hasta recibir respuesta. | Cooldown contra solicitudes duplicadas (06-11) |
| 3 | 14-10 | Adjuntos | Mismo riesgo de duplicados al subir archivos. Además, al apagar el botón antes de validar, un `return` lo dejaba deshabilitado para siempre. | Cooldown después de las validaciones; el botón se reactiva antes de cada `return` y al terminar. | Cooldown contra solicitudes duplicadas (06-11) |
| 4 | 14-10 | Seguridad (Storage) | `delete_adjuntos_propios` permitía borrar desde la consola un archivo propio con ficha en `attachments`, dejándola huérfana. | La política solo permite borrar archivos propios sin ficha (`adjunto_tiene_ficha()`). | RF-09 |
| 5 | 15-10 | Navegación | Un técnico que abría una página de admin era enviado al login en vez de a "Acceso denegado". | `protegerRuta` separa "perfil no leído" (login) de "rol no permitido" (Acceso denegado). | Defecto 15-10 — Rol no permitido |
| 6 | 15-10 | Responsive (RNF-01) | El header horizontal se desbordaba a ~960 px y generaba desplazamiento horizontal. | Rediseño con barra lateral; las tablas se desplazan dentro de `.tabla-contenedor`. | Defecto 15-10 — Header se desborda |
| 7 | 21-10 | Bandeja | "Tomar caso" aparecía en tickets Cerrados sin asignar; la RLS bloqueaba el cambio, pero el mensaje decía "ya fue tomado por otro técnico". | El botón solo se muestra en tickets sin asignar que no están cerrados. | RF-07 — "Tomar caso" en tickets cerrados |
| 8 | 23-10 | Accesibilidad (RNF-03) | Contraste justo del link activo de la barra lateral (4,74:1). | Color cambiado a `--color-acento` (4,94:1). | RNF-02 / RNF-03 — Lighthouse (23-10) |
| 9 | 23-10 | Rendimiento (RNF-02) | Detalle de equipo con Performance 77–80, bajo el objetivo de 80, por consultas en cadena. | `getSession()`, `preconnect` y consultas en paralelo con `Promise.all`: Performance 95. | RNF-02 — Consultas en paralelo (02-11) |
| 10 | 02-11 | Usuarios | `TypeError`: no existía `#buscar-usuario`, porque el HTML del rediseño no se había comiteado. | Se rehízo el HTML con encabezado, tarjeta y buscador. | RNF-01 / RNF-03 / CA-10 |
| 11 | 02-11 | Panel de cliente | En anchos intermedios, la tabla "Últimos tickets" era más ancha que su tarjeta. | `tabla-contenedor` en el contenedor de la tabla. | RNF-01 / RNF-03 / CA-10 |
| 12 | 03-11 | Compatibilidad (RNF-04) | Firefox no asigna tipo MIME a los `.md`; la app y Storage los rechazaban. | `obtenerTipoArchivo()` deduce el tipo por la extensión y se sube una copia con `new File(...)`. | RNF-04 — Firefox |
| 13 | 03-11 | Docker / nginx | nginx mostraba su 404 por defecto en vez de la propia. | `error_page 404` en `nginx.conf` y rutas absolutas en `404.html`. | CA-11 |
| 14 | 03-11 | Imagen Docker | Se publicaban archivos que no son de la app (`.vscode`, `README.md`, `package.json`...). | Agregados a `.dockerignore`. | CA-11 |
| 15 | 04-11 | Restauración | Cargar el respaldo completo fallaba: buckets duplicados y columna de Storage inexistente en la CLI local. | Se carga solo hasta antes de la sección `storage`; los buckets los crean las migraciones. | Respaldo y restauración |
| 16 | 04-11 | Documentación | El procedimiento usaba `127.0.0.1` dentro del contenedor. | `host.docker.internal` y carga sin `storage`. | Respaldo y restauración |