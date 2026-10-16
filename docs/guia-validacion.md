# Guía de validación — NTEK ServiceDesk Lite

## Qué es

Sistema web de solicitudes de soporte. Un cliente crea tickets y revisa su historial; el equipo NTEK (técnicos y administrador) los atiende, cambia estados y prioridades, responde y deja notas internas.

**Link:** https://ntek-servicedesk.onrender.com

> La app está en el plan gratuito de Render: si nadie la usó en un rato, la primera carga puede demorar cerca de un minuto. No es un error.

## Cuentas de prueba

Las contraseñas te las mando por mensaje privado. 

| Rol | Nombre | Empresa |
|---|---|---|
| Cliente | Pedro González | Panadería El Trigal Ltda. |
| Cliente | Loreto | FairyPole |
| Técnico | Diego Muñoz | NTEK |
| Técnico | Camila Rojas | NTEK |
| Administrador | Andrea Soto | NTEK |

Para usar dos roles a la vez, abre el segundo en una ventana de incógnito: la sesión se comparte entre pestañas normales.

## ⚠️ Por favor, no hagas esto

- **No desactives ni le cambies el rol a Andrea Soto.** Es la única administradora; si pierde el acceso, nadie puede administrar el sistema.
- Para probar desactivar o cambiar roles, usa solo la cuenta **Loreto (FairyPole)** y déjala como estaba al terminar (activa y con rol Cliente).
- **No registres cuentas nuevas ni pidas recuperación de contraseña muchas veces:** Supabase tiene un límite diario de correos y, si se agota, nadie puede recuperar su contraseña ese día.
- Si pruebas cerrar tickets, usa los que tú mismo creaste, para no alterar los datos de demostración.

## Funciones que todavía no están (no hace falta reportarlas)

- Aceptar el cierre o pedir reapertura de un ticket resuelto (en desarrollo).
- Historial de cambios dentro del detalle del ticket.
- Panel de indicadores para el equipo.
- Paginación en los listados.
- Defecto conocido: con la ventana en un ancho intermedio (cerca de 960 px), el menú superior se corta y aparece desplazamiento horizontal.

## Cómo reportar lo que encuentres

Para cada hallazgo, idealmente:

1. Qué hiciste (pasos).
2. Con qué cuenta.
3. Qué esperabas que pasara.
4. Qué pasó en realidad.
5. Una captura, si se puede.

¡Gracias! 💚