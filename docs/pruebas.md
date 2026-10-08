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
| 4 | Subir un tipo no permitido | Loreto (cliente) | En el explorador, "Todos los archivos" → elegir un `.txt` | Mensaje "Solo se permiten archivos JPG, PNG o PDF."; no se sube nada | ⬜ |
| 5 | Ticket cerrado (cliente) | Loreto (cliente) | Abrir el detalle de un ticket cerrado | Se ve la lista de archivos, pero no el formulario | ✅ |
| 6 | Descargar un archivo | Loreto (cliente) | Botón "Descargar" | El archivo se descarga sin salir de la página | ✅ |
| 7 | Link firmado vencido | Loreto (cliente) | Copiar el link de descarga (`Ctrl + J`), esperar más de 20 s y abrirlo en otro navegador | Error de Supabase por token vencido | ✅ |
| 8 | El equipo ve los archivos del cliente | Diego (técnico) | Detalle de equipo del mismo ticket | Aparecen con el nombre del cliente como autor | ✅ |
| 9 | El equipo sube un archivo | Diego (técnico) | Detalle de equipo → subir imagen | Aparece como "Tú"; el cliente lo ve como "Equipo NTEK" | ✅ |
| 10 | El equipo adjunta en ticket cerrado | Diego / Andrea | Detalle de equipo de un ticket cerrado | El formulario aparece y la subida funciona | ✅ |

**Conclusión:** CA-06 cumplido. El tipo y el tamaño se validan en la pantalla (mensaje comprensible) y en el bucket (límite de 5 MB y lista de tipos permitidos). Los archivos se guardan en un bucket privado con nombre no predecible, y se descargan con un link firmado que vence a los 20 segundos.