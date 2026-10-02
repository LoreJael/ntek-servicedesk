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