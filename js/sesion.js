import { supabase } from './supabase-client.js';

export function activarBotonCerrarSesion() {
  const boton = document.querySelector('.header .boton');

  boton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('No se pudo cerrar sesión. Intenta de nuevo.');
      return;
    }

    window.location.href = '../publicas/login.html';
  });
}

export async function protegerRuta(rolesPermitidos) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '../publicas/login.html';
    return;
  }

  if (!rolesPermitidos) {
    return;
  }

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil || !rolesPermitidos.includes(perfil.role)) {
    window.location.href = '../publicas/login.html';
  }
}