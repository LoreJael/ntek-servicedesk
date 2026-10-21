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
| 5 | Render | Response Headers en producción después del despliegue | Las mismas tres cabeceras del punto 1 | ⬜ |