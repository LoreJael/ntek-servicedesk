import { supabase } from './supabase-client.js';

const formSolicitar = document.getElementById('form-solicitar');
const formNuevaPassword = document.getElementById('form-nueva-password');
const mensaje = document.getElementById('mensaje');


const urlRecuperacion = window.location.origin + '/pantallas/publicas/recuperar.html';

formSolicitar.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const correo = document.getElementById('correo').value;

  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: urlRecuperacion
  });

  if (error) {
    mensaje.textContent = 'No se pudo enviar el correo. Intenta de nuevo.';
    return;
  }

  mensaje.textContent = 'Si el correo existe, te enviamos un enlace de recuperación.';
  formSolicitar.reset();
});

// Supabase dispara este evento cuando detecta, en la URL, la sesión
// temporal que viene del enlace de recuperación.
supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'PASSWORD_RECOVERY') {
    formSolicitar.hidden = true;
    formNuevaPassword.hidden = false;
  }
});

formNuevaPassword.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nuevaPassword = document.getElementById('nueva-password').value;
  const confirmarPassword = document.getElementById('confirmar-nueva-password').value;

  if (nuevaPassword !== confirmarPassword) {
    mensaje.textContent = 'Las contraseñas no coinciden.';
    return;
  }

  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });

  if (error) {
    mensaje.textContent = 'No se pudo actualizar la contraseña.';
    return;
  }

  mensaje.textContent = 'Contraseña actualizada. Ya puedes iniciar sesión.';
  setTimeout(() => { window.location.href = 'login.html'; }, 2000);
});