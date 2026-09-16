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