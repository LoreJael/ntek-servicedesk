import { supabase } from './supabase-client.js';
import { mostrarNotificacion } from './notificaciones.js';

const formRegistro = document.getElementById('form-registro');
const mensaje = document.getElementById('mensaje');

formRegistro.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const empresa = document.getElementById('empresa').value;
  const telefono = document.getElementById('telefono').value;
  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;
  const confirmarPassword = document.getElementById('confirmar-password').value;

  if (password !== confirmarPassword) {
    mensaje.textContent = 'Las contraseñas no coinciden.';
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: password,
    options: {
      data: {
        full_name: nombre,
        phone: telefono,
        company: empresa
      }
    }
  });

  if (error) {
    mensaje.textContent = 'No se pudo crear la cuenta. Intenta de nuevo.';
    return;
  }

  if (data.session) {
    // Si la confirmación de correo está desactivada en tu proyecto,
    // signUp ya devuelve una sesión activa y puedes entrar directo.
    window.location.href = '../cliente/panel.html';
    return;
  }

  // Si la confirmación de correo está activada, no hay sesión todavía:
  // el usuario tiene que hacer clic en el correo antes de poder entrar.
 mostrarNotificacion('Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.', 'exito');
formRegistro.reset();
});