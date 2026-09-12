// Datos simulados para el panel de cliente.
// Mientras no tengamos conexión a Supabase, estos datos representan
// lo que en el futuro vendrá de la base de datos real.

export const perfilActual = {
  id: 1,
  full_name: "María Fernández",
  email: "contacto@fairypole.cl",
  phone: "+56 9 1234 5678",
  company: "Fairy Pole",
  role: "cliente",
  active: true,
  created_at: "2026-08-15"
};

export const ticketsSimulados = [
  {
    id: 101,
    created_by: 1,
    assigned_to: 2,
    title: "No podemos acceder al sistema de facturación interno",
    description: "Desde ayer en la mañana el sistema de facturación muestra error 500 al intentar iniciar sesión. Afecta a todo el equipo de administración.",
    category: "Software",
    priority: "critica",
    status: "en_progreso",
    created_at: "2026-09-08T09:15:00",
    updated_at: "2026-09-09T11:30:00"
  },
  {
    id: 102,
    created_by: 1,
    assigned_to: 2,
    title: "Impresora de bodega no reconoce la red",
    description: "La impresora HP de la bodega dejó de aparecer en la lista de dispositivos de red desde el cambio de router la semana pasada.",
    category: "Hardware",
    priority: "media",
    status: "en_espera",
    created_at: "2026-09-05T14:20:00",
    updated_at: "2026-09-07T10:00:00"
  },
  {
    id: 103,
    created_by: 1,
    assigned_to: null,
    title: "Solicitud de aumento de licencias de correo",
    description: "Necesitamos 3 licencias adicionales de correo corporativo para los nuevos integrantes del equipo de ventas.",
    category: "Cuenta",
    priority: "baja",
    status: "nuevo",
    created_at: "2026-09-10T08:45:00",
    updated_at: "2026-09-10T08:45:00"
  },
  {
    id: 104,
    created_by: 1,
    assigned_to: 3,
    title: "Lentitud general en los equipos del segundo piso",
    description: "Varios computadores del segundo piso están funcionando muy lentos desde la última actualización de antivirus.",
    category: "Software",
    priority: "media",
    status: "en_revision",
    created_at: "2026-09-09T16:00:00",
    updated_at: "2026-09-09T16:00:00"
  },
  {
    id: 105,
    created_by: 1,
    assigned_to: 2,
    title: "Configuración de VPN para trabajo remoto",
    description: "Se solicitó la configuración de acceso VPN para dos colaboradores que empiezan modalidad remota este mes.",
    category: "Red",
    priority: "media",
    status: "resuelto",
    created_at: "2026-08-28T10:00:00",
    updated_at: "2026-09-02T09:00:00"
  },
  {
    id: 106,
    created_by: 1,
    assigned_to: 2,
    title: "Recuperación de contraseña de administrador local",
    description: "Se perdió el acceso administrador de uno de los equipos de diseño y se requiere restablecerlo.",
    category: "Cuenta",
    priority: "alta",
    status: "cerrado",
    created_at: "2026-08-20T09:30:00",
    updated_at: "2026-08-21T12:00:00"
  }
];

export const comentariosSimulados = [
  {
    id: 201,
    ticket_id: 101,
    author_id: 2,
    body: "Estamos revisando el error 500 con el equipo de base de datos, les avisamos apenas tengamos una causa.",
    is_internal: false,
    created_at: "2026-09-08T15:00:00"
  },
  {
    id: 202,
    ticket_id: 101,
    author_id: 1,
    body: "Gracias, quedamos atentos. Nos urge porque afecta la facturación del mes.",
    is_internal: false,
    created_at: "2026-09-08T15:20:00"
  },
  {
    id: 203,
    ticket_id: 101,
    author_id: 2,
    body: "El error se debe a un certificado vencido en el servidor de base de datos, pendiente coordinar ventana de mantenimiento.",
    is_internal: true,
    created_at: "2026-09-09T09:00:00"
  },
  {
    id: 204,
    ticket_id: 104,
    author_id: 3,
    body: "Confirmamos que el problema es la última actualización del antivirus, estamos revirtiendo el cambio en los equipos afectados.",
    is_internal: false,
    created_at: "2026-09-09T16:00:00"
  },
  {
    id: 205,
    ticket_id: 105,
    author_id: 1,
    body: "Perfecto, ya probamos la VPN desde ambos equipos y está funcionando bien.",
    is_internal: false,
    created_at: "2026-09-02T09:00:00"
  }
];