import { protegerRuta, activarBotonCerrarSesion } from './sesion.js';
import { crearHeaderEquipo } from './header-equipo.js';
import { mostrarEstadoVacio, mostrarErrorRecuperable } from './estados.js';
import { mostrarNotificacion } from './notificaciones.js';
import { supabase } from './supabase-client.js';
import { escaparHTML } from './seguridad.js';

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

    const tabla = document.createElement('table');
    tabla.classList.add('tabla');
    tabla.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Nombre</th>
          <th scope="col">Empresa</th>
          <th scope="col">Teléfono</th>
          <th scope="col">Rol</th>
          <th scope="col">Estado</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const cuerpoTabla = tabla.querySelector('tbody');

        lista.forEach(usuario => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
          <td data-label="Nombre" class="celda-titulo">${escaparHTML(usuario.full_name)}</td>
          <td data-label="Empresa">${escaparHTML(usuario.company) || 'Sin empresa'}</td>
          <td data-label="Teléfono">${usuario.phone ? escaparHTML(usuario.phone) : 'Sin teléfono'}</td>
          <td data-label="Rol">
            <div class="celda-rol">
              <select aria-label="Rol de ${escaparHTML(usuario.full_name)}">
                <option value="cliente">Cliente</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
              <button class="boton boton-rol">Guardar rol</button>
            </div>
          </td>
          <td data-label="Estado">
            <span class="badge-estado ${usuario.active ? 'badge-estado--resuelto' : 'badge-estado--cerrado'}">
              ${usuario.active ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td data-label="Acciones" class="celda-acciones">
            <button class="boton boton-estado">${usuario.active ? 'Desactivar' : 'Activar'}</button>
          </td>
        `;

                fila.querySelector('select').value = usuario.role;
        const boton = fila.querySelector('.boton-rol');
        const botonEstado = fila.querySelector('.boton-estado');
        if (usuario.id === user.id) {
            fila.querySelector('select').disabled = true;
            boton.disabled = true;
            boton.textContent = 'Tu Cuenta';
            botonEstado.disabled = true;
        }
        boton.addEventListener('click', () => {
            const nuevoRol = fila.querySelector('select').value;
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

        cuerpoTabla.appendChild(fila);
    });

    listaUsuarios.appendChild(tabla);
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