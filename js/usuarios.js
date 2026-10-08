import { protegerRuta, activarBotonCerrarSesion } from './sesion.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { mostrarNotificacion } from './notificaciones.js';
import { supabase } from './supabase-client.js';

const rolActual = await protegerRuta(['admin'], false);

document.getElementById("header-placeholder").innerHTML = crearHeaderEquipo(rolActual);
const { data: { user } } = await supabase.auth.getUser();
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
      <div class="form-grupo">
        <label>Rol</label>
        <select>
          <option value="cliente">Cliente</option>
          <option value="tecnico">Técnico</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <button class="boton">Guardar rol</button>
      <button class="boton boton-rol">Guardar rol</button>
      <p>Estado: ${usuario.active ? 'Activo' : 'Inactivo'}</p>
      <button class="boton boton-estado">${usuario.active ? 'Desactivar' : 'Activar'}</button>
    `;

        item.querySelector('select').value = usuario.role;
        const boton = item.querySelector('.boton-rol');
        const botonEstado = item.querySelector('.boton-estado');
        if (usuario.id === user.id) {
            item.querySelector('select').disabled = true;
            boton.disabled = true;
            boton.textContent = 'Tu Cuenta';
            botonEstado.disabled = true;
        }
        boton.addEventListener('click', () => {
            const nuevoRol = item.querySelector('select').value;
            cambiarRol(usuario.id, nuevoRol);
        });

        botonEstado.addEventListener('click', () => {
            const nuevoEstado = !usuario.active;

            if (nuevoEstado === false) {
                const confirmado = confirm(`¿Seguro que quieres desactivar a ${usuario.full_name}? No podrá iniciar sesión.`);
                if (!confirmado) return;
            }

            cambiarEstado(usuario.id, nuevoEstado);
        });

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

async function cambiarRol(idUsuario, nuevoRol) {

    const { data, error } = await supabase
        .from('profiles')
        .update({ role: nuevoRol })
        .eq('id', idUsuario)
        .select();

    if (error) {
        mostrarNotificacion('No se pudo cambiar el rol. Intenta de nuevo.', 'error');
        return;
    }


    if (data.length === 0) {
        mostrarNotificacion('No se pudo cambiar el rol.', 'error');
        return;
    }

    mostrarNotificacion('Rol actualizado correctamente.', 'exito');
    await traerUsuarios();
}

await traerUsuarios();

document.body.classList.remove('verificando');

async function cambiarEstado(idUsuario, nuevoEstado) {

    const { data, error } = await supabase
        .from('profiles')
        .update({ active: nuevoEstado })
        .eq('id', idUsuario)
        .select();

    if (error) {
        mostrarNotificacion('No se pudo cambiar el estado. Intenta de nuevo.', 'error');
        return;
    }


    if (data.length === 0) {
        mostrarNotificacion('No se pudo cambiar el estado.', 'error');
        return;
    }

    mostrarNotificacion('Estado actualizado correctamente.', 'exito');
    await traerUsuarios();
}