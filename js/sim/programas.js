// Programas de fábrica reales y sus ajustes persistentes en la demo.
//
// Origen de los datos (transcritos a js/sim/programas_fabrica.js por
// herramientas/generar_programas.py; cada parámetro cita archivo:línea):
//   1 bowe_dick         <- src/autoclave/cycles/factory/bowe_dick.json
//   2 134_instrumental  <- src/autoclave/cycles/factory/instrumental_134.json
//   3 instrumental_121  <- src/autoclave/cycles/factory/instrumental_121.json
//   4 liquidos          <- src/autoclave/cycles/factory/liquidos.json
//   5 textiles          <- src/autoclave/cycles/factory/textiles.json
//   6 prion             <- src/autoclave/cycles/factory/prion.json  ("habilitado": false de fábrica)
// No existe un programa "Test": Bowie & Dick es el programa de prueba (como en el real).
//
// Persistencia (almacen.js, localStorage con try/catch): solo la diferencia sobre fábrica.
//   'sim:programas:diff'       -> { id: { 'seccion.nombre' | 'seccion.modo_N.nombre': valor } }
//   'sim:programas:habilitado' -> { id: bool }
// Este módulo no depende de i18n: el nombre traducido lo pone motor.js.
import { PROGRAMAS_FABRICA } from './programas_fabrica.js';
import { leer, guardar, borrar } from '../core/almacen.js';

const CLAVE_DIFF = 'sim:programas:diff';
const CLAVE_HAB = 'sim:programas:habilitado';

/** Programa por defecto al arrancar (backend/context.py:183). */
export const PROGRAMA_POR_DEFECTO = 'bowe_dick';

function diffs() { return leer(CLAVE_DIFF, {}) || {}; }
function habilitados() { return leer(CLAVE_HAB, {}) || {}; }

/** Hoja {value, unit, min, max...} de `parametros` por ruta 'seccion.nombre' o 'seccion.modo_4.nombre'. */
function hoja(parametros, ruta) {
  let nodo = parametros;
  for (const parte of ruta.split('.')) {
    if (nodo == null || typeof nodo !== 'object') return null;
    nodo = nodo[parte];
  }
  return nodo && typeof nodo === 'object' && 'value' in nodo ? nodo : null;
}

/** Programa completo (fábrica + ajustes guardados), copia independiente. */
function construir(base, d, h) {
  const prog = structuredClone(base);
  for (const [ruta, valor] of Object.entries(d[base.id] || {})) {
    const nodo = hoja(prog.parametros, ruta);
    if (nodo) nodo.value = valor;
  }
  if (typeof h[base.id] === 'boolean') prog.habilitado = h[base.id];
  prog.tipoCarga = prog.parametros.globals?.tipo_carga?.value === 'solido' ? 'solido' : 'liquido';
  return prog;
}

export function listarProgramas() {
  const d = diffs(), h = habilitados();
  return PROGRAMAS_FABRICA.map((b) => construir(b, d, h)).sort((a, b) => a.numero - b.numero);
}

export function obtenerPrograma(id) {
  const base = PROGRAMAS_FABRICA.find((p) => p.id === id);
  return base ? construir(base, diffs(), habilitados()) : null;
}

/** Valor de un parámetro: valor(prog, 'esterilizacion', 'tiempo_esterilizacion') o con modo anidado. */
export function valor(prog, ...ruta) {
  const nodo = hoja(prog?.parametros, ruta.join('.'));
  return nodo ? nodo.value : undefined;
}

/**
 * Guarda un parámetro (persistente). `seccion` puede ser 'descompresion.modo_4'.
 * Devuelve null o la clave i18n del rechazo ('opciones.err_valor_invalido').
 */
export function guardarParametro(id, seccion, nombre, nuevo) {
  const base = PROGRAMAS_FABRICA.find((p) => p.id === id);
  if (!base) return 'sesion.error_generico';
  const ruta = `${seccion}.${nombre}`;
  const nodo = hoja(base.parametros, ruta);
  if (!nodo) return 'opciones.err_valor_invalido';
  let v = nuevo;
  if (typeof nodo.value === 'boolean') {
    if (typeof v !== 'boolean') return 'opciones.err_valor_invalido';
  } else if (typeof nodo.value === 'number') {
    v = Number(v);
    if (!Number.isFinite(v)) return 'opciones.err_valor_invalido';
    if (nodo.type === 'int') v = Math.round(v);
    if ((nodo.min != null && v < nodo.min) || (nodo.max != null && v > nodo.max)) return 'opciones.err_valor_invalido';
  } else if (Array.isArray(nodo.options)) {
    if (!nodo.options.includes(v)) return 'opciones.err_valor_invalido';
  }
  const d = diffs();
  d[id] = d[id] || {};
  if (v === nodo.value) delete d[id][ruta];
  else d[id][ruta] = v;
  if (!Object.keys(d[id]).length) delete d[id];
  guardar(CLAVE_DIFF, d);
  return null;
}

/** Habilita o deshabilita un programa (Prion viene deshabilitado de fábrica). */
export function habilitarPrograma(id, si) {
  const base = PROGRAMAS_FABRICA.find((p) => p.id === id);
  if (!base) return 'sesion.error_generico';
  const h = habilitados();
  if (Boolean(si) === Boolean(base.habilitado ?? true)) delete h[id];
  else h[id] = Boolean(si);
  guardar(CLAVE_HAB, h);
  return null;
}

/** Vuelve un programa (o todos si no se da id) a los valores de fábrica. */
export function restaurarFabrica(id = null) {
  if (id == null) { borrar(CLAVE_DIFF); borrar(CLAVE_HAB); return; }
  const d = diffs(); delete d[id]; guardar(CLAVE_DIFF, d);
  const h = habilitados(); delete h[id]; guardar(CLAVE_HAB, h);
}
