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

export async function protegerRuta(rolesPermitidos, quitarCarga = true) { 
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '../publicas/login.html';
    return;
  }

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', session.user.id)
    .single();

  if (perfil && perfil.active === false) {
    await supabase.auth.signOut();
    window.location.href = '../publicas/login.html?cuenta=desactivada';
    return;
  }

  if (!rolesPermitidos) {
    if (quitarCarga) { 
      document.body.classList.remove('verificando');
    }
    return;
  }

  if (error || !perfil) {
    window.location.href = '../publicas/login.html';
    return;
  }

  if (!rolesPermitidos.includes(perfil.role)) {
    window.location.href = '../sistema/acceso-denegado.html';
    return;
  }

  if (quitarCarga) { 
    document.body.classList.remove('verificando');
  }
  return perfil.role;
}