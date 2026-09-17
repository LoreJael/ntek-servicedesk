import { supabase } from './supabase-client.js';

const formLogin = document.getElementById('form-login');

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: password
  });

  if (error) {
    alert('Correo o contraseña incorrectos.');
    return;
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (errorPerfil) {
    alert('No se pudo obtener tu perfil.');
    return;
  }

   if (perfil.role === 'cliente') {
    window.location.href = '../cliente/panel.html';
  } else if (perfil.role === 'tecnico' || perfil.role === 'admin') {
    window.location.href = '../equipo/bandeja-global.html';
  }
});