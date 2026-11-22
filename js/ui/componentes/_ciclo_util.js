// Ayudantes internos del frente ciclo (no es un componente publicado).
// Geometría: todo en px de diseño del lienzo 1200x1920; los números del QML
// (u del mockup 1196x1917) se usan tal cual (diferencia 0,3 %).
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import es from '../../../i18n/es.js';
import en from '../../../i18n/en.js';

// Distancia de la parte superior de una caja de texto con line-height: 1 a la
// línea base, en fracción del tamaño (métricas hhea: Montserrat 968/251,
// Arial 905/212, Tahoma 1000/207). El QML ubica los textos por línea base.
const BASE = { mont: 0.858, num: 0.846, reloj: 0.897 };
const FAMILIA = { mont: 'var(--familia)', num: 'var(--fc-familia-num)', reloj: 'var(--familia-reloj)' };

/**
 * Texto ubicado como el componente Texto del QML: por línea base (bl) y por centro
 * (cx), borde izquierdo (lx) o borde derecho (rx). Opcional `ancho` (px): si el texto
 * no cabe, baja la letra hasta 14 px (HorizontalFit; nunca se recorta).
 */
export function txt(texto, { cx, lx, rx, bl = 0, tam = 16, peso = 400, color = 'var(--c-texto-primario)',
  familia = 'mont', ancho = 0, clase = '', espaciado = 0 } = {}) {
  const el = h('div', { class: `fc-txt ${clase}` });
  el.textContent = texto ?? '';
  const s = el.style;
  s.fontFamily = FAMILIA[familia] || familia;
  s.fontWeight = peso;
  s.color = color;
  if (espaciado) s.letterSpacing = `${espaciado}px`;
  el._fc = { tam, familia, ancho, peso, bl, cx, lx, rx, espaciado };
  aplicarTam(el, tam);
  if (lx != null) s.left = `${lx}px`;
  else if (rx != null) { s.right = 'auto'; s.left = `${rx}px`; s.transform = 'translateX(-100%)'; }
  else { s.left = `${cx}px`; s.transform = 'translateX(-50%)'; }
  if (ancho) { s.maxWidth = 'none'; ajustar(el); }
  return el;
}

function aplicarTam(el, tam) {
  const f = el._fc;
  el.style.fontSize = `${tam}px`;
  el.style.top = `${f.bl - BASE[f.familia in BASE ? f.familia : 'mont'] * tam}px`;
}

/** Cambia el texto de un txt() y reajusta su tamaño. */
export function fijarTexto(el, texto) {
  if (el.textContent === texto) return;
  el.textContent = texto ?? '';
  if (el._fc?.ancho) ajustar(el);
}

function ajustar(el) {
  const f = el._fc;
  const w = medir(el.textContent, f.tam, f.peso, f.familia, f.espaciado);
  const tam = w > f.ancho ? Math.max(14, Math.floor(f.tam * f.ancho / w)) : f.tam;
  aplicarTam(el, tam);
}

let lienzoMedida = null;
/** Ancho de un texto en px de diseño (canvas, sin reflow). */
export function medir(texto, tam, peso = 400, familia = 'mont', espaciado = 0) {
  if (!lienzoMedida) lienzoMedida = document.createElement('canvas').getContext('2d');
  const fam = familia === 'num' ? 'Arial, Montserrat, sans-serif'
    : familia === 'reloj' ? 'Tahoma, Montserrat, sans-serif' : 'Montserrat, sans-serif';
  lienzoMedida.font = `${peso} ${tam}px ${fam}`;
  return lienzoMedida.measureText(String(texto ?? '')).width + espaciado * String(texto ?? '').length;
}

/** Caja absoluta en px de diseño. */
export function caja(tag, x, y, w, hh, clase = '', estilo = {}) {
  const el = h(tag, { class: clase });
  Object.assign(el.style, { position: 'absolute', left: `${x}px`, top: `${y}px`,
    width: w == null ? '' : `${w}px`, height: hh == null ? '' : `${hh}px` }, estilo);
  return el;
}

/** Icono SVG por máscara desde cualquier carpeta (los de color/ sin variante mono). */
export function mascara(ruta, tam, color, clase = '') {
  const el = h('span', { class: `fc-mascara ${clase}` });
  Object.assign(el.style, { width: `${tam}px`, height: `${tam}px`, backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")` });
  return el;
}

/**
 * Icono de 48x48 cuya tinta llena la caja del mockup (componente Icono del QML).
 * caja = [x, y, w, h]; tinta = [x0, y0, x1, y1] dentro del viewBox 48.
 * Con `color` se pinta por máscara (mono/), si no se usa el SVG a color.
 */
export function iconoCaja(nombre, cajaM, tinta = [0, 0, 48, 48], color = null) {
  const e = cajaM[3] / (tinta[3] - tinta[1]);
  const w = 48 * e;
  const x = cajaM[0] + cajaM[2] / 2 - (tinta[0] + tinta[2]) / 2 * e;
  const y = cajaM[1] - tinta[1] * e;
  const el = color
    ? mascara(`assets/iconos/mono/${nombre}.svg`, w, color)
    : h('img', { src: `assets/iconos/color/${nombre}.svg`, alt: '', draggable: 'false' });
  Object.assign(el.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${w}px` });
  return el;
}

/** Imagen de puerta (PNG 1920x1080) recortada a su tinta y pintada de un color (máscara). */
export function iconoPuerta(numero, cerrada, alto, color) {
  // recortes = caja de tinta de cada PNG (sourceClipRect del QML)
  const rect = numero === 2
    ? (cerrada ? [653, 37, 603, 962] : [647, 22, 615, 992])
    : (cerrada ? [670, 37, 598, 962] : [665, 22, 607, 992]);
  const s = alto / rect[3];
  const ancho = alto * 607 / 992;
  const ruta = `assets/imagenes/${cerrada ? 'close_door_' : 'open_door_'}${numero === 2 ? 2 : 1}.png`;
  const el = h('span', { class: 'fc-puerta-img' });
  const dx = (ancho - rect[2] * s) / 2;
  Object.assign(el.style, {
    width: `${ancho}px`, height: `${alto}px`, backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")`,
    webkitMaskSize: `${1920 * s}px ${1080 * s}px`, maskSize: `${1920 * s}px ${1080 * s}px`,
    webkitMaskPosition: `${dx - rect[0] * s}px ${-rect[1] * s}px`, maskPosition: `${dx - rect[0] * s}px ${-rect[1] * s}px`,
  });
  return el;
}

// ---- formatos (domain/pantalla_ciclo.py) ----
const SIN = () => t('sistema.sin_lectura');
const fin = (v) => typeof v === 'number' && isFinite(v);
/** Consigna de temperatura: un decimal (134.0). Punto decimal, como el software. */
export const fTempConsigna = (v) => (fin(v) ? v.toFixed(1) : SIN());
/** Lectura de temperatura: 05.1f (098.2). */
export const fTempLectura = (v) => (fin(v) ? v.toFixed(1).padStart(5, '0') : SIN());
/** Minutos: sin decimal si es entero (15), si no uno (3.5). */
export const fMin = (v) => (fin(v) ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : SIN());
/** Presión kPa un decimal, con 3 cifras enteras como la lectura de temperatura (084.1). */
export const fPres = (v) => (fin(v) ? v.toFixed(1).padStart(5, '0') : SIN());
/** "%g" de Python para el selector (134, 3.5). */
export const fG = (v) => (fin(v) ? String(Math.round(v * 10) / 10) : '—');
export const dos = (n) => String(n).padStart(2, '0');
/** HH:MM:SS de segundos; null -> "—". */
export function fReloj(seg) {
  if (!fin(seg)) return SIN();
  const s = Math.max(0, Math.floor(seg));
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`;
}
/** m:ss */
export function fMmSs(seg) {
  if (!fin(seg) || seg < 0) return null;
  const s = Math.floor(seg);
  return `${Math.floor(s / 60)}:${dos(s % 60)}`;
}

/** Valor crudo de un nodo del i18n (arreglos como fecha.meses). */
export function valorI18n(clave) {
  const buscar = (tabla) => clave.split('.').reduce((n, p) => (n == null ? n : n[p]), tabla);
  return buscar(idioma() === 'en' ? en : es) ?? buscar(es);
}

/** Texto con la clave si existe; si no, el respaldo {es, en}. */
export function tx(clave, respaldo, params) {
  const v = t(clave, params);
  if (v !== clave) return v;
  let s = respaldo?.[idioma()] ?? respaldo?.es ?? clave;
  for (const [k, val] of Object.entries(params || {})) s = s.split(`{${k}}`).join(String(val));
  return s;
}

/** Texto propio de la demo (sin clave real): loc({es, en}). */
export function loc(o, params) { return tx('#sin-clave#', o, params); }

/** Valor de un parámetro de programa (parametros.seccion.nombre.value). */
export function param(prog, seccion, nombre) {
  const p = prog?.parametros?.[seccion]?.[nombre];
  const v = p && typeof p === 'object' ? p.value : p;
  return typeof v === 'number' ? v : (v != null && isFinite(Number(v)) ? Number(v) : null);
}

/** Equipo de demostración (perfil de instalación ficticio). */
const EQUIPO_RESPALDO = { modelo: 'SPK-SAT 400H2', serie: 'SN260000' };
export const EQUIPO_DEMO = {
  get modelo() { return equipoSim()?.modelo || EQUIPO_RESPALDO.modelo; },
  get serie() { return equipoSim()?.serie || EQUIPO_RESPALDO.serie; },
  get version() { return equipoSim()?.version || ''; },
};
let simRef = null;
import('../../sim/motor.js').then((m) => { simRef = m.sim; }).catch(() => {});
const equipoSim = () => simRef?.estado?.equipo || null;

/** Fecha "d mes  -  aaaa" del encabezado. */
export function fechaEncabezado(d = new Date()) {
  const meses = valorI18n('fecha.meses') || [];
  return `${d.getDate()} ${meses[d.getMonth()] ?? ''}  -  ${d.getFullYear()}`;
}

/** Hora ISO o ms -> "AAAA-MM-DD HH:MM:SS" (VentanaDetalleAlarma.textoHora). */
export function horaLarga(v) {
  if (v == null || v === '') return '';
  const d = new Date(v);
  if (isNaN(d)) return String(v).replace('T', ' ').substring(0, 19);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
}
export function hms(v) {
  if (v == null || v === '') return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
}

/** Textos de una alarma: catálogo i18n alarmas.<CODIGO> o lo que trae la alarma. */
export function textosAlarma(a) {
  const c = a?.codigo || '';
  const de = (campo) => { const k = `alarmas.${c}.${campo}`; const v = t(k); return v !== k ? v : ''; };
  return {
    titulo: a?.titulo || de('titulo') || a?.codigoVisible || c,
    descripcion: a?.descripcion || de('descripcion') || '',
    accion: a?.accion || de('accion') || '',
  };
}

/** Grupo de la campana por prioridad: alta = Emergencia, media = Alarmas, baja = Avisos. */
export const grupoDe = (nivel) => (nivel === 'media' ? 'alarma' : nivel === 'baja' ? 'aviso' : 'emergencia');
export const colorNivel = (nivel) => (nivel === 'media' ? 'var(--c-alarma-media)'
  : nivel === 'baja' ? 'var(--c-alarma-baja)' : 'var(--c-alarma-alta)');
