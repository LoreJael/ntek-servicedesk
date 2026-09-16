export const perfilesSimulados = [
  { id: 'c1', full_name: 'Javiera Soto',    company: 'Constructora Andes',    role: 'cliente' },
  { id: 'c2', full_name: 'Rodrigo Muñoz',   company: 'Distribuidora Maule',   role: 'cliente' },
  { id: 'c3', full_name: 'Camila Reyes',    company: 'Clínica Bío Salud',     role: 'cliente' },
  { id: 'c4', full_name: 'Ignacio Vidal',   company: 'Panadería El Trigal',   role: 'cliente' },
  { id: 't1', full_name: 'Felipe Rojas',    company: null, role: 'tecnico' },
  { id: 't2', full_name: 'Daniela Contreras', company: null, role: 'tecnico' }
];

export const ticketsEquipoSimulados = [
  {
    id: 101, created_by: 'c1', assigned_to: null,
    title: 'No puedo acceder a mi cuenta', category: 'Accesos',
    priority: 'alta', status: 'nuevo',
    created_at: '2026-09-16T09:12:00', updated_at: '2026-09-16T09:12:00'
  },
  {
    id: 102, created_by: 'c2', assigned_to: 't1',
    title: 'Error al generar boleta electrónica', category: 'Facturación',
    priority: 'media', status: 'en_progreso',
    created_at: '2026-09-14T11:30:00', updated_at: '2026-09-15T16:05:00'
  },
  {
    id: 103, created_by: 'c3', assigned_to: null,
    title: 'Sistema se cae al subir imágenes', category: 'Soporte técnico',
    priority: 'critica', status: 'nuevo',
    created_at: '2026-09-16T08:47:00', updated_at: '2026-09-16T08:47:00'
  },
  {
    id: 104, created_by: 'c1', assigned_to: 't2',
    title: 'Solicitud de nueva licencia de usuario', category: 'Accesos',
    priority: 'baja', status: 'en_espera',
    created_at: '2026-09-12T10:00:00', updated_at: '2026-09-14T09:20:00'
  },
  {
    id: 105, created_by: 'c4', assigned_to: 't1',
    title: 'Reporte mensual no coincide con ventas', category: 'Soporte técnico',
    priority: 'media', status: 'en_revision',
    created_at: '2026-09-13T15:22:00', updated_at: '2026-09-15T10:10:00'
  },
  {
    id: 106, created_by: 'c2', assigned_to: null,
    title: 'Consulta sobre plan contratado', category: 'Consulta general',
    priority: 'baja', status: 'nuevo',
    created_at: '2026-09-15T13:40:00', updated_at: '2026-09-15T13:40:00'
  },
  {
    id: 107, created_by: 'c3', assigned_to: 't2',
    title: 'Recuperar archivos eliminados por error', category: 'Soporte técnico',
    priority: 'alta', status: 'resuelto',
    created_at: '2026-09-10T09:00:00', updated_at: '2026-09-13T17:00:00'
  },
  {
    id: 108, created_by: 'c4', assigned_to: 't1',
    title: 'Actualizar datos de la empresa', category: 'Perfil',
    priority: 'baja', status: 'cerrado',
    created_at: '2026-09-09T09:00:00', updated_at: '2026-09-11T12:00:00'
  }
];