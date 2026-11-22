// Utilidades del frente "menú": posicionamiento absoluto en px de diseño (1 u del QML = 1 px),
// textos colocados por línea base como en el QML, fechas, resultado de ciclo y acceso al historial.
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import { leer } from '../../core/almacen.js';
import { aviso, cerrarModales } from '../../core/capas.js';
import * as router from '../../core/router.js';
import es from '../../../i18n/es.js';
import en from '../../../i18n/en.js';

const TABLAS = { es, en };

/** Listas i18n (p. ej. 'fecha.meses', 'fecha.dias'); t() solo devuelve cadenas. */
export function lista(clave) {
  const [g, k] = clave.split('.');
  const v = (TABLAS[idioma()] ?? es)[g]?.[k];
  return Array.isArray(v) ? v : (es[g]?.[k] ?? []);
}

export const dos = (n) => String(n).padStart(2, '0');
export const horaHM = (d) => `${dos(d.getHours())}:${dos(d.getMinutes())}`;
/** «d mes  -  aaaa» del reposo y las barras. */
export function fechaBarra(d = new Date()) {
  return `${d.getDate()} ${lista('fecha.meses')[d.getMonth()] ?? ''}  -  ${d.getFullYear()}`;
}

/** Fija posición/tamaño absolutos (px de diseño). */
export function pos(el, x, y, w, alto) {
  const s = el.style;
  s.position = 'absolute';
  if (x != null) s.left = `${x}px`;
  if (y != null) s.top = `${y}px`;
  if (w != null) s.width = `${w}px`;
  if (alto != null) s.height = `${alto}px`;
  return el;
}

/** Caja absoluta con clase. */
export function caja(clase, x, y, w, alto, ...hijos) {
  return pos(h('div', { class: clase }, ...hijos), x, y, w, alto);
}

const ASC = 0.86;   // distancia línea base / tamaño con interlineado = tamaño (Montserrat y Tahoma)

/**
 * Texto de una línea posicionado por línea base (como los Text del QML).
 * o: x (borde izq.), cx (centro), rx (borde der.), bl (línea base) | y (arriba), w, tam, peso, color, familia,
 *    interlineado, clase, pre (respeta saltos de línea).
 */
export function texto(contenido, o = {}) {
  const tam = o.tam ?? 26;
  const el = h('span', { class: `mt ${o.clase ?? ''}` });
  if (contenido != null) el.textContent = contenido;
  const s = el.style;
  s.position = 'absolute';
  s.fontSize = `${tam}px`;
  s.lineHeight = `${o.interlineado ?? tam}px`;
  s.fontWeight = o.peso ?? 400;
  if (o.color) s.color = o.color;
  if (o.familia) s.fontFamily = o.familia;
  if (o.pre) s.whiteSpace = 'pre';
  const li = o.interlineado ?? tam;
  const asc = (li - tam) / 2 + ASC * tam;   // línea base desde arriba
  if (o.bl != null) s.top = `${o.bl - asc}px`; else if (o.y != null) s.top = `${o.y}px`;
  if (o.w != null) s.width = `${o.w}px`;
  if (o.cx != null) {
    if (o.w != null) { s.left = `${o.cx - o.w / 2}px`; s.textAlign = 'center'; }
    else { s.left = `${o.cx}px`; s.transform = 'translateX(-50%)'; }
  } else if (o.rx != null) {
    s.right = `${o.rx}px`; s.textAlign = 'right';
  } else if (o.x != null) s.left = `${o.x}px`;
  return el;
}

/** Reloj de 1 s con la hora local. Devuelve la función que lo detiene. */
export function reloj(fn) {
  fn(new Date());
  const id = setInterval(() => fn(new Date()), 1000);
  return () => clearInterval(id);
}

// ── resultado de un ciclo ────────────────────────────────────────────────
const CLAVE_RES = { exitoso: 'completado', fallo: 'fallo', cancelado: 'cancelado' };
export const textoResultado = (r) => (CLAVE_RES[r] ? t(`menu.resultado_${CLAVE_RES[r]}`) : '—');
export function colorResultado(r) {
  return r === 'exitoso' ? 'var(--c-menu-verde-texto)'
    : r === 'fallo' ? 'var(--c-peligro-texto)'
    : r === 'cancelado' ? 'var(--c-advertencia-texto)' : 'var(--c-texto-primario)';
}
export const numeroPrograma = (n) => (n == null || n === '' ? '—' : String(n).padStart(2, '0'));

// ── historial (js/sim/historial.js, del frente sim) ──────────────────────
let hist = null;
try { hist = await import('../../sim/historial.js'); } catch { hist = null; }

/** Todos los ciclos del historial, el más reciente primero. */
export function ciclosTodos() {
  try {
    let l = hist?.listar?.() ?? [];
    if (!l.length && hist?.semilla) { hist.semilla(); l = hist.listar?.() ?? []; }
    return Array.isArray(l) ? l : [];
  } catch { return []; }
}

export function sufijoFecha(ms) {
  const d = new Date(ms);
  return { fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`, hora: horaHM(d) };
}

// ── mantenimiento (Opciones › Mantenimiento escribe 'mantenimiento' en el almacén) ──
const DIA = 86400000;
/**
 * Estado del mantenimiento. Clave de almacén 'mantenimiento':
 * { ultimoFecha(ms), ultimoTipo, ultimoUsuario, intervaloCiclos, intervaloDias, ciclosBase }.
 * Sin dato se usa un preventivo de hace 62 días, intervalos de 500 ciclos y 180 días.
 */
export function mantenimiento() {
  const m = leer('mantenimiento', null) || {};
  const ultimoFecha = m.ultimoFecha ?? (Date.now() - 62 * DIA);
  const intervaloCiclos = m.intervaloCiclos ?? 500;
  const intervaloDias = m.intervaloDias ?? 180;
  const todos = ciclosTodos();
  const desde = (m.ciclosBase ?? 120) + todos.filter((c) => (c.inicio ?? 0) >= ultimoFecha).length;
  const restantes = intervaloCiclos > 0 ? intervaloCiclos - desde : null;
  const vence = intervaloDias > 0 ? ultimoFecha + intervaloDias * DIA : null;
  const vencidoFecha = vence != null && vence < Date.now();
  const vencido = (restantes != null && restantes < 0) || vencidoFecha;
  const proximo = (restantes != null && restantes <= 50) || (vence != null && vence - Date.now() < 15 * DIA);
  return {
    ultimoFecha, ultimoTipo: m.ultimoTipo ?? 'preventivo', ultimoUsuario: m.ultimoUsuario ?? 'Técnico demo',
    intervaloCiclos, intervaloDias, ciclosDesde: desde, restantes, vence, vencido,
    estado: vencido ? 'vencido' : proximo ? 'proximo' : 'ok',
  };
}

export function ciclosTotales() {
  const n = ciclosTodos().reduce((a, c) => Math.max(a, c.numero ?? 0), 0);
  return n + (leer('mantenimiento', null)?.ciclosPrevios ?? 0);
}

/** Registro → fila de lista ({id, numero, fecha, hora, programa, programaNombre, resultado, operador}). */
export function filaDeRegistro(r) {
  const f = sufijoFecha(r.inicio);
  return { id: r.id, numero: r.numero, fecha: f.fecha, hora: f.hora, programa: numeroPrograma(r.numeroPrograma),
    programaNombre: r.programaNombre ?? '—', resultado: r.resultado, operador: r.operador || '—', registro: r };
}

/** Aviso estándar de las acciones que la demo no hace (imprimir, correo, PDF). */
export const TX_NO_DISPONIBLE = { es: 'No disponible en la demo', en: 'Not available in the demo' };
export const avisoNoDisponible = () => aviso(TX_NO_DISPONIBLE[idioma()] ?? TX_NO_DISPONIBLE.es);

/** Abre la tirilla de un ciclo (cierra antes las ventanas flotantes). */
export function verTirilla(registro) {
  cerrarModales();
  return router.push('tirilla', { registro });
}
