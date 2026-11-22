// Textos es/en generados desde src/autoclave/i18n/*.json (herramientas/generar_i18n.py).
// t('ciclo.titulo', {n: 3}) busca la clave anidada y reemplaza {n}. Sin clave en el
// idioma vigente cae a español y, si tampoco existe, devuelve la clave (como i18n.t real).
import es from '../../i18n/es.js';
import en from '../../i18n/en.js';
import { leer, guardar } from './almacen.js';
import { emit } from './eventos.js';

const TABLAS = { es, en };
let vigente = leer('idioma', 'es') === 'en' ? 'en' : 'es';
document.documentElement.lang = vigente;

function buscar(tabla, clave) {
  let nodo = tabla;
  for (const parte of clave.split('.')) {
    if (nodo == null || typeof nodo !== 'object') return undefined;
    nodo = nodo[parte];
  }
  return typeof nodo === 'string' ? nodo : undefined;
}

export function t(clave, params = {}, idioma = vigente) {
  let texto = buscar(TABLAS[idioma], clave) ?? buscar(TABLAS.es, clave) ?? clave;
  for (const [k, v] of Object.entries(params)) texto = texto.split(`{${k}}`).join(String(v));
  return texto;
}

/** true si la clave existe en el idioma vigente o en español. */
export function existe(clave) {
  return buscar(TABLAS[vigente], clave) !== undefined || buscar(TABLAS.es, clave) !== undefined;
}

export function idioma() { return vigente; }

export function fijarIdioma(nuevo) {
  if (!TABLAS[nuevo] || nuevo === vigente) return;
  vigente = nuevo;
  document.documentElement.lang = nuevo;
  guardar('idioma', nuevo);
  emit('idioma', nuevo);
}

/** Formatos de fecha y hora como el software (24 h, dd/mm/aaaa). */
export function hora(fecha, conSegundos = false) {
  const d = new Date(fecha);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}${conSegundos ? ':' + p(d.getSeconds()) : ''}`;
}
export function fecha(f) {
  const d = new Date(f);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
/** Duración en segundos → "h:mm:ss" o "m:ss". */
export function duracion(seg) {
  if (seg == null || !isFinite(seg)) return '—';
  seg = Math.max(0, Math.round(seg));
  const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
/** Número con coma decimal en español y punto en inglés. */
export function num(v, decimales = 1) {
  if (v == null || !isFinite(v)) return '—';
  const s = Number(v).toFixed(decimales);
  return vigente === 'es' ? s.replace('.', ',') : s;
}
