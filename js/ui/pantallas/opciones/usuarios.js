// Opciones › Usuarios (OpcionesUsuarios.qml): pestañas Usuarios / Operadores. Cuentas de demostración de
// js/core/sesion.js. Reglas del software: nadie sobre sí mismo, cuentas del sistema protegidas, el equipo
// no queda sin ingeniero activo, roles creables por rol (ROLES_CREABLES).
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { on } from '../../../core/eventos.js';
import { abrirModal } from '../../../core/capas.js';
import { usuarios, guardarUsuarios, operadores, guardarOperadores } from '../../../core/sesion.js';
import { abrirAlfanumericoAccion } from '../../../core/teclado.js';
import * as router from '../../../core/router.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { crearDesplegable } from '../../componentes/desplegable.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { chip, rolVisible, fechaHoraIso, L } from './_comun.js';

export const ROLES_CREABLES = { ingeniero: ['admin', 'tecnico', 'ingeniero'], admin: ['admin', 'tecnico'], tecnico: [] };

export function crear(ctx) {
  const p = ctx.permiso();
  const gestiona = p.editar;
  let pestana = 'usuarios';
  let sel = null;                       // usuario (clave) u operador (id) elegido
  const lista = h('div', { class: 'op-us-lista desplazable' });
  const acciones = h('div', { class: 'op-us-acciones' });
  const pie = h('div', { class: 'op-us-pie' });
  const nota = h('div', { class: 'op-nota' });
  const msg = h('div', { class: 'op-nota error' });

  const tabs = crearSelectorSegmentos({ valor: 'usuarios', opciones: [
    { valor: 'usuarios', etiqueta: t('gestion_usuarios.pestana_usuarios') }, { valor: 'operadores', etiqueta: t('gestion_usuarios.pestana_operadores') }],
  alElegir: (v) => { pestana = v; sel = null; msg.textContent = ''; pintar(); } });

  const visibles = () => usuarios().filter((u) => !u.eliminado);
  const ingenierosActivos = () => visibles().filter((u) => u.rol === 'ingeniero' && u.activo).length;
  const creables = () => ROLES_CREABLES[ctx.rol] ?? [];
  const obj = () => visibles().find((u) => u.usuario === sel);

  /** Motivo (clave i18n) por el que la acción no procede sobre el usuario elegido, o ''. */
  function motivoBloqueo(u, accion) {
    if (!gestiona) return 'gestion_usuarios.motivo_rol';
    if (!u) return '';
    if (u.usuario === ctx.usuario && accion !== 'restablecer') return 'gestion_usuarios.motivo_propio';
    if (u.usuario === ctx.usuario && accion === 'restablecer') return 'gestion_usuarios.err_propia_clave';
    if (!creables().includes(u.rol)) return 'gestion_usuarios.motivo_rol_objetivo';
    if (u.sistema && accion !== 'restablecer') return 'gestion_usuarios.motivo_cuenta_sistema';
    if (u.rol === 'ingeniero' && u.activo && ingenierosActivos() <= 1 && ['desactivar', 'eliminar', 'rol'].includes(accion)) return 'gestion_usuarios.err_ultimo_ingeniero';
    return '';
  }

  function actualizarUsuario(u, cambios) {
    guardarUsuarios(usuarios().map((x) => (x.usuario === u.usuario ? { ...x, ...cambios } : x)));
  }
  function ejecutar(accion) {
    const u = obj(); if (!u) return;
    const m = motivoBloqueo(u, accion);
    if (m) { msg.textContent = t(m); return; }
    msg.textContent = '';
    if (accion === 'restablecer') {
      abrirDialogoConfirmacion({ mensaje: t('gestion_usuarios.confirmar_restablecer', { usuario: u.usuario }), alConfirmar: () => {
        ctx.bitacora('clave_restablecida', { entidad: u.usuario });
        ctx.avisar(L({ es: 'Contraseña restablecida (en la demo siempre es 1234)', en: 'Password reset (in the demo it is always 1234)' }));
      } });
    } else if (accion === 'desactivar') {
      const act = u.activo;
      abrirDialogoConfirmacion({ mensaje: t(act ? 'gestion_usuarios.confirmar_desactivar' : 'gestion_usuarios.confirmar_reactivar', { usuario: u.usuario }), alConfirmar: () => {
        actualizarUsuario(u, { activo: !act }); ctx.bitacora(act ? 'usuario_desactivado' : 'usuario_reactivado', { entidad: u.usuario });
      } });
    } else if (accion === 'eliminar') {
      abrirDialogoConfirmacion({ mensaje: t('usuarios_cuenta.confirmar_eliminar', { usuario: u.usuario }), alConfirmar: () => {
        actualizarUsuario(u, { eliminado: true, activo: false }); sel = null; ctx.bitacora('usuario_eliminado', { entidad: u.usuario });
      } });
    } else if (accion === 'rol') cambiarRol(u);
  }

  function cambiarRol(u) {
    let nuevo = null, cerrar;
    const opciones = creables().filter((r) => r !== u.rol).map((r) => ({ valor: r, texto: rolVisible(r) }));
    const dd = crearDesplegable({ opciones, valor: undefined, textoSinValor: t('formulario.rol'), tituloLista: t('formulario.rol'), alElegir: (v) => { nuevo = v; dd.actualizar({ valor: v }); } });
    const ok = crearBotonFormulario({ texto: t('acciones.confirmar'), primario: true, alPulsar: () => {
      if (!nuevo) return;
      cerrar();
      abrirDialogoConfirmacion({ mensaje: t('usuarios_cuenta.confirmar_rol', { usuario: u.usuario, anterior: rolVisible(u.rol), nuevo: rolVisible(nuevo) }), alConfirmar: () => {
        actualizarUsuario(u, { rol: nuevo }); ctx.bitacora('usuario_rol_cambiado', { entidad: u.usuario, anterior: rolVisible(u.rol), nuevo: rolVisible(nuevo) });
      } });
    } });
    const no = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });
    cerrar = abrirModal(h('div', { class: 'op-modal ancho' }, h('div', { class: 'op-modal-titulo', text: t('usuarios_cuenta.elegir_rol', { usuario: u.usuario, rol: rolVisible(u.rol) }) }),
      dd.el, h('div', { class: 'op-modal-botones' }, no.el, ok.el)), { cerrarAlTocarVelo: true });
  }

  function pintarUsuarios() {
    nota.textContent = t('gestion_usuarios.nota');
    const u = obj();
    lista.replaceChildren(...visibles().map((x, i) => h('button', { class: `op-us-fila${x.usuario === sel ? ' sel' : ''}`, type: 'button', onclick: () => { sel = x.usuario; msg.textContent = ''; pintar(); } },
      h('span', { class: 'op-fila-textos' },
        h('span', { class: 'op-us-nombre' }, h('b', { text: x.nombre }), ` · ${x.usuario}`),
        h('span', { class: 'op-fila-sub', text: `${rolVisible(x.rol)} · ${t('gestion_usuarios.ultimo_ingreso')}: ${x.ultimo ? fechaHoraIso(x.ultimo) : (x.sistema ? fechaHoraIso(Date.now() - (i + 1) * 3600000 * 5) : t('gestion_usuarios.nunca'))}` })),
      x.activo ? chip(t('gestion_usuarios.activo'), 'ok') : h('span', { class: 'op-us-desact', text: t('gestion_usuarios.desactivado') }))));
    const btn = (texto, accion) => crearBotonFormulario({ texto, habilitado: gestiona && !!u, alPulsar: () => ejecutar(accion) }).el;
    acciones.replaceChildren(btn(t('gestion_usuarios.restablecer'), 'restablecer'), btn(u && !u.activo ? t('gestion_usuarios.reactivar') : t('gestion_usuarios.desactivar'), 'desactivar'),
      btn(t('usuarios_cuenta.cambiar_rol'), 'rol'), btn(t('usuarios_cuenta.eliminar'), 'eliminar'));
    pie.replaceChildren(crearBotonFormulario({ texto: t('gestion_usuarios.nuevo'), primario: true, habilitado: gestiona, alPulsar: () => router.push('nuevoUsuario') }).el,
      crearBotonFormulario({ texto: t('usuarios_cuenta.mi_clave'), primario: true, alPulsar: () => router.push('cambioClave', { voluntario: true }) }).el);
    if (!gestiona) msg.textContent = t('gestion_usuarios.motivo_rol');
  }

  function pintarOperadores() {
    nota.textContent = '';
    const ops = operadores();
    const o = ops.find((x) => x.id === sel);
    lista.replaceChildren(...(ops.length === 0 ? [h('div', { class: 'op-vacio', text: t('gestion_usuarios.sin_operadores') })]
      : ops.map((x) => h('button', { class: `op-us-fila${x.id === sel ? ' sel' : ''}`, type: 'button', onclick: () => { sel = x.id; pintar(); } },
        h('span', { class: 'op-fila-textos' }, h('span', { class: 'op-us-nombre' }, h('b', { text: x.nombre }))),
        x.activo ? chip(t('gestion_usuarios.activo'), 'ok') : h('span', { class: 'op-us-desact', text: t('gestion_usuarios.desactivado') })))));
    acciones.replaceChildren(crearBotonFormulario({ texto: o && !o.activo ? t('gestion_usuarios.reactivar') : t('gestion_usuarios.desactivar'), habilitado: gestiona && !!o,
      alPulsar: () => { guardarOperadores(ops.map((x) => (x.id === o.id ? { ...x, activo: !x.activo } : x))); ctx.bitacora(o.activo ? 'operador_desactivado' : 'operador_reactivado', { entidad: o.nombre }); pintar(); } }).el);
    pie.replaceChildren(crearBotonFormulario({ texto: t('gestion_usuarios.agregar_operador'), primario: true, habilitado: gestiona, alPulsar: () => {
      abrirAlfanumericoAccion({ titulo: t('gestion_usuarios.nombre_operador'), valor: '', maxLargo: 40, alEntregar: (v) => {
        const n = v.trim(); if (!n) return;
        if (operadores().some((x) => x.nombre.toLowerCase() === n.toLowerCase())) { msg.textContent = t('gestion_usuarios.err_operador_existe'); return; }
        guardarOperadores([...operadores(), { id: Math.max(0, ...operadores().map((x) => x.id)) + 1, nombre: n, activo: true }]);
        ctx.bitacora('operador_creado', { entidad: n }); pintar();
      } });
    } }).el);
  }

  function pintar() {
    tabs.actualizar({ valor: pestana });
    if (pestana === 'usuarios') pintarUsuarios(); else pintarOperadores();
    acciones.style.display = pestana === 'usuarios' || true ? '' : 'none';
    pie.classList.toggle('uno', pestana !== 'usuarios');
    acciones.classList.toggle('uno', pestana !== 'usuarios');
  }

  const el = h('div', { class: 'op-us' }, tabs.el, nota, lista, msg, acciones, pie);
  pintar();
  const quitar = on('sesion', () => pintar());
  return { el, destruir() { quitar(); } };
}
