// Ayudantes internos del frente ciclo (no es un componente publicado).
// Composición adaptable (v1.1): nada de px de diseño; medidas en rem/px reales y
// encaje de textos de una línea con encajar() (HorizontalFit del QML).
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import es from '../../../i18n/es.js';
import en from '../../../i18n/en.js';

let lienzoMedida = null;
/** Ancho de un texto en px (canvas, sin reflow). familia: 'mont' | 'num' | 'reloj'. */
export function medir(texto, tam, peso = 400, familia = 'mont', espaciado = 0) {
  if (!lienzoMedida) lienzoMedida = document.createElement('canvas').getContext('2d');
  const fam = familia === 'num' ? 'Arial, Montserrat, sans-serif'
    : familia === 'reloj' ? 'Tahoma, Montserrat, sans-serif' : 'Montserrat, sans-serif';
  lienzoMedida.font = `${peso} ${tam}px ${fam}`;
  return lienzoMedida.measureText(String(texto ?? '')).width + espaciado * String(texto ?? '').length;
}

/** Tamaño mínimo de letra (px reales, B4). */
export const LETRA_MIN = 12.2;

/**
 * Encaje horizontal (HorizontalFit del QML): si el texto de un bloque de una línea
 * (.fc-encaja: white-space nowrap, ancho dado por su caja) no cabe, baja la letra hasta
 * LETRA_MIN. Nunca se recorta: la letra nominal la da el CSS.
 */
export function encajar(el, min = LETRA_MIN) {
  if (!el || !el.isConnected) return;
  el.style.fontSize = '';
  const cw = el.clientWidth;
  if (!cw) return;
  el.style.whiteSpace = '';
  const sw = el.scrollWidth;
  if (sw > cw + 0.5) {
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    el.style.fontSize = `${Math.max(min, Math.floor(fs * cw / sw * 10) / 10)}px`;
    // Si ni con la letra mínima cabe en una línea, se parte por palabras (nunca se sale ni se recorta).
    if (el.scrollWidth > el.clientWidth + 0.5) el.style.whiteSpace = 'normal';
  }
}
/** Reencaja todos los .fc-encaja de un nodo (al cambiar de tamaño). */
export function encajarTodo(raiz) { raiz?.querySelectorAll('.fc-encaja').forEach((e) => encajar(e)); }

/** Cambia el texto de un nodo y lo reencaja si es .fc-encaja. */
export function fijarTexto(el, texto) {
  texto = texto ?? '';
  if (el.textContent === texto) return;
  el.textContent = texto;
  if (el.classList.contains('fc-encaja')) encajar(el);
}

/** Medida CSS: número = px; texto se usa tal cual. */
const css = (v) => (typeof v === 'number' ? `${v}px` : String(v));

/** Icono SVG por máscara desde cualquier carpeta (los de color/ sin variante mono).
 *  tam: px o medida CSS; null = lo pone el CSS. */
export function mascara(ruta, tam, color, clase = '') {
  const el = h('span', { class: `fc-mascara ${clase}` });
  Object.assign(el.style, { backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")` });
  if (tam != null) Object.assign(el.style, { width: css(tam), height: css(tam) });
  return el;
}

/** Imagen de puerta (PNG 1920x1080) recortada a su tinta y pintada de un color (máscara).
 *  alto: px o medida CSS (todo va en em, así escala con la letra del contenedor). */
export function iconoPuerta(numero, cerrada, alto, color) {
  // recortes = caja de tinta de cada PNG (sourceClipRect del QML)
  const rect = numero === 2
    ? (cerrada ? [653, 37, 603, 962] : [647, 22, 615, 992])
    : (cerrada ? [670, 37, 598, 962] : [665, 22, 607, 992]);
  const s = 1 / rect[3];               // em por px de imagen
  const ancho = 607 / 992;             // em
  const dx = (ancho - rect[2] * s) / 2;
  const ruta = `assets/imagenes/${cerrada ? 'close_door_' : 'open_door_'}${numero === 2 ? 2 : 1}.png`;
  const el = h('span', { class: 'fc-puerta-img' });
  const f = (v) => `${v.toFixed(4)}em`;
  Object.assign(el.style, {
    fontSize: css(alto), width: f(ancho), height: '1em', backgroundColor: color,
    webkitMaskImage: `url("${ruta}")`, maskImage: `url("${ruta}")`,
    webkitMaskSize: `${f(1920 * s)} ${f(1080 * s)}`, maskSize: `${f(1920 * s)} ${f(1080 * s)}`,
    webkitMaskPosition: `${f(dx - rect[0] * s)} ${f(-rect[1] * s)}`, maskPosition: `${f(dx - rect[0] * s)} ${f(-rect[1] * s)}`,
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

/** Escala del QML en la ventana actual: px reales por px de diseño (1200x1920 en vertical,
 *  1920x1200 en horizontal). Solo para proporciones; los pisos (12,2 px, 44 px) mandan. */
export function escalaU() {
  const w = window.innerWidth || 1, hh = window.innerHeight || 1;
  return document.documentElement.dataset.orient === 'h' ? Math.min(w / 1920, hh / 1200) : Math.min(w / 1200, hh / 1920);
}
