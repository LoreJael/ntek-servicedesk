# Glosario y criterios de redacción — NTEK ServiceDesk Lite

Este documento define qué palabras se usan en la interfaz y cómo se redactan los mensajes, para que todo el sistema se lea de la misma forma. Se aplica a textos de pantallas, botones, mensajes, títulos de pestaña y datos de demostración.

## 1. Términos principales

| Término | Cuándo se usa | Ejemplos |
|---|---|---|
| **Ticket** | El registro de soporte, en todo el sistema: listas, detalle, mensajes y estados vacíos. | "Mis tickets", "Ticket creado con el N.º 3f2a9c1b.", "Aún no tienes tickets." |
| **Solicitud** | Solo la acción del cliente de pedir ayuda. Una vez creada, pasa a llamarse ticket. | "Nueva solicitud", "Enviar solicitud" |
| **Caso** | Solo en la acción del equipo de tomar un ticket sin asignar (flujo F-02). | "Tomar caso" |
| **Subticket** | Ticket nuevo que abre el cliente desde un ticket Resuelto cuando no está conforme. Queda vinculado al original. | "Abrir subticket", "Te llevamos al subticket." |
| **Comentario** | Mensaje público dentro de un ticket, visible para el cliente y el equipo. | "Enviar comentario" |
| **Nota interna** | Comentario del equipo que el cliente nunca ve. | "Marcar como nota interna" |
| **Adjunto / archivo** | Imagen, PDF o Markdown asociado a un ticket. En los mensajes se dice "archivo". | "Archivo subido." |
| **N.º** | Número corto del ticket (primeros 8 caracteres del identificador). Se escribe con el indicador ordinal (º), no con el signo de grado (°). | "N.º 3f2a9c1b" |

## 2. Valores fijos

Estos nombres vienen del documento de requisitos y no se cambian.

| Tipo | Valores |
|---|---|
| Estados | Nuevo, En revisión, En progreso, En espera, Resuelto, Cerrado |
| Prioridades | Baja, Media, Alta, Crítica |
| Roles | Cliente, Técnico, Administrador |
| Categorías | Software, Hardware, Red, Cuenta |

## 3. Trato al usuario

- Se trata al usuario de **tú** en todo el sistema.
- No se usa "usted" ni formas como "su cuenta" o "comuníquese".
- El saludo no tiene género: "Te damos la bienvenida", no "Bienvenido".

## 4. Mensajes

| Tipo | Forma | Ejemplos |
|---|---|---|
| Error | "No se pudo [acción]. Intenta de nuevo." | "No se pudo subir el archivo. Intenta de nuevo." |
| Éxito | Frase corta, sin "correctamente". | "Archivo subido.", "Perfil actualizado.", "Rol actualizado." |
| Validación | Qué falta y cuál es el límite. | "El título debe tener entre 5 y 120 caracteres." |
| Confirmación | Pregunta + consecuencia. | "¿Seguro que quieres cerrar este ticket? Una vez cerrado ya no podrás comentar ni adjuntar archivos." |
| Estado vacío | Qué no hay + qué puede hacer. | "Aún no tienes tickets. Puedes crear uno desde Nueva solicitud." |

Los mensajes de error no muestran detalles técnicos (códigos, nombres de tablas ni respuestas de la base), según los controles de seguridad del documento de requisitos.

## 5. Formato

- **Mayúsculas:** solo la primera letra del texto y los nombres propios. "Recuperar contraseña", no "Recuperar Contraseña".
- **Plurales:** sin paréntesis. "Ya alcanzaste el máximo de archivos de este tipo (3).", no "archivo(s)".
- **Botones:** verbo + objeto cuando el verbo solo no basta. "Enviar comentario", "Guardar cambios", "Subir archivo".
- **Títulos de pestaña:** "[Pantalla] - NTEK ServiceDesk Lite", con guion simple.
- **Cabecera de tablas:** "N.º" en vez de "ID".

## 6. Datos de demostración

- Los tickets de demostración son ficticios, pero se redactan como casos reales de soporte, con ortografía correcta (mayúscula inicial y tildes).
- No se dejan en la demo tickets con texto sin sentido, emojis ni pruebas de inyección de HTML. Esas pruebas quedan registradas en `docs/pruebas.md`.
- La ñ y las tildes se demuestran con texto real en español (por ejemplo, "No puedo cambiar mi contraseña").
- Los tickets de demostración no se borran: se reescriben su título y descripción, para conservar la cobertura de estados y prioridades y su historial.