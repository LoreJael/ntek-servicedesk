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

## Estado del proyecto
- [x] Etapa 1: Descubrimiento y diseño
- [x] Etapa 2: Base front-end
- [x] Etapa 3: Supabase y autenticación
- [ ] Etapa 4: Tickets
...

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

## Instalación y despliegue
Pendiente (etapa 7).

Proyecto desarrollado durante la práctica profesional.

Despliegue:    https://ntek-servicedesk.onrender.com
