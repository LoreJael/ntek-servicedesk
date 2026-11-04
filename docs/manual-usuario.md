# Manual de usuario — NTEK ServiceDesk Lite

Sistema web para crear solicitudes de soporte a NTEK y hacerles seguimiento.

Dirección: https://ntek-servicedesk.onrender.com

## Roles

| Rol | Qué puede hacer |
|---|---|
| Cliente | Crear solicitudes, ver y comentar solo las propias, adjuntar archivos y aceptar o protestar el cierre. |
| Técnico | Tomar casos, cambiar estado y prioridad, responder al cliente y escribir notas internas. |
| Administrador | Todo lo del técnico, además de reasignar casos, administrar usuarios y revisar la auditoría. |

Toda cuenta nueva se crea como **Cliente**. Los roles de técnico y administrador los asigna un administrador.

## Estados de un ticket

| Estado | Significado |
|---|---|
| Nuevo | Recién creado, aún no revisado. |
| En revisión | El equipo está diagnosticando. |
| En progreso | Hay una acción técnica en curso. |
| En espera | Se necesita información del cliente o de un tercero. |
| Resuelto | El equipo entregó una solución; el cliente debe aceptarla o protestarla. |
| Cerrado | Caso finalizado. |

## Acceso

**Crear cuenta:** en el inicio, **Crear cuenta** (o, desde el inicio de sesión, **¿Aún no tienes cuenta? Crea una**) → completar nombre completo, empresa, teléfono, correo y contraseña → **Crear cuenta**. Llega un correo para confirmar la cuenta; después se puede iniciar sesión.

**Iniciar sesión:** en el inicio, **Iniciar sesión** → correo y contraseña → **Ingresar**. Cada rol llega a su propia pantalla de inicio.

**Recuperar contraseña:** en el inicio de sesión, **¿Olvidaste tu contraseña?** → escribir el correo → **Enviar enlace**. El enlace del correo abre un formulario para escribir la nueva contraseña → **Guardar nueva contraseña**.

**Cerrar sesión:** botón con el ícono de puerta, arriba a la derecha (en el celular, dentro del menú).

## Cliente

### Panel

Al iniciar sesión se muestra un resumen de los tickets por estado, los últimos tickets y los últimos comentarios recibidos. Cada elemento abre su ticket.

### Crear una solicitud

1. En el menú, **Nueva solicitud**.
2. Completar:
   - **Título:** entre 5 y 120 caracteres.
   - **Categoría:** Software, Hardware, Red o Cuenta.
   - **Prioridad sugerida:** Baja, Media, Alta o Crítica. El equipo puede ajustarla.
   - **Descripción:** entre 10 y 2000 caracteres.
3. **Enviar solicitud.** El botón queda bloqueado mientras se procesa, para no crear la solicitud dos veces.
4. Se abre el detalle del ticket con su número (N.º) y estado **Nuevo**.

### Mis tickets

Lista de las solicitudes propias, 10 por página, con N.º, título, estado, prioridad y fecha. Se puede buscar por título y filtrar por estado, prioridad y categoría; **Limpiar filtros** quita todos los filtros.

### Detalle del ticket

Muestra la descripción, los detalles del caso (estado, prioridad, categoría, técnico asignado), la conversación con el equipo, los adjuntos y el historial de cambios.

- **Responder:** escribir en **Escribe una respuesta** (entre 10 y 2000 caracteres) → **Enviar comentario**.
- **Adjuntar archivos:** **Adjuntar archivo** → **Subir archivo**. Se permiten por ticket hasta 3 imágenes JPG o PNG (5 MB cada una), 1 PDF (5 MB) y 5 archivos Markdown `.md` (1 MB cada uno). Para descargar, se usa el botón con la flecha hacia abajo junto al archivo.
- En un ticket **Cerrado** ya no se puede comentar ni adjuntar.

### Cuando el ticket queda Resuelto

Aparecen dos opciones:

- **Aceptar cierre:** el problema quedó solucionado. El ticket pasa a **Cerrado**.
- **No estoy conforme:** el problema sigue. Hay que explicar qué sigue sin funcionar (mínimo 15 caracteres) → **Abrir subticket**. El ticket original pasa a Cerrado y la atención continúa en un **subticket** vinculado, que el equipo atiende con el historial del original. Cada ticket puede tener un solo subticket.

Si no se responde en **7 días**, el ticket se cierra automáticamente.

### Perfil

**Perfil** → **Editar datos** para cambiar nombre, teléfono y empresa → **Guardar cambios**. El correo se muestra como identificador y no se puede cambiar.

## Técnico

### Bandeja

Pantalla de inicio del técnico. Muestra, 10 por página, los tickets **asignados a él** y los **sin asignar**, con N.º, título, cliente, estado, prioridad, asignado y fecha de actualización. Se puede buscar por título y filtrar por estado, prioridad y categoría; **Limpiar filtros** quita todos los filtros.

**Tomar caso:** en un ticket sin asignar, el botón **Tomar caso** lo asigna al técnico que lo presiona. Si otro técnico lo tomó un momento antes, se muestra un aviso y el caso no se duplica. Un técnico no puede soltar un caso; solo el administrador reasigna.

### Detalle del ticket (gestionar)

Además de la descripción, la conversación, los adjuntos y el historial completo, tiene el bloque de gestión:

- **Estado** y **Prioridad** → **Guardar cambios**. Cada cambio queda en el historial con su autor y fecha.
- Un ticket **Cerrado** queda bloqueado para el técnico.
- Si el ticket es un **subticket**, se muestra el panel **Ticket original** con el caso anterior y su historial, como contexto.

**Conversación:**
- Escribir en **Escribe una respuesta o nota** (entre 10 y 2000 caracteres) → **Enviar comentario**.
- Con la casilla **Nota interna (el cliente no la ve)** marcada, el comentario queda solo para el equipo y aparece con la etiqueta *Nota interna*. Sin la casilla, es una respuesta pública que el cliente sí ve.

**Adjuntos:** los mismos límites que el cliente (3 imágenes, 1 PDF y 5 `.md` por ticket). El equipo puede adjuntar también en tickets cerrados.

**Marcar como Resuelto:** al cambiar el estado a **Resuelto**, el cliente puede aceptar el cierre o abrir un subticket. Si no responde en 7 días, el ticket se cierra automáticamente.

### Indicadores

Totales de tickets por estado y por prioridad, los 5 tickets de **Alta prioridad abiertos** y los **Tickets recientes**. Cada tarjeta abre la Bandeja con ese filtro aplicado. El técnico ve los indicadores solo de los tickets que puede ver en su Bandeja.

### Perfil

Igual que el cliente: **Editar datos** → **Guardar cambios**.

## Administrador

El administrador tiene todo lo del técnico: Bandeja, detalle, Indicadores y Perfil. Además:

- En la **Bandeja** e **Indicadores** ve **todos** los tickets.
- En el detalle del ticket puede **reasignar** el caso con **Asignar a** y modificar tickets **Cerrados**.

### Usuarios

Lista de todas las cuentas con nombre, empresa, teléfono, rol y estado. Se puede buscar con **Buscar por nombre o empresa**.

- **Cambiar rol:** elegir Cliente, Técnico o Administrador en la fila del usuario → **Guardar rol**.
- **Desactivar / Activar:** **Desactivar** pide confirmación. El usuario ya no puede iniciar sesión, pero **sus tickets, comentarios e historial se conservan**. **Activar** le devuelve el acceso.
- El sistema no permite quitar el rol ni desactivar al **último administrador**, para que nunca quede sin uno.

### Auditoría

Muestra los últimos 50 movimientos: crear, asignar, cambiar estado, cambiar prioridad, cerrar y reabrir. Cada movimiento indica quién lo hizo, el cambio (antes → después), la fecha y un enlace al ticket. Cuando el autor es **Sistema**, el cambio lo hizo una tarea automática (por ejemplo, el cierre automático de tickets Resueltos).

Cada semana se genera automáticamente un archivo `.txt` con los movimientos de la semana anterior, que queda guardado para el administrador.

### Perfil

Además de los datos de contacto, muestra un resumen de usuarios, accesos directos a las herramientas de administración y los últimos movimientos.

## Preguntas frecuentes

**No puedo iniciar sesión.** Revisar correo y contraseña. Si la cuenta es nueva, confirmarla con el correo recibido. Si aun así no entra, puede que un administrador haya desactivado la cuenta.

**No me llegó el correo de confirmación o de recuperación.** Revisar la carpeta de spam y esperar unos minutos antes de volver a pedirlo.

**No puedo subir un archivo.** Revisar que sea JPG, PNG, PDF o `.md`, que no supere su tamaño máximo y que el ticket no tenga ya el máximo de archivos de ese tipo.

**Veo la pantalla "Acceso denegado".** La página es para otro rol (por ejemplo, un cliente que intenta abrir una página del equipo).

**El sitio tarda en cargar la primera vez.** El servidor se suspende cuando no se usa y tarda unos segundos en despertar.