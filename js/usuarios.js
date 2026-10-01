import { protegerRuta, activarBotonCerrarSesion } from './sesion.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { mostrarNotificacion } from './notificaciones.js';
import { supabase } from './supabase-client.js';

const rolActual = await protegerRuta(['admin']);

document.getElementById("header-placeholder").innerHTML = crearHeaderEquipo(rolActual);
activarBotonCerrarSesion();

const listaUsuarios = document.querySelector('#lista-usuarios');

const etiquetasRol = {
  cliente: 'Cliente',
  tecnico: 'Técnico',
  admin: 'Administrador'
};


function dibujarUsuarios(lista) {
    listaUsuarios.innerHTML = '';

    if (lista.length === 0) {
        mostrarEstadoVacio(listaUsuarios, 'No hay usuarios para mostrar.');
        return;
    }

    lista.forEach(usuario => {
        const item = document.createElement('li');
        item.className = 'tarjeta';

        item.innerHTML = `
      <h3>${usuario.full_name}</h3>
      <p>Empresa: ${usuario.company || 'Sin empresa'}</p>
      <p>Rol: ${etiquetasRol[usuario.role]}</p>
      <p>Estado: ${usuario.active ? 'Activo' : 'Inactivo'}</p>
    `;

        listaUsuarios.appendChild(item);
    });
}

async function traerUsuarios() {
    const { data: datosUsuarios, error: errorUsuarios } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

    if (errorUsuarios) {
    console.error(errorUsuarios);
    mostrarErrorRecuperable(listaUsuarios, 'No pudimos cargar los usuarios.', () => location.reload());
    return;
  }

    dibujarUsuarios(datosUsuarios);
}

await traerUsuarios();