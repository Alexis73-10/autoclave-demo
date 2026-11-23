// Pantalla Nuevo usuario (NuevoUsuario.qml): alta de un usuario de DEMOSTRACIÓN. No hay contraseña real:
// se guarda nombre, usuario, rol y estado (js/core/sesion.js › guardarUsuarios).
// Vertical: como el real (avatar a la izquierda y campos a la derecha; en celular, avatar arriba).
// Horizontal: encabezado de la tarjeta y avatar a un lado, formulario desplazable al otro (solo CSS, B5).
import { h, iconoMono } from '../../core/dom.js';
import { t, hora as horaTxt } from '../../core/i18n.js';
import { rol as rolActual, usuarioActual, usuarios, guardarUsuarios, PIN_DEMO } from '../../core/sesion.js';
import { abrirAlfanumerico } from '../../core/teclado.js';
import * as router from '../../core/router.js';
import { crearCampoFormulario } from '../componentes/campo_formulario.js';
import { crearDesplegable } from '../componentes/desplegable.js';
import { crearFilaInterruptor } from '../componentes/fila_interruptor.js';
import { crearBotonFormulario } from '../componentes/boton_formulario.js';
import { abrirDialogoConfirmacion } from '../componentes/dialogo_confirmacion.js';
import { ROLES_CREABLES } from './opciones/usuarios.js';
import { registrar } from './opciones/_bitacora.js';
import { rolVisible, L } from './opciones/_comun.js';

export function crear() {
  const datos = { nombre: '', usuario: '', rol: undefined, activo: true };
  const creables = ROLES_CREABLES[rolActual()] ?? [];
  const errores = {};

  const campo = (clave, etiqueta, marcador, maxLargo) => {
    const c = crearCampoFormulario({ etiqueta, marcador, valor: '',
      alTocar: () => abrirAlfanumerico({ titulo: etiqueta, valor: datos[clave], maxLargo, campo: c.el, alEntregar: (v) => { datos[clave] = v.trim(); c.actualizar({ valor: datos[clave], error: '' }); } }) });
    return c;
  };
  const cNombre = campo('nombre', t('formulario.nombre_completo'), t('usuarios.marcador_nombre'), 60);
  const cUsuario = campo('usuario', t('formulario.nombre_usuario'), t('formulario.nombre_usuario'), 20);
  const ddRol = crearDesplegable({ opciones: creables.map((r) => ({ valor: r, texto: rolVisible(r) })), valor: undefined, textoSinValor: t('usuarios.seleccione_rol'),
    tituloLista: t('formulario.rol'), alElegir: (v) => { datos.rol = v; ddRol.actualizar({ valor: v }); rolError.textContent = ''; } });
  const rolError = h('div', { class: 'op-nu-error' });
  const estado = crearFilaInterruptor({ etiqueta: t('formulario.activo'), marcado: true, ultima: true, alAlternar: (v) => { datos.activo = v; } });

  function validar() {
    let ok = true;
    if (!datos.nombre) { cNombre.actualizar({ error: t('validacion.obligatorio') }); ok = false; }
    if (!/^[A-Za-z0-9._-]{3,20}$/.test(datos.usuario)) { cUsuario.actualizar({ error: t('validacion.formato', { min: 3, max: 20 }) }); ok = false; }
    else if (usuarios().some((u) => u.usuario.toLowerCase() === datos.usuario.toLowerCase())) { cUsuario.actualizar({ error: t('usuarios.usuario_existe') }); ok = false; }
    if (!datos.rol) { rolError.textContent = t('validacion.rol_invalido'); ok = false; }
    else if (!creables.includes(datos.rol)) { rolError.textContent = t('usuarios.rol_no_creable'); ok = false; }
    return ok;
  }
  function guardar() {
    if (!validar()) return;
    guardarUsuarios([...usuarios(), { usuario: datos.usuario, nombre: datos.nombre, rol: datos.rol, activo: datos.activo, sistema: false }]);
    registrar('usuario_creado', { usuario: usuarioActual()?.usuario ?? '', entidad: datos.usuario, nuevo: rolVisible(datos.rol) });
    router.pop();
  }
  const sucio = () => !!(datos.nombre || datos.usuario || datos.rol);
  function salir() {
    if (!sucio()) { router.pop(); return; }
    abrirDialogoConfirmacion({ mensaje: `${t('usuarios.descartar_titulo')}\n${t('usuarios.descartar_mensaje')}`, textoConfirmar: t('acciones.descartar'),
      textoCancelar: t('usuarios.seguir_editando'), alConfirmar: () => router.pop() });
  }

  const reloj = h('div', { class: 'op-nu-reloj' });
  const fecha = h('div', { class: 'op-nu-fecha' });
  function pintarReloj() { const d = new Date(); reloj.textContent = horaTxt(d); fecha.textContent = `${d.getDate()} ${t(`fecha.meses.${d.getMonth()}`)}  -  ${d.getFullYear()}`; }
  pintarReloj();
  const id = setInterval(pintarReloj, 1000);

  const guardarBtn = crearBotonFormulario({ texto: t('acciones.guardar_usuario'), primario: true, alPulsar: guardar });
  const cancelarBtn = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: salir });
  const icoBarra = (nombre) => iconoMono(nombre, { tam: null, clase: 'op-ico-pie', color: 'var(--c-icono-barra-menu)' });
  const el = h('div', { class: 'op op-nu' },
    h('div', { class: 'op-nu-barra' }, h('img', { class: 'op-nu-logo', src: 'assets/logo/logo-especifika-blanco.svg', alt: '' }),
      h('div', { class: 'op-nu-hora' }, reloj, fecha)),
    h('div', { class: 'op-nu-tarjeta desplazable' },
      h('div', { class: 'op-nu-cab' },
        h('button', { class: 'op-nu-volver', type: 'button', 'aria-label': t('menu.volver'), onclick: salir }, h('span', { class: 'op-chev-izq' })),
        h('div', { class: 'op-nu-titulo', text: t('usuarios.titulo_nuevo') })),
      h('div', { class: 'op-nu-ident' },
        h('div', { class: 'op-nu-avatar' }, iconoMono('usuario', { tam: null, clase: 'op-nu-avatar-ico', color: 'var(--c-texto-sobre-accion)' }))),
      h('div', { class: 'op-nu-form desplazable' },
        h('div', { class: 'op-nu-campos' },
          h('div', { class: 'op-nu-campo' }, cNombre.el),
          h('div', { class: 'op-nu-campo' }, cUsuario.el),
          h('div', { class: 'op-nu-campo rol' }, h('div', { class: 'cf-etiqueta', text: t('formulario.rol') }), h('div', { class: 'op-nu-rol' }, ddRol.el), rolError),
          h('div', { class: 'op-nu-campo' }, estado.el),
          h('div', { class: 'op-nota', text: L({ es: `Demostración: la contraseña de todas las cuentas es ${PIN_DEMO}.`, en: `Demo: every account password is ${PIN_DEMO}.` }) })),
        h('div', { class: 'op-nu-botones' }, cancelarBtn.el, guardarBtn.el))),
    h('div', { class: 'op-barra nu' },
      h('button', { class: 'op-celda mitad', type: 'button', 'aria-label': t('menu.volver'), onclick: salir }, icoBarra('flecha_atras')),
      h('i', { class: 'op-div' }),
      h('button', { class: 'op-celda mitad', type: 'button', onclick: async () => { const app = await import('../../app.js'); app.irAPrincipal(); } }, icoBarra('casa'))));
  return { el, destruir() { clearInterval(id); } };
}
