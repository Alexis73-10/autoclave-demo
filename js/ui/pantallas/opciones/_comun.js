// Ayudantes comunes de las secciones de Opciones: matriz de permisos (permisos_opciones.py),
// piezas de interfaz repetidas y formato. Sin datos reales del equipo.
import { h } from '../../../core/dom.js';
import { t, idioma } from '../../../core/i18n.js';

/** Secciones, iconos (iconos/mono) y roles que las ven: ui_qml/domain/permisos_opciones.py. */
const TEC = ['tecnico', 'ingeniero'];
const TODOS = ['admin', 'tecnico', 'ingeniero'];
const GEST = ['admin', 'ingeniero'];
export const SECCIONES = [
  { clave: 'parametros_ciclo', icono: 'reloj', roles: TEC },
  { clave: 'parametros_sistema', icono: 'engranaje', roles: TODOS },
  { clave: 'entradas_salidas', icono: 'sensor_temperatura', roles: TEC },
  { clave: 'mantenimiento', icono: 'mantenimiento', roles: TEC },
  { clave: 'opciones_avanzadas', icono: 'programas', roles: TEC },
  { clave: 'usuarios', icono: 'usuarios', roles: TODOS },
  { clave: 'conectividad', icono: 'conectividad', roles: TODOS },
  { clave: 'fecha_hora', icono: 'reloj', roles: TODOS },
  { clave: 'info_sistema', icono: 'informacion', roles: TODOS },
  { clave: 'bitacora', icono: 'historial', roles: TODOS },
  { clave: 'respaldo', icono: 'carpeta', roles: TEC },
  { clave: 'catalogo_carga', icono: 'programas', roles: GEST },
];

export const ESTADOS_EDICION = ['PREPARACION', 'PREPARADO', 'FALLA'];

export function seccionesVisibles(rol) { return SECCIONES.filter((s) => rol && s.roles.includes(rol)); }

/** Primera sección editable del rol (el admin aterriza en Usuarios). */
export function seccionInicial(rol) {
  if (rol === 'admin') return 'usuarios';
  return seccionesVisibles(rol)[0]?.clave ?? null;
}

/**
 * Qué puede hacer `rol` en `seccion` con la máquina en `maquina`.
 * -> { ver, editar, motivo (clave i18n o '') }
 */
export function permiso(seccion, rol, maquina) {
  const s = SECCIONES.find((x) => x.clave === seccion);
  const ver = !!s && !!rol && s.roles.includes(rol);
  const enCiclo = maquina === 'CICLO';
  let editar = false, motivo = '';
  switch (seccion) {
    case 'parametros_ciclo':
      editar = rol === 'ingeniero' || (rol === 'tecnico' && ESTADOS_EDICION.includes(maquina));
      if (ver && !editar) motivo = 'opciones.edicion_bloqueada';
      break;
    case 'parametros_sistema':
      if (rol === 'admin') { editar = false; motivo = 'opciones.solo_lectura_rol'; }
      else { editar = !enCiclo; if (enCiclo) motivo = 'opciones.equipo_motivo_ciclo'; }
      break;
    case 'entradas_salidas':
    case 'mantenimiento':
    case 'opciones_avanzadas':
    case 'respaldo':
      editar = ver && !enCiclo;
      if (ver && !editar) motivo = 'opciones.edicion_bloqueada';
      break;
    case 'usuarios':
      editar = GEST.includes(rol);
      if (ver && !editar) motivo = 'gestion_usuarios.motivo_rol';
      break;
    case 'conectividad':
      editar = false; // la demo no envía correo; solo lectura para todos
      if (ver && !GEST.includes(rol)) motivo = 'conectividad.motivo_rol';
      break;
    case 'catalogo_carga':
      editar = ver;
      break;
    default: editar = false; // fecha_hora, info_sistema, bitacora: solo lectura
  }
  return { ver, editar, motivo };
}

// ---- Piezas de interfaz ----

export const pad2 = (n) => String(n).padStart(2, '0');
export const fechaIso = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
export const fechaHoraIso = (ms) => { const d = new Date(ms); return `${fechaIso(ms)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

export function nota(texto, clase = '') { return h('div', { class: `op-nota ${clase}`, text: texto }); }

/** Cabecera de subvista: «‹» + título + subtítulo (como OpcionesParametrosCiclo, vista sección). */
export function cabeceraSub({ titulo, sub, alVolver }) {
  return h('div', { class: 'op-sub' },
    h('button', { class: 'op-sub-volver', type: 'button', 'aria-label': t('menu.volver'), onclick: () => alVolver?.() },
      h('span', { class: 'op-chev-izq' })),
    h('div', { class: 'op-sub-textos' }, h('div', { class: 'op-sub-titulo', text: titulo }), sub ? h('div', { class: 'op-sub-sub', text: sub }) : null));
}

/** Fila de lista con «›» (alto 92-112): nombre, valor opcional y chevron. */
export function filaNav({ titulo, subtitulo, valor, unidad, alto, alToque, deshabilitada }) {
  return h('button', { class: `op-fila${alto ? ` ${alto}` : ''}${deshabilitada ? ' inactiva' : ''}`, type: 'button', onclick: () => alToque?.() },
    h('span', { class: 'op-fila-textos' }, h('span', { class: 'op-fila-titulo', text: titulo }), subtitulo ? h('span', { class: 'op-fila-sub', text: subtitulo }) : null),
    valor != null ? h('span', { class: 'op-fila-valor' }, h('b', { text: valor }), unidad ? ` ${unidad}` : '') : null,
    h('span', { class: 'op-chev-der' }));
}

/** Tarjeta de submenú (alto 200, radio 18): título, descripción y «›». */
export function tarjetaSubmenu({ titulo, descripcion, alToque, ancho }) {
  return h('button', { class: `op-tarjeta-sub${ancho ? ' ancha' : ''}`, type: 'button', onclick: () => alToque?.() },
    h('span', { class: 'op-fila-textos' }, h('span', { class: 'op-tarjeta-sub-titulo', text: titulo }), h('span', { class: 'op-tarjeta-sub-desc', text: descripcion })),
    h('span', { class: 'op-chev-der' }));
}

/** Etiqueta pequeña tipo chip (estado Activo, Válido...). */
export function chip(texto, tono = 'ok') { return h('span', { class: `op-chip ${tono}`, text: texto }); }

export function rolVisible(rol) { return t(`roles.${rol}`); }

/** Marca de tiempo corta. */
export function ahoraMs() { return Date.now(); }

/** Texto propio de la demo (sin clave real): {es, en}. */
export const L = (o) => o[idioma()] ?? o.es;

/** Casilla (como las de Respaldo): alToggle(nuevo). */
export function casilla({ texto, marcado, alCambiar, deshabilitada }) {
  let v = !!marcado;
  const caja = h('span', { class: 'op-casilla-caja' });
  const el = h('button', { class: `op-casilla${deshabilitada ? ' inactiva' : ''}`, type: 'button',
    onclick: () => { v = !v; pintar(); alCambiar?.(v); } }, caja, h('span', { class: 'op-casilla-texto', text: texto }));
  function pintar() { caja.classList.toggle('on', v); }
  pintar();
  return el;
}

/** Fila de dos columnas rótulo / valor (solo lectura). */
export function filaKV(rotulo, valor) {
  return h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: rotulo }), h('div', { class: 'op-kv-valor', text: valor }));
}
