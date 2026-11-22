// Historial de ciclos de la demo (la base de datos de ciclos del real, en localStorage).
// API: listar() (más reciente primero), obtener(id), agregar(registro), semilla(),
// registroDeCorrida(corrida), siguienteNumero(), borrarHistorial().
// La semilla simula cada ciclo con el mismo núcleo (ciclo.js, modo rápido) para que la serie,
// la tirilla y el resultado sean coherentes. Persistencia con try/catch (almacen.js): si el
// almacenamiento falla, la demo sigue en memoria.
import { leer, guardar, borrar } from '../core/almacen.js';
import { emit } from '../core/eventos.js';
import { t } from '../core/i18n.js';
import { simularRapido } from './ciclo.js';
import { obtenerPrograma } from './programas.js';
import { fallo as defFallo, codigoVisible } from './fallos.js';
import { generarTirilla } from './tirilla.js';

const CLAVE = 'sim:historial';
const CLAVE_NUM = 'sim:contador_ciclos';
export const MAX_PUNTOS_SERIE = 600;
const MAX_REGISTROS = 200;

let cache = null;
function cargar() {
  if (!cache) {
    const v = leer(CLAVE, []);
    cache = Array.isArray(v) ? v : [];
  }
  return cache;
}
function persistir() { guardar(CLAVE, cache); }

export function listar() {
  return cargar().slice().sort((a, b) => b.inicio - a.inicio);
}

export function obtener(id) {
  return cargar().find((r) => r.id === id) || null;
}

export function agregar(registro) {
  const lista = cargar();
  const i = lista.findIndex((r) => r.id === registro.id);
  if (i >= 0) lista[i] = registro; else lista.push(registro);
  if (lista.length > MAX_REGISTROS) { lista.sort((a, b) => a.inicio - b.inicio); lista.splice(0, lista.length - MAX_REGISTROS); }
  persistir();
  emit('historial', registro);
  return registro;
}

export function borrarHistorial() {
  cache = [];
  borrar(CLAVE);
  borrar(CLAVE_NUM);
}

/** Número de ciclo consecutivo global (persistente). Devuelve el siguiente y lo reserva. */
export function siguienteNumero() {
  const ultimo = Math.max(Number(leer(CLAVE_NUM, 0)) || 0, ...cargar().map((r) => r.numero || 0));
  const n = ultimo + 1;
  guardar(CLAVE_NUM, n);
  return n;
}

/** Submuestreo de la serie manteniendo la forma: por tramo, el punto más alejado de la media. */
export function submuestrear(serie, max = MAX_PUNTOS_SERIE) {
  if (!Array.isArray(serie) || serie.length <= max) return (serie || []).slice();
  const out = [serie[0]];
  const tramo = (serie.length - 2) / (max - 2);
  for (let k = 0; k < max - 2; k++) {
    const a = 1 + Math.floor(k * tramo), b = Math.max(a + 1, 1 + Math.floor((k + 1) * tramo));
    let mejor = serie[a], dmax = -1;
    const ref = serie[a].tc ?? 0;
    for (let i = a; i < b && i < serie.length - 1; i++) {
      const d = Math.abs((serie[i].tc ?? ref) - ref) + Math.abs((serie[i].pc ?? 0) - (serie[a].pc ?? 0)) / 10;
      if (d > dmax) { dmax = d; mejor = serie[i]; }
    }
    out.push(mejor);
  }
  out.push(serie[serie.length - 1]);
  return out;
}

/** Registro del historial a partir de una corrida terminada (y confirmada o entregada). */
export function registroDeCorrida(c) {
  const fin = c.entrega.tEntrega ?? c.tConfirmacion ?? c.t;
  const ticket = c.datosTicket();
  const alarmas = c.alarmas.map((a) => ({
    codigo: a.codigo, codigoVisible: codigoVisible(a.codigo), nivel: a.nivel,
    titulo: t(`alarmas.${a.codigo}.titulo`), aparecida: c.horaReal(a.aparecida),
    resuelta: a.resuelta != null ? c.horaReal(a.resuelta) : null,
  }));
  const motivoTxt = c.codigo ? `${codigoVisible(c.codigo)} - ${t(`alarmas.${c.codigo}.titulo`)}` : null;
  const reg = {
    id: `c${c.numero}-${c.inicio}`,
    numero: c.numero,
    programaId: c.prog.id,
    programaNombre: c.prog.nombreClave ? t(c.prog.nombreClave) : c.prog.displayName,
    nombreClave: c.prog.nombreClave,
    numeroPrograma: c.prog.numero,
    tipoCarga: c.prog.tipoCarga,
    operador: c.operador || '',
    inicio: c.inicio,
    fin: c.horaReal(fin),
    duracionS: Math.round(fin),
    resultado: c.resultado,
    estado: c.faseCicloFinal,
    codigo: c.codigo,
    motivo: motivoTxt,
    faseTerminacion: c.faseTerminacion,
    canceladoPor: c.canceladoPor,
    f0: c.f0Activo ? Math.round(c.f0 * 10) / 10 : null,
    tempMax: Number.isFinite(c.tempMax) ? c.tempMax : null,
    presMax: Number.isFinite(c.presMax) ? c.presMax : null,
    tempEster: c.tEst,
    tiempoEster: c.exposicionTotal / 60,
    observaciones: c.observaciones.map((o) => ({ sensor: o.sensor, hora: c.horaReal(o.t), fase: o.fase })),
    alarmas,
    serie: submuestrear(c.serie),
    ticket,
    tirilla: null,
  };
  reg.tirilla = generarTirilla(reg);
  return reg;
}

// Plan de la semilla: [días atrás, hora, minuto, programa, operador, perturbación]
const PLAN = [
  [10, 7, 32, 'bowe_dick', 'Operador demo 1'],
  [10, 9, 5, '134_instrumental', 'Operador demo 1'],
  [9, 8, 14, 'instrumental_121', 'Operador demo 2'],
  [8, 7, 40, 'bowe_dick', 'Técnico demo'],
  [8, 10, 20, 'liquidos', 'Operador demo 2'],
  [7, 13, 45, '134_instrumental', 'Operador demo 1', { fallo: { codigo: 'CIC-04', fase: 'ESTERILIZACION', tras: 75 } }],
  [6, 8, 2, 'textiles', 'Operador demo 2'],
  [5, 7, 35, 'bowe_dick', 'Operador demo 1'],
  [4, 11, 10, 'instrumental_121', 'Operador demo 2', { cancelar: { fase: 'PRE_VACIO', tras: 70 } }],
  [3, 9, 30, '134_instrumental', 'Técnico demo'],
  [2, 15, 5, 'instrumental_121', 'Operador demo 1', { fallo: { codigo: 'CIC-02', fase: 'PRE_VACIO', tras: 50 } }],
  [1, 8, 50, '134_instrumental', 'Operador demo 2'],
];

/** Siembra el historial con ciclos de los últimos 10 días si está vacío. Devuelve cuántos agregó. */
export function semilla() {
  if (cargar().length > 0) return 0;
  const hoy = new Date();
  let agregados = 0;
  for (let i = 0; i < PLAN.length; i++) {
    const [dias, h, min, id, operador, extra = {}] = PLAN[i];
    const prog = obtenerPrograma(id);
    if (!prog) continue;
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias, h, min, 7 + i * 3);
    try {
      const numero = siguienteNumero();
      const c = simularRapido(prog, {
        semilla: 1000 + i * 17, numero, operador, inicio: d.getTime(),
        fallo: extra.fallo || null,
        cancelar: extra.cancelar ? { ...extra.cancelar, usuario: operador } : null,
      }, defFallo);
      const reg = registroDeCorrida(c);
      cargar().push(reg);
      agregados++;
    } catch (e) {
      console.warn('[historial] semilla:', e);
    }
  }
  persistir();
  if (agregados) emit('historial', null);
  return agregados;
}
