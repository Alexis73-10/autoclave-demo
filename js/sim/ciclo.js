// Núcleo puro del simulador: planta física (cámara, chaqueta, carga) y corrida de un ciclo
// con la máquina de fases real. Sin DOM ni i18n: lo usan motor.js (en vivo) e historial.js
// (semilla, en modo rápido). Tiempos en segundos SIMULADOS; presiones en kPa absolutos.
//
// Lógica de control transcrita (simplificada donde se indica) de src/autoclave/:
//   state_machine/states/ciclo.py, cycle_phases/{prevacio,calentamiento,esterilizacion,
//   descompresion,secado,enfriamiento_contrapresion,protocolo_fallo}.py, states/entrega_camara.py,
//   core/runtime/{progreso_ciclo,camara_segura,letalidad}.py, services/domain/logging/cycle_logger.py.
// Simplificaciones (ver informe del frente sim): control en «modo cámara» (vapor_camara hace el
// PWM, como en los equipos de mesa; el modo chaqueta/cascada no se simula), sin Referencias en
// los programas de fábrica (temp_ref se publica como monitoreo), planta con constantes PROPUESTAS.
import { psat, tsat, incrementoF0 } from './vapor.js';
import { valor } from './programas.js';
import { datosAlarma } from './fallos.js';

// ── Datos de equipo (config/global_params.json; valores por defecto) ─────────────────────
export const EQUIPO = {
  presionAtm: 75,              // presion_atmosferica (Bogotá), global_params.json:25
  rangoAtm: 5,                 // rango_presion_atm, global_params.json:4
  intervaloImpresion: 60,      // intervalo_impresion (s)
  intervaloImpresionEst: 30,   // intervalo_impresion_esterilizacion (s)
  tempMaxApertura: 80,         // temp_max_apertura del equipo
  suministroVapor: 350,        // presion_suministro_vapor
  alivioCamara: 385,
  serie: 'SN260000',           // demostración (no es un equipo real)
  modelo: 'SPK-SAT 400H2',     // installation/modelo.py: piso, 400 L, horizontal, 2 puertas
  version: '1.0.0-beta.5 (demo)',
};

export const DT_MAX = 0.5;     // paso de integración (s simulados), como el tick real de 0,5 s

// ── Constantes de planta (PROPUESTAS, no hay dato real) ──────────────────────────────────
const G_VAPOR = 3.5;      // kPa/s con vapor_camara abierta lejos del suministro
const K_LENTA = 0.006;    // 1/s escape lento
const K_RAPIDA = 0.03;    // 1/s escape rápido
const K_VACIO = 0.03;     // 1/s bomba de vacío
const P_LIM_VACIO = 12;   // kPa abs, límite de la bomba
const K_AIRE_ATM = 0.06;  // 1/s entrada de aire atmosférico
const G_AIRE_COMP = 3.0;  // kPa/s aire comprimido
const G_CHAQUETA = 4.0;   // kPa/s vapor de chaqueta
const TAU_CAL = 4;        // s, sonda en cámara hacia Tsat(pv) al calentar
const TAU_EVAP = 10;      // s, enfriamiento por evaporación al bajar la presión
const TAU_AMB = 900;      // s, cámara sin vapor hacia la temperatura de pared
const TAU_LIQ = 130;      // s, carga líquida al calentar
const TAU_ENF = 1100;     // s, carga líquida con agua de chaqueta
const T_AGUA = 35;
const OFFSET_SONDA = 0.35; // K: la sonda Principal (en la carga) queda bajo la saturación en régimen

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const r1 = (x) => Math.round(x * 10) / 10;

export const SALIDAS = ['vapor_generador', 'vapor_caldera', 'vapor_chaqueta', 'vapor_camara',
  'descompresion_rapida', 'descompresion_lenta', 'descompresion_chaqueta', 'vacio_camara',
  'desbloqueo_puerta_1', 'desbloqueo_puerta_2', 'bloqueo_puerta_1', 'bloqueo_puerta_2',
  'aire_comprimido_camara', 'aire_admosferico_camara', 'agua_chaqueta', 'agua_intercambiador',
  'agua_bomba', 'bomba_vacio', 'abrir_puerta_1', 'abrir_puerta_2', 'cerrar_puerta_1', 'cerrar_puerta_2',
  'buzer_alarma'];

export function salidasApagadas() {
  const o = {};
  for (const s of SALIDAS) o[s] = false;
  return o;
}

/** Mulberry32: ruido reproducible para la semilla del historial. */
export function generadorAleatorio(semilla) {
  let a = (semilla >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════════════════════════════════════════════════════════════════════
// Planta
// ════════════════════════════════════════════════════════════════════════════════════════
export class Planta {
  constructor({ atm = EQUIPO.presionAtm, preparada = false } = {}) {
    this.atm = atm;
    this.paire = atm;          // presión parcial de aire (no condensables)
    this.pv = 0;               // presión parcial de vapor
    this.T = preparada ? 48 : 27;   // sonda Principal (cámara o carga)
    this.T2 = this.T - 0.2;
    this.Tref = this.T - 0.3;
    this.Pj = preparada ? 300 : 180;
    this.Td = preparada ? 40 : 26;
    this.humedo = false;
    this.liquido = false;
    this.out = salidasApagadas();
    this.puertaAbierta = { 1: false, 2: false };
    this.fx = {};              // perturbaciones de los fallos (sinVapor, bombaFalla, aireFalla, fugaAire, rapidaPegada, retenerCaliente)
  }

  get P() { return this.paire + this.pv; }

  _retirar(q) {
    const P = this.P;
    if (P <= 0 || q <= 0) return;
    const f = Math.min(1, q / P);
    this.paire *= 1 - f;
    this.pv *= 1 - f;
  }

  paso(dt) {
    const o = this.out, fx = this.fx, atm = this.atm;
    const vapor = !fx.sinVapor;
    let P = this.P;
    // Vapor a la cámara
    if (o.vapor_camara && vapor) {
      const g = G_VAPOR * clamp((EQUIPO.suministroVapor - P) / 40, 0, 1);
      if (g > 0) { this.pv += g * dt; this.humedo = true; }
    }
    // Condensación sobre una carga más fría (solo carga sólida; la líquida va abajo)
    if (!this.liquido && this.pv > 1) {
      const pe = psat(Math.max(1, this.T)) ?? 0;
      if (this.pv > pe + 0.5) this.pv -= 0.03 * (this.pv - pe) * dt;
    }
    P = this.P;
    // Sin vapor entrante y cerca de la atmosférica, el vapor residual condensa en las paredes
    if (!o.vapor_camara && P <= atm + 10 && !this.liquido) {
      const pp = psat(this.Pj > 150 ? 50 : 32) ?? 10;
      if (this.pv > pp) this.pv += (pp - this.pv) * dt / 240;
    }
    // Escapes (solo con sobrepresión respecto a la atmosférica)
    let k = 0;
    if (o.descompresion_lenta) k += K_LENTA;
    if (o.descompresion_rapida && !fx.rapidaPegada) k += K_RAPIDA;
    const puertaAb = this.puertaAbierta[1] || this.puertaAbierta[2];
    if (puertaAb) k += 0.3;
    if (fx.fugaAire > 0 && P > atm) k += fx.fugaAire;
    if (k > 0 && P > atm) this._retirar(k * (P - atm) * dt);
    // Bomba de vacío
    P = this.P;
    if (o.bomba_vacio && o.vacio_camara && !fx.bombaFalla && P > P_LIM_VACIO) this._retirar(K_VACIO * (P - P_LIM_VACIO) * dt);
    // Entradas de aire
    P = this.P;
    if (P < atm) {
      let ka = 0;
      if (o.aire_admosferico_camara) ka += K_AIRE_ATM;
      if (puertaAb) ka += 0.3;
      if (fx.fugaAire > 0) ka += fx.fugaAire;
      this.paire += ka * (atm - P) * dt;
    }
    if (o.aire_comprimido_camara && !fx.aireFalla) this.paire += G_AIRE_COMP * clamp((600 - P) / 100, 0, 1) * dt;
    if (fx.aireInyectado > 0) {      // gases no condensables (CIC-12)
      const q = Math.min(fx.aireInyectado, 5 * dt);
      this.paire += q; fx.aireInyectado -= q;
    }
    // Válvula de alivio de cámara
    if (this.P > EQUIPO.alivioCamara) this._retirar(0.5 * (this.P - EQUIPO.alivioCamara) * dt);

    // Temperatura de la sonda Principal
    const ts = this.pv > 0.7 ? tsat(this.pv) : null;
    const tPared = this.Pj > 150 ? 50 : 32;
    if (this.liquido) {
      if (o.agua_chaqueta) this.T += (T_AGUA - this.T) * dt / TAU_ENF;
      else if (ts != null && ts > this.T) this.T += (ts - this.T) * Math.min(1, dt / TAU_LIQ);
      else this.T += (tPared - this.T) * dt / 3000;
      if (o.agua_chaqueta) {            // el vapor de la cámara condensa sobre las paredes frías
        const pe = psat(Math.max(1, this.T - 5)) ?? 0;
        if (this.pv > pe) this.pv += (pe - this.pv) * Math.min(1, dt / 15);
      }
    } else {
      const te = ts != null ? ts - (ts > 100 ? OFFSET_SONDA : 0) : null;
      if (te != null && te > this.T) this.T += (te - this.T) * Math.min(1, dt / TAU_CAL);
      else if (te != null && this.humedo && te < this.T) this.T += (te - this.T) * Math.min(1, dt / TAU_EVAP);
      else this.T += (tPared - this.T) * dt / TAU_AMB;
    }
    if (fx.retenerCaliente > 0 && this.T < fx.retenerCaliente) this.T = fx.retenerCaliente;
    this.T2 += (this.T - 0.2 - this.T2) * Math.min(1, dt / 6);
    this.Tref += (this.T - 0.3 - this.Tref) * Math.min(1, dt / 8);
    // Drenaje
    const tdObj = (o.descompresion_rapida || o.descompresion_lenta) && this.P > atm + 5
      ? Math.min(this.T, 100) - 4 : clamp(this.T * 0.6, 30, 55);
    this.Td += (tdObj - this.Td) * dt / 60;

    // Chaqueta
    if (o.vapor_chaqueta && vapor) this.Pj += G_CHAQUETA * clamp((EQUIPO.suministroVapor - this.Pj) / 40, 0, 1) * dt;
    this.Pj -= 0.0015 * (this.Pj - atm) * dt;
    if (o.descompresion_chaqueta) this.Pj -= 0.03 * (this.Pj - atm) * dt;
    if (o.agua_chaqueta) this.Pj += (atm - this.Pj) * Math.min(1, dt / 8);
    this.Pj = Math.max(this.Pj, atm - 2);
  }
}

// ── Control fuera de ciclo (states/preparado.py, preparacion.py, control_banda.py) ───────
/**
 * PREPARACION/PREPARADO/FALLA: chaqueta al objetivo exacto (encendido inmediato, apagado tras 3
 * ticks seguidos, ConfirmadorApagado), aire de reposo con las puertas cerradas (T29-08 / 12-nov),
 * nivelación de sobrepresión por el escape y vaciado de chaqueta tras líquidos 4/5.
 */
export function controlReposo(pl, ctx) {
  const o = pl.out, atm = pl.atm;
  const vaciado = ctx.vaciado || 'INACTIVO';
  const objetivo = ctx.presionChaqueta ?? 300;
  for (const s of SALIDAS) {
    if (s === 'vapor_chaqueta' || s === 'aire_admosferico_camara') continue;
    o[s] = false;
  }
  if (vaciado === 'PENDIENTE') {
    o.vapor_chaqueta = false;
  } else if (vaciado === 'EN_CURSO') {
    o.vapor_chaqueta = pl.Pj < (ctx.presionMaxChaqueta ?? 375);
    o.descompresion_chaqueta = Math.floor((ctx.tVaciado || 0) / 5) % 2 === 0;
  } else {
    const debeApagar = pl.Pj >= objetivo;
    ctx.cuentaApagado = debeApagar ? (ctx.cuentaApagado || 0) + 1 : 0;
    if (!debeApagar) o.vapor_chaqueta = true;
    else if (ctx.cuentaApagado >= 3) o.vapor_chaqueta = false;
  }
  const cerradas = !pl.puertaAbierta[1] && !pl.puertaAbierta[2];
  const P = pl.P;
  if (P > atm + EQUIPO.rangoAtm) { o.aire_admosferico_camara = false; o.descompresion_rapida = true; }
  else o.aire_admosferico_camara = cerradas || P < atm - EQUIPO.rangoAtm;
  o.agua_intercambiador = pl.Td > 60;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// Corrida de un ciclo
// ════════════════════════════════════════════════════════════════════════════════════════
export const FASES_UI = ['precalentamiento', 'vacio', 'calentamiento', 'esterilizacion', 'descompresion', 'secado'];
export const FASE_BACKEND = {
  precalentamiento: 'PRECALENTAMIENTO', vacio: 'PRE_VACIO', calentamiento: 'CALENTAMIENTO',
  esterilizacion: 'ESTERILIZACION', descompresion: 'DESCOMPRESION', secado: 'SECADO',
};
export const FASE_UI = Object.fromEntries(Object.entries(FASE_BACKEND).map(([u, b]) => [b, u]));
// cycle_logger._FASE_A_CODIGO
const CODIGO_FASE = { PRECALENTAMIENTO: 'PH', PRE_VACIO: 'PV', CALENTAMIENTO: 'H', ESTERILIZACION: 'S',
  COMPLETADO: 'E', CANCELADO: 'F', FALLO: 'F', EMERGENCIA: 'F' };
export const TOPE_FRACCION_ACTIVA = 0.90;
const EXTENSION_S = 300;   // progreso_ciclo.EXTENSION_MIN

/** progreso_ciclo.fases_aplicables (equipo con bomba de vacío). */
export function fasesAplicables(prog) {
  const n = (...r) => Number(valor(prog, ...r) || 0);
  const aplica = {
    precalentamiento: n('precalentamiento', 'tiempo_precalentamiento') !== 0,
    vacio: ['a', 'b', 'c', 'd'].some((t) => Math.trunc(n('prevacio', `conteo_pulso_${t}`)) > 0),
    calentamiento: true, esterilizacion: true, descompresion: true,
    secado: n('secado', 'tiempo_secado') !== 0,
  };
  return FASES_UI.filter((f) => aplica[f]);
}

/** Debounce acumulado (cycle_phases/debounce_acumulado.py): 5 s fuera de rango en los últimos 10 s. */
class DebounceAcumulado {
  constructor(requerido = 5, ventana = 10) { this.req = requerido; this.ven = ventana; this.m = []; }
  actualizar(t, dt, fuera) {
    this.m.push([t, fuera ? dt : 0]);
    while (this.m.length && this.m[0][0] < t - this.ven) this.m.shift();
    return this.m.reduce((s, x) => s + x[1], 0) >= this.req;
  }
  get enConteo() { return this.m.some((x) => x[1] > 0); }
}

export class Corrida {
  /**
   * @param {Planta} planta  planta compartida (en vivo es la del equipo)
   * @param {object} prog    programa completo (programas.obtenerPrograma)
   * @param {object} op      {numero, operador, inicio(ms), rnd(), ruido, escalaReal}
   */
  constructor(planta, prog, op = {}) {
    this.pl = planta;
    this.prog = prog;
    this.op = { ruido: true, rnd: Math.random, escalaReal: 1, ...op };
    this.numero = op.numero ?? 0;
    this.operador = op.operador || '';
    this.inicio = op.inicio ?? Date.now();
    this.t = 0;
    this.liquido = prog.tipoCarga !== 'solido';
    planta.liquido = this.liquido;
    this.atm = planta.atm;
    this.aplicables = fasesAplicables(prog);
    this.faseIni = {}; this.faseFin = {};
    this.faseCiclo = null; this.subEstado = ''; this.fs = {};
    this.resultado = null; this.faseCicloFinal = null; this.faseTerminacion = null;
    this.tResultado = null; this.terminacion = null;
    this.codigo = null; this.motivo = null; this.valores = {};
    this.canceladoPor = null;
    this.alarmas = [];            // {codigo, valores, motivo, aparecida(t), resuelta(t|null), nivel, bloqueante, despeje}
    this.avisos = [];             // líneas del pie {clave, params} o {texto:{es,en}}
    this.observaciones = [];
    this.lineasTicket = [];       // {tipo:'fila', codigo, t, tc, pc} | {tipo:'error'} | {tipo:'f0'}
    this.serie = []; this.periodoSerie = 1; this._proxMuestra = 0;
    this.tempMax = -Infinity; this.presMax = -Infinity;
    this.f0Activo = valor(prog, 'globals', 'F0') === true;
    this.f0Objetivo = Number(valor(prog, 'globals', 'F0_objetivo') ?? 12);
    this.f0 = 0;
    this.entrega = { entregada: false, cuenta: 0, motivos: [], tEntrega: null };
    this.confirmado = false; this.tConfirmacion = null; this.confirmacionForzada = null; this.confirmadoTrasParo = false;
    this.proto = null;
    this.paro = null;             // {liberaEn} mientras esté pulsado
    this.sinEnergiaHasta = -1;
    this.puertaSensorHasta = -1;
    this.fx = {};                 // perturbaciones de sensores
    this.exposicionTotal = Number(valor(prog, 'esterilizacion', 'tiempo_esterilizacion') || 0) * 60;
    this.exposicionRestante = null;
    this.estabilizacion = null;   // {s, total}
    this.presionTrabajo = null; this.desfaseTrabajo = null;
    this._ult = { codigo: null, sub: null, tFila: -1e9 };
    this.cic07Emitido = false; this.tAvisoCalor = null;
    this.m = this.medir();
    this._entrarFase(FASE_BACKEND[this.aplicables[0]]);
  }

  p(...r) { return valor(this.prog, ...r); }
  num(...r) { const v = Number(this.p(...r)); return Number.isFinite(v) ? v : 0; }
  get faseUi() { return this.resultado ? null : FASE_UI[this.faseCiclo] || null; }
  get tEst() { return this.num('esterilizacion', 'temperatura_esterilizacion'); }
  get tObj() { return this.num('calentamiento', 'temperatura_calentamiento'); }
  get modoDesc() { return Math.trunc(this.num('descompresion', 'modo')); }

  // ── Sensores ──────────────────────────────────────────────────────────────────────────
  medir() {
    const pl = this.pl, rnd = this.op.rnd;
    const n = (a) => (this.op.ruido ? (rnd() * 2 - 1) * a : 0);
    const fx = this.fx;
    const tc = fx.principalNull ? null : r1(pl.T + n(0.1));
    const pc = fx.presionNull ? null : r1(pl.P + n(0.3));
    let tr = fx.refNull ? null : r1(pl.Tref + n(0.1) + (fx.refOffset || 0));
    return { tc, pc, tr, t2: r1(pl.T2 + n(0.1)), td: r1(pl.Td + n(0.2)), pj: r1(pl.Pj + n(0.3)) };
  }

  // ── Alarmas del ciclo ─────────────────────────────────────────────────────────────────
  alarma(codigo, valores = {}, motivo = null) {
    const act = this.alarmas.find((a) => a.codigo === codigo && a.resuelta == null);
    if (act) return act;
    const d = datosAlarma(codigo);
    const a = { codigo, valores, motivo, aparecida: this.t, resuelta: null, ...d };
    this.alarmas.push(a);
    return a;
  }
  resolver(codigo) {
    for (const a of this.alarmas) if (a.codigo === codigo && a.resuelta == null) a.resuelta = this.t;
  }

  // ── Fases ─────────────────────────────────────────────────────────────────────────────
  _entrarFase(nombre) {
    const ant = this.faseCiclo && FASE_UI[this.faseCiclo];
    if (ant) this.faseFin[ant] = this.t;
    this.faseCiclo = nombre;
    this.subEstado = '';
    this.fs = { t0: this.t };
    this.faseIni[FASE_UI[nombre]] = this.t;
    this.estabilizacion = null;
    this._salidasCiclo(true);
  }
  _siguienteFase() {
    const i = this.aplicables.indexOf(FASE_UI[this.faseCiclo]);
    const sig = this.aplicables[i + 1];
    if (sig) this._entrarFase(FASE_BACKEND[sig]);
    else this._completar();
  }

  /** Apaga las salidas de proceso (las de chaqueta y bloqueo las maneja _chaqueta/_bloqueos). */
  _salidasCiclo(todas = false) {
    const o = this.pl.out;
    for (const s of SALIDAS) {
      if (!todas && (s === 'vapor_chaqueta')) continue;
      if (s.startsWith('bloqueo_puerta')) continue;
      o[s] = false;
    }
  }

  // ── Paso ──────────────────────────────────────────────────────────────────────────────
  paso(dt) {
    this.revisarPerturbaciones();
    const m = this.medir();
    this.m = m;
    const sinEnergia = this.t < this.sinEnergiaHasta;
    if (this.paro && this.t >= this.paro.liberaEn) { this.paro = null; this.resolver('SIS-01'); }
    if (!this.resultado) this._vigilancia(m);
    if (this.paro || sinEnergia) {
      this._salidasCiclo(true);
    } else if (!this.resultado) {
      this._fase(m, dt);
      this._chaqueta(m);
    } else {
      this._postResultado(m, dt);
    }
    this._bloqueos();
    this._acumularF0(m, dt);
    this.pl.paso(dt);
    this.t += dt;
    if (this.resultado && !this.entrega.entregada) this._evaluarEntrega(m);
    this._registrar(m);
  }

  _bloqueos() {
    const o = this.pl.out;
    const bloq = !this.paro && !(this.t < this.sinEnergiaHasta) && !this.entrega.entregada;
    o.bloqueo_puerta_1 = bloq; o.bloqueo_puerta_2 = bloq;
    o.agua_bomba = o.bomba_vacio;
  }

  _acumularF0(m, dt) {
    // control_loop._acumular_f0: CICLO, fase CALENTAMIENTO/ESTERILIZACION y globals.F0 true
    if (!this.f0Activo || this.resultado || m.tc == null) return;
    if (this.faseCiclo !== 'CALENTAMIENTO' && this.faseCiclo !== 'ESTERILIZACION') return;
    this.f0 += incrementoF0(m.tc, dt / 60);
  }

  _vigilancia(m) {
    // CicloState §4: Principal o presión sin lectura -> fallo inmediato; puerta no cerrada -> fallo
    const faseTxt = this.faseCiclo;
    if (m.tc == null) return this.fallar('SEN-02', { faseCiclo: 'SENSOR_AUSENTE', valores: { sensores: 'temp_camara', fase: faseTxt } });
    if (m.pc == null) return this.fallar('SEN-04', { faseCiclo: 'SENSOR_AUSENTE', valores: { fase: faseTxt } });
    if (this.t < this.puertaSensorHasta) return this.fallar('PUE-02', { faseCiclo: 'FALLO_PUERTA_1_ABIERTA', valores: { puerta: 'puerta_1', fase: faseTxt } });
    if (m.tr == null && this.fx.refNull && this.faseCiclo === 'ESTERILIZACION') {
      if (this.liquido) return this.fallar('CIC-19', { faseCiclo: 'SENSOR_AUSENTE', valores: { sensor: 'temp_referencia', fase: faseTxt } });
      if (!this._refSinLectura) {
        this._refSinLectura = true;
        this.alarma('SEN-11', { sensor: 'temp_referencia', fase: faseTxt });
        this.observaciones.push({ sensor: 'temp_referencia', t: this.t, fase: 'esterilizacion' });
      }
    }
  }

  _fase(m, dt) {
    switch (this.faseCiclo) {
      case 'PRECALENTAMIENTO': return this._precalentamiento(m, dt);
      case 'PRE_VACIO': return this._prevacio(m, dt);
      case 'CALENTAMIENTO': return this._calentamiento(m, dt);
      case 'ESTERILIZACION': return this._esterilizacion(m, dt);
      case 'DESCOMPRESION': return this._descompresion(m, dt);
      case 'SECADO': return this._secado(m, dt);
    }
  }

  // PRECALENTAMIENTO (precalentamiento.py): de fábrica siempre saltado (tiempo 0)
  _precalentamiento(m) {
    const fs = this.fs, o = this.pl.out;
    const objetivo = this.num('precalentamiento', 'presion_precalentamiento');
    if (!fs.sub) { fs.sub = 'SUBIENDO'; fs.limite = this.t + this.num('precalentamiento', 'timeout_precalentamiento') * 60; }
    this.subEstado = fs.sub;
    if (fs.sub === 'SUBIENDO') {
      o.vapor_chaqueta = true;
      if (m.pj >= objetivo) { fs.sub = 'SOSTENIENDO'; fs.fin = this.t + this.num('precalentamiento', 'tiempo_precalentamiento') * 60; }
      else if (this.t > fs.limite) return this.fallar('CIC-01', { motivo: { noRegistrado: true } });
    } else {
      o.vapor_chaqueta = m.pj < objetivo;
      if (this.t >= fs.fin) this._siguienteFase();
    }
  }

  // PRE_VACIO (prevacio.py): pulsos A..D, sub-estados DECOMPRESION, VACIO_BAJO, HOLD_BAJO,
  // APAGANDO_VACIO, VAPOR_ALTO, HOLD_ALTO
  _prevacio(m) {
    const fs = this.fs, o = this.pl.out, atm = this.atm;
    if (!fs.pulsos) {
      fs.pulsos = [];
      for (const t of ['a', 'b', 'c', 'd']) {
        const n = Math.trunc(this.num('prevacio', `conteo_pulso_${t}`));
        for (let i = 1; i <= n; i++) fs.pulsos.push({ tipo: t.toUpperCase(), n: i, de: n,
          alta: this.num('prevacio', `presion_alta_pulso_${t}`), baja: this.num('prevacio', `presion_baja_pulso_${t}`),
          holdAlto: this.num('prevacio', `tiempo_adicional_alto_${t}`), holdBajo: this.num('prevacio', `tiempo_adicional_bajo_${t}`) });
      }
      fs.i = 0; fs.sub = 'DECOMPRESION'; fs.tSub = this.t;
    }
    const pu = fs.pulsos[fs.i];
    this.prevacioProgreso = `${pu.tipo}  ${pu.n}/${pu.de}`;
    const cambiar = (s) => { fs.sub = s; fs.tSub = this.t; };
    this._salidasCiclo();
    const inicioVacio = atm + this.num('prevacio', 'presion_inicio_vacio');
    switch (fs.sub) {
      case 'DECOMPRESION':
        if (m.pc > inicioVacio) {
          o.descompresion_rapida = true;
          if (this.t - fs.tSub > this.num('prevacio', 'timeout_descompresion') * 60) {
            return this.fallar('CIC-20', { valores: { maximo: inicioVacio, margen: this.num('prevacio', 'presion_inicio_vacio'),
              minutos: this.num('prevacio', 'timeout_descompresion'), pulso: fs.i + 1 } });
          }
        } else cambiar('VACIO_BAJO');
        break;
      case 'VACIO_BAJO': {
        o.bomba_vacio = true; o.vacio_camara = true;
        const limite = fs.limiteBajo ?? (fs.tSub + this.num('prevacio', 'timeout_bajo') * 60);
        if (m.pc <= pu.baja) { fs.limiteBajo = null; cambiar('HOLD_BAJO'); }
        else if (this.t > limite) return this.fallar('CIC-02', { motivo: { noRegistrado: true } });
        break;
      }
      case 'HOLD_BAJO':
        o.bomba_vacio = true; o.vacio_camara = true;
        if (this.t - fs.tSub >= pu.holdBajo) cambiar('APAGANDO_VACIO');
        break;
      case 'APAGANDO_VACIO':
        o.vacio_camara = this.t - fs.tSub < 0.15;   // _STAGGER_APAGADO_VACIO
        if (this.t - fs.tSub >= 0.15) cambiar('VAPOR_ALTO');
        break;
      case 'VAPOR_ALTO':
        o.vapor_camara = true; o.descompresion_lenta = true;
        if (m.pc >= pu.alta) cambiar('HOLD_ALTO');
        else if (this.t - fs.tSub > this.num('prevacio', 'timeout_alto') * 60) return this.fallar('CIC-02', { motivo: { noRegistrado: true } });
        break;
      case 'HOLD_ALTO':
        o.vapor_camara = this.t - fs.tSub < pu.holdAlto; o.descompresion_lenta = o.vapor_camara;
        if (this.t - fs.tSub >= pu.holdAlto) {
          fs.i += 1;
          if (fs.i >= fs.pulsos.length) { this.prevacioProgreso = null; return this._siguienteFase(); }
          cambiar('DECOMPRESION');
        }
        break;
    }
    this.subEstado = fs.sub;
  }

  // PWM de dos estados: ON los primeros duty*periodo s de cada periodo
  _pwm(fs, duty, periodo) {
    if (fs.tPwm == null || this.t - fs.tPwm >= periodo) { fs.tPwm = this.t; fs.duty = duty; }
    return this.t - fs.tPwm < fs.duty * periodo;
  }

  // CALENTAMIENTO (calentamiento.py): RAMPA (duty continuo) -> enclave t_obj (5 s) ->
  // ESTABLE_PREESTERILIZACION (ventana continua) -> COMPLETADO
  _calentamiento(m, dt) {
    const fs = this.fs, o = this.pl.out;
    const tObj = this.tObj, ps = psat(tObj);
    const addCal = this.num('calentamiento', 'presion_add_calentamiento');
    const extra = this.liquido ? this.num('calentamiento', 'presion_add_liquido_calentamiento') : 0;
    const techo = ps + addCal + (this.liquido && !fs.enclave ? extra : 0);
    const periodo = Math.max(1, this.num('calentamiento', 'intervalo_segmentos_calor'));
    const piso = 1 - this.num('calentamiento', 'factor_calentamiento') / 100;
    if (fs.limite == null) {
      fs.limite = this.t + this.num('calentamiento', 'timeout_calentamiento') * 60;
      fs.sub = 'RAMPA'; fs.dutyTasa = 0.6; fs.hist = []; fs.tEncima = null;
    }
    this._salidasCiclo();
    o.descompresion_lenta = true;           // escape lento 1/0: enclavado abierto; rápido 0/10: cerrado
    if (this.t > fs.limite) return this.fallar('CIC-03', { motivo: { clave: 'motivos_fase.cal_tiempo_limite', valores: { minutos: this.num('calentamiento', 'timeout_calentamiento') } } });
    const T = m.tc, P = m.pc;
    // Enclave de t_obj (PAM-01/02): T >= t_obj sostenida 5 s
    if (!fs.enclave) {
      if (T >= tObj) { fs.tEncima = fs.tEncima ?? this.t; } else fs.tEncima = null;
      if (fs.tEncima != null && this.t - fs.tEncima >= 5) {
        fs.enclave = true;
        const tope = ps + addCal;
        this.presionTrabajo = clamp(P, ps, tope);
        this.desfaseTrabajo = this.presionTrabajo - ps;
      }
    }
    if (fs.sub === 'RAMPA') {
      fs.hist.push([this.t, P]);
      while (fs.hist.length && fs.hist[0][0] < this.t - 10) fs.hist.shift();
      let pObjetivo;
      if (!fs.enclave) pObjetivo = this.liquido ? ps + extra : Math.max(ps, ps + addCal - (this.num('calentamiento', 'histeresis_cierre_camara') + 1));
      else pObjetivo = this.liquido ? ps + 1 : this.presionTrabajo;
      if (fs.tPwm == null || this.t - fs.tPwm >= periodo) {
        const h0 = fs.hist[0];
        const tasa = h0 && this.t - h0[0] > 2 ? (P - h0[1]) / (this.t - h0[0]) * 60 : 0;
        const tasaMax = this.num('calentamiento', 'tasa_presion');
        fs.dutyTasa = clamp(fs.dutyTasa + (tasa < tasaMax * 0.9 ? 0.06 : tasa > tasaMax ? -0.1 : 0), 0, 1);
        let prox = P < pObjetivo ? piso + (1 - piso) * clamp((pObjetivo - P) / 30, 0, 1)
          : piso * clamp(1 - (P - pObjetivo) / Math.max(0.5, this.num('calentamiento', 'rango_calentamiento_pres')), 0, 1);
        let duty = Math.min(fs.dutyTasa, prox);
        const psT = psat(T) ?? 0;
        if (T > tObj - 3 && P < psT - 2) duty = 0;      // calidad del vapor (C-09)
        if (P >= techo) duty = 0;                          // techo de presión
        fs.dutyCalc = duty;
      }
      o.vapor_camara = this._pwm(fs, fs.dutyCalc ?? 0, periodo);
      // Entrada a ESTABLE (PAM-03): P_trabajo fijada, T >= t_obj y Psat-2 <= P <= P_trabajo+1
      const pMax = this.liquido ? Math.min(this.presionTrabajo ?? 0, ps + 2) : (this.presionTrabajo ?? 0) + 1;
      if (fs.enclave && T >= tObj && P >= ps - 2 && P <= pMax) {
        fs.sub = 'ESTABLE_PREESTERILIZACION'; fs.tVentana = this.t; fs.tRecup = this.t; fs.tPwm = null;
      }
    } else {
      // Sostenimiento: banda PWM alrededor de P_trabajo; ventana continua de estabilidad
      // (banda [P_trabajo-2,5, P_trabajo-0,5]: margen para que el ruido no saque a T de la banda)
      // Con carga líquida, tras el empuje la referencia vuelve a Psat(t_obj) + 1 (ajuste 7-nov)
      const pt = this.liquido ? ps + 1.5 : this.presionTrabajo;
      if (P < pt - 2.5) o.vapor_camara = true;
      else if (P > pt - 0.5) o.vapor_camara = false;
      else o.vapor_camara = this._pwm(fs, piso, periodo);
      const enBanda = T >= tObj && T <= tObj + this.num('calentamiento', 'rango_temp_estabilizacion')
        && P >= ps - 2 && P <= ps + addCal
        && (this.liquido || Math.abs((tsat(P) ?? T) - T) <= 1.0);
      if (!enBanda) fs.tVentana = this.t;
      else fs.tRecup = this.t;
      const total = this.num('calentamiento', 'tiempo_estable_preesterilizacion');
      this.estabilizacion = { s: this.t - fs.tVentana, total };
      if (this.t - fs.tVentana >= total) return this._siguienteFase();
      if (this.t - fs.tRecup > this.num('calentamiento', 'timeout_recuperacion_estabilizacion') * 60) {
        return this.fallar('CIC-03', { motivo: { clave: 'motivos_fase.cal_no_sostuvo', valores: { minutos: this.num('calentamiento', 'timeout_recuperacion_estabilizacion') } } });
      }
    }
    this.subEstado = fs.sub;
  }

  // ESTERILIZACION (esterilizacion.py): RECUPERACION <-> PWM_ACTIVO con banda [P_sp-2, P_sp+1],
  // techo P_control_max, conteo de exposición y fallas con debounce acumulado
  _esterilizacion(m, dt) {
    const fs = this.fs, o = this.pl.out;
    const tEst = this.tEst, ps = psat(tEst);
    const add = this.num('esterilizacion', 'presion_add_esterilizacion');
    const pMax = ps + add;
    const bsT = this.num('esterilizacion', 'brecha_segura_temperatura');
    const bsP = this.num('esterilizacion', 'brecha_segura_presion');
    if (fs.fin == null) {
      fs.fin = this.t + this.exposicionTotal;
      const pspA14 = psat(tEst + bsT + 0.3);
      const d = this.desfaseTrabajo;
      fs.psp = d != null ? Math.max(pspA14, Math.min(ps + d, pMax - 3)) : pspA14;   // PAM-04
      fs.sub = 'RECUPERACION'; fs.techo = false;
      fs.db = { ta: new DebounceAcumulado(), tb: new DebounceAcumulado(), pa: new DebounceAcumulado(),
        pb: new DebounceAcumulado(), aire: new DebounceAcumulado(), sobre: new DebounceAcumulado() };
      fs.tUltValida = this.t;
      if (this.f0Activo) fs.limiteF0 = this.t + 2 * this.exposicionTotal;
    }
    this._salidasCiclo();
    o.descompresion_lenta = true;          // escape lento enclavado abierto; rápido cerrado (0/400)
    const T = m.tc, P = m.pc;
    // RECUPERACION <-> PWM_ACTIVO (C-08 con histéresis de salida)
    if (fs.sub === 'PWM_ACTIVO') {
      if (T < tEst + bsT || P < ps + bsP) { fs.sub = 'RECUPERACION'; fs.techo = false; }
    } else if (T >= tEst + bsT + 0.3 && P >= ps + bsP + 1.0) { fs.sub = 'PWM_ACTIVO'; fs.tPwm = null; }
    const periodo = Math.max(1, this.num('esterilizacion', 'intervalo_segmentos_ester'));
    const dutyOn = 1 - this.num('esterilizacion', 'factor_esterilizacion') / 100;
    if (fs.sub === 'RECUPERACION') {
      if (P >= pMax) fs.techo = true;
      else if (P < pMax - 2) fs.techo = false;
      o.vapor_camara = !fs.techo;
    } else if (P >= pMax) o.vapor_camara = false;
    else if (P < fs.psp - 2) o.vapor_camara = true;
    else if (P > fs.psp + 1) o.vapor_camara = false;
    else o.vapor_camara = this._pwm(fs, dutyOn, periodo);
    // Fallas, siempre contra t_est fija
    const ta = fs.db.ta.actualizar(this.t, dt, T > tEst + this.num('esterilizacion', 'rango_temperatura_ester'));
    const tb = fs.db.tb.actualizar(this.t, dt, T < tEst - this.num('esterilizacion', 'brecha_error_temperatura'));
    const pa = fs.db.pa.actualizar(this.t, dt, P > ps + this.num('esterilizacion', 'rango_presion_ester'));
    const pb = fs.db.pb.actualizar(this.t, dt, P < ps - this.num('esterilizacion', 'brecha_error_presion'));
    let aire = false, sobre = false;
    if (!this.liquido) {   // C-03 / PAM-05, solo sólidos
      const psT = psat(T) ?? 0;
      const tol = Math.min(add, (psat(T + 2) ?? 0) - psT);
      aire = fs.db.aire.actualizar(this.t, dt, this.fx.forzarC03 || P - psT > tol);
      sobre = fs.db.sobre.actualizar(this.t, dt, T - (tsat(P) ?? T) > 2);
    }
    const fmtT = (x) => `${x.toFixed(1)} °C`, fmtP = (x) => `${x.toFixed(1)} kPa`;
    if (aire) {
      const ts = tsat(P) ?? T;
      return this.fallar('CIC-12', { valores: { tsat: ts, dt: ts - T, temp: T } });
    }
    if (sobre) { const ts = tsat(P) ?? T; return this.fallar('CIC-13', { valores: { tsat: ts, dt: T - ts, temp: T } }); }
    if (tb) return this.fallar('CIC-04', { motivo: { clave: 'motivos_fase.est_temp_baja', valores: { temp: fmtT(T), temp_limite: fmtT(tEst - this.num('esterilizacion', 'brecha_error_temperatura')) } } });
    if (pb) return this.fallar('CIC-04', { motivo: { clave: 'motivos_fase.est_pres_baja', valores: { pres: fmtP(P), pres_limite: fmtP(ps - this.num('esterilizacion', 'brecha_error_presion')) } } });
    if (ta) return this.fallar('CIC-04', { motivo: { clave: 'motivos_fase.est_temp_alta', valores: { temp: fmtT(T), temp_limite: fmtT(tEst + this.num('esterilizacion', 'rango_temperatura_ester')) } } });
    if (pa) return this.fallar('CIC-04', { motivo: { clave: 'motivos_fase.est_pres_alta', valores: { pres: fmtP(P), pres_limite: fmtP(ps + this.num('esterilizacion', 'rango_presion_ester')) } } });
    // CIC-09 (aviso): Referencia fuera del rango de esterilización (solo con la perturbación)
    if (m.tr != null && this.fx.refOffset) {
      const lo = tEst - this.num('esterilizacion', 'brecha_error_temperatura'), hi = tEst + this.num('esterilizacion', 'rango_temperatura_ester');
      if (m.tr < lo || m.tr > hi) {
        if (!this.alarmas.some((a) => a.codigo === 'CIC-09' && a.resuelta == null)) {
          this.alarma('CIC-09', { sensor: 'temp_referencia', temp: m.tr, minimo: lo, maximo: hi });
          this.avisos.push({ clave: 'ticket_ciclo.aviso_uniformidad', params: { sensor: 'temp_referencia', temp: m.tr.toFixed(1) }, aviso: true });
        }
      }
    } else if (this.alarmas.some((a) => a.codigo === 'CIC-09' && a.resuelta == null)) this.resolver('CIC-09');
    if (this.fx.refOffset && this.t >= (this.fx.refOffsetHasta ?? 0)) this.fx.refOffset = 0;
    // Conteo de exposición
    this.exposicionRestante = Math.max(0, fs.fin - this.t);
    this.subEstado = fs.sub;
    const enConteo = Object.values(fs.db).some((d) => d.enConteo);
    if (this.f0Activo && this.t > fs.limiteF0 && this.f0 < this.f0Objetivo) {
      return this.fallar('CIC-04', { motivo: { clave: 'motivos_fase.est_timeout_f0', valores: { minutos: 2 * this.exposicionTotal / 60, f0: this.f0.toFixed(1), f0_objetivo: this.f0Objetivo } } });
    }
    if (this.t >= fs.fin && !enConteo && (!this.f0Activo || this.f0 >= this.f0Objetivo)) {
      this.exposicionRestante = 0;
      this._siguienteFase();
    }
  }

  // Enfriamiento con contrapresión (enfriamiento_contrapresion.py), compartido por
  // DESCOMPRESION modos 4/5 y el protocolo de fallo de líquidos. Devuelve true al terminar.
  _enfriamiento(m, fs, { modo, soloAviso = false } = {}) {
    const o = this.pl.out, atm = this.atm;
    const sec = `modo_${modo}`;
    const pCool = this.num('descompresion', sec, 'presion_camara_enfriamiento') || 300;
    const tFin = this.num('descompresion', sec, 'temperatura_enfriamiento') || 80;
    const pDesp = atm + (this.num('descompresion', sec, 'presion_despresurizacion_chaqueta') || 20);
    const T = m.tc, P = m.pc;
    const pMin = (psat(T) ?? 0) + 30;     // MARGEN_CONTRAPRESION_LIQUIDO
    if (fs.e == null) fs.e = { a: false, b: false, tAire: -1e9, tBajo: null, cuentaFin: 0, t0: this.t };
    const e = fs.e;
    o.descompresion_chaqueta = true;
    o.vapor_chaqueta = false;
    if (modo === 5) o.descompresion_lenta = true;
    // aire reafirmado cada 3 s mientras P < max(P_enfriamiento, P_min + 2)
    if (P < Math.max(pCool, pMin + 2)) e.tAire = this.t;
    o.aire_comprimido_camara = this.t - e.tAire < 3;
    if (P >= pCool) e.a = true;
    if (m.pj <= pDesp) e.b = true;
    o.agua_chaqueta = e.a && e.b;
    // contrapresión (LIQ-02): armada desde (a)
    if (e.a) {
      if (P < pMin) {
        e.tBajo = e.tBajo ?? this.t;
        const bajo = this.t - e.tBajo;
        if (bajo >= 10 && !this.alarmas.some((a) => a.codigo === 'CIC-25' && a.resuelta == null)) {
          this.alarma('CIC-25', { margen: 30, segundos: 10 });
          this.avisos.push({ clave: 'ticket_ciclo.aviso_contrapresion', params: { hora: this.horaReal(this.t) }, aviso: true });
        }
        if (bajo >= 60 && !soloAviso) {
          this.resolver('CIC-25');
          this.fallar('CIC-24', { valores: { margen: 30, segundos: 60, modo } });
          return false;
        }
      } else if (e.tBajo != null) { e.tBajo = null; this.resolver('CIC-25'); }
    }
    if (!soloAviso) {
      if (!e.b && this.t - e.t0 > (this.num('descompresion', sec, 'timeout_despresurizacion_chaqueta') || 3) * 60) {
        this.fallar('CIC-22', { valores: { maximo: pDesp, margen: pDesp - atm, minutos: this.num('descompresion', sec, 'timeout_despresurizacion_chaqueta'), modo } });
        return false;
      }
      if (!e.a && this.t - e.t0 > (this.num('descompresion', sec, 'timeout_presurizacion_enfriamiento') || 3) * 60) {
        this.fallar('CIC-23', { valores: { objetivo: pCool, minutos: this.num('descompresion', sec, 'timeout_presurizacion_enfriamiento'), modo } });
        return false;
      }
    }
    e.cuentaFin = T <= tFin ? e.cuentaFin + 1 : 0;
    return e.cuentaFin >= 3;
  }

  // DESCOMPRESION (descompresion.py): modos 0..5; fin en P <= atm + presion_fin_descompresion
  _descompresion(m) {
    const fs = this.fs, o = this.pl.out, atm = this.atm;
    const modo = this.modoDesc;
    const pFin = modo === 0 ? atm + EQUIPO.rangoAtm : atm + this.num('descompresion', 'presion_fin_descompresion');
    if (fs.limite == null) {
      fs.limite = this.t + (this.num('descompresion', `modo_${modo}`, 'timeout') || 10) * 60;
      fs.sub = modo === 4 || modo === 5 ? 'ENFRIAMIENTO' : 'DESCOMPRESION';
    }
    this._salidasCiclo();
    const P = m.pc;
    const etapa = fs.sub === 'ENFRIAMIENTO' ? 'enfriamiento' : modo === 2 ? 'lenta' : modo === 1 || modo === 4 ? 'rapida' : 'general';
    if (this.t > fs.limite) {
      return this.fallar('CIC-05', { motivo: { clave: 'motivos_fase.desc_tiempo_limite', valores: {
        etapaClave: `motivos_fase.etapa.${etapa === 'rapida' && fs.sub !== 'DESCOMPRESION' ? 'descompresion' : etapa}`,
        modo, temp: `${m.tc.toFixed(1)} °C`, pres: `${P.toFixed(1)} kPa` } } });
    }
    if (fs.sub === 'ENFRIAMIENTO') {
      this.descompresionEnfriando = true;
      const listo = this._enfriamiento(m, fs, { modo });
      if (this.resultado) return;
      if (listo) { fs.sub = 'DESCOMPRESION_FINAL'; this.descompresionEnfriando = false; }
      this.subEstado = fs.sub === 'ENFRIAMIENTO' ? 'enfriamiento' : 'descompresion';
      return;
    }
    switch (modo) {
      case 0: break;
      case 1: o.descompresion_rapida = true; break;
      case 2: o.descompresion_lenta = true; break;
      case 3: if (P > this.num('descompresion', 'modo_3', 'presion_cambio')) o.descompresion_lenta = true; else o.descompresion_rapida = true; break;
      default: o.descompresion_chaqueta = true; o.descompresion_rapida = true; break;   // 4/5 tras el enfriamiento
    }
    this.subEstado = fs.sub === 'DESCOMPRESION_FINAL' ? 'descompresion' : '';
    if (P <= pFin) this._siguienteFase();
  }

  // SECADO (secado.py): modo 1 vacío continuo, 2 con aire, 3 pulsos; exige vacío real a tiempo
  _secado(m) {
    const fs = this.fs, o = this.pl.out, atm = this.atm;
    const modo = Math.trunc(this.num('secado', 'modo')) || 1;
    const umbral = atm - EQUIPO.rangoAtm;
    const tPulso = this.num('secado', 'timeout_pulso') || 10;
    if (fs.fin == null) { fs.fin = this.t + this.num('secado', 'tiempo_secado') * 60; fs.vacio = false; fs.perdida = 0; fs.sub = modo === 3 ? 'VACIO_BAJO' : ''; fs.tSub = this.t; }
    this._salidasCiclo();
    const P = m.pc;
    this.secado = { s: this.t - fs.t0, total: fs.fin - fs.t0 };
    if (modo === 3) {
      if (fs.sub === 'VACIO_BAJO') {
        o.bomba_vacio = true; o.vacio_camara = true;
        if (P <= this.num('secado', 'presion_baja_secado')) { fs.sub = 'AIRE_ALTO'; fs.tSub = this.t; }
        else if (this.t - fs.tSub > tPulso * 6) return this.fallar('CIC-06', { motivo: { clave: 'motivos_fase.sec_modo3_vacio_bajo', valores: {} } });
      } else {
        o.aire_admosferico_camara = true;
        if (P >= this.num('secado', 'presion_alta_secado')) { fs.sub = 'VACIO_BAJO'; fs.tSub = this.t; }
        else if (this.t - fs.tSub > tPulso * 6) return this.fallar('CIC-06', { motivo: { clave: 'motivos_fase.sec_modo3_aire_alto', valores: {} } });
      }
      this.subEstado = fs.sub;
    } else {
      o.bomba_vacio = true; o.vacio_camara = true;
      if (modo === 2) o.aire_admosferico_camara = true;
      if (P < umbral) fs.vacio = true;
      if (!fs.vacio && this.t - fs.t0 > tPulso) {
        return this.fallar('CIC-06', { motivo: { clave: 'motivos_fase.sec_sin_vacio', valores: { modo, pres_umbral: `${umbral.toFixed(1)} kPa` } } });
      }
      if (fs.vacio) {
        fs.perdida = P >= umbral ? fs.perdida + 1 : 0;
        if (fs.perdida >= 3) {
          return this.fallar('CIC-06', { motivo: { clave: 'motivos_fase.sec_vacio_perdido', valores: { modo, pres: `${P.toFixed(1)} kPa`, pres_umbral: `${umbral.toFixed(1)} kPa` } } });
        }
      }
    }
    if (this.t >= fs.fin) { o.bomba_vacio = false; o.vacio_camara = false; o.aire_admosferico_camara = false; this.secado = null; this._siguienteFase(); }
  }

  // Chaqueta en ciclo (CicloState._mantener_chaqueta, C-05): consigna acoplada al programa ±10 kPa
  _chaqueta(m) {
    const o = this.pl.out;
    if (this.faseCiclo === 'PRECALENTAMIENTO') return;
    if (this.faseCiclo === 'DESCOMPRESION' && (this.modoDesc === 4 || this.modoDesc === 5)) { o.vapor_chaqueta = false; return; }
    let lo, hi;
    if (this.faseCiclo === 'SECADO') {
      const c = this.num('secado', 'presion_chaqueta_secado'), r = this.num('secado', 'rango_chaqueta_secado');
      lo = c - r; hi = c + r;
    } else {
      const tEst = this.tEst;
      const c = Math.max(psat(tEst + this.num('globals', 'delta_temp_chaqueta')),
        psat(tEst) + this.num('esterilizacion', 'presion_add_esterilizacion') + this.num('globals', 'margen_flujo_chaqueta'));
      this.consignaChaqueta = c;
      lo = c - 10; hi = c + 10;
    }
    if (m.pj < lo) o.vapor_chaqueta = true;
    else if (m.pj > hi) o.vapor_chaqueta = false;
    if (m.pj >= 375) o.vapor_chaqueta = false;     // corte único D-CHQ
  }

  // ── Resultado ─────────────────────────────────────────────────────────────────────────
  _filaResultado() {
    const codigo = CODIGO_FASE[this.faseCiclo] ?? ' ';
    this._fila(codigo);
    this._ult.codigo = codigo; this._ult.sub = '';
  }

  _completar() {
    const ant = FASE_UI[this.faseCiclo];
    if (ant) this.faseFin[ant] = this.t;
    this.faseCiclo = 'COMPLETADO';
    this.faseCicloFinal = 'COMPLETADO';
    this.subEstado = '';
    this.resultado = 'exitoso';
    this.tResultado = this.t;
    this.terminacion = { tipo: 'exitoso', codigo: null, motivo: null, fase: null, canceladoPor: null };
    this._salidasCiclo();
    this._filaResultado();
  }

  /**
   * Termina el ciclo en fallo con el código del catálogo y el protocolo de fallo.
   * op: {faseCiclo, valores, motivo:{clave, valores}|{noRegistrado:true}}
   */
  fallar(codigo, op = {}) {
    if (this.resultado) return;
    const fase = this.faseCiclo;
    const ui = FASE_UI[fase];
    if (ui) this.faseFin[ui] = this.t;
    this.faseTerminacion = ui || null;
    this.faseCiclo = op.faseCiclo || `FALLO_${fase}`;
    this.faseCicloFinal = this.faseCiclo;
    this.subEstado = '';
    this.resultado = 'fallo';
    this.tResultado = this.t;
    this.codigo = codigo;
    this.motivo = op.motivo || null;
    this.valores = { ...(op.valores || {}) };
    if (this.valores.fase === undefined && fase) this.valores.fase = fase;
    this.terminacion = { tipo: this.faseCiclo === 'EMERGENCIA' ? 'emergencia' : 'fallo', codigo, motivo: this.motivo,
      fase: ui || null, canceladoPor: null, valores: this.valores };
    this.alarma(codigo, this.valores, this.motivo);
    // El protocolo de fallo toma el mando: las perturbaciones que impedirían llegar a la cámara
    // segura se retiran (simplificación de la demo: el operador «ya corrigió» el suministro)
    if (codigo === 'CIC-24') { this.pl.fx.aireFalla = false; this.pl.fx.fugaAire = 0; }
    if (codigo === 'CIC-04' || codigo === 'CIC-03') { /* el vapor no hace falta en el protocolo */ }
    this.fx.forzarC03 = false;
    this._salidasCiclo(true);
    this.proto = { etapa: 'INICIO', t0: this.t };
    this.descompresionEnfriando = false;
    this._filaResultado();
    this.lineasTicket.push({ tipo: 'error', codigo, motivo: this.motivo });
    if (this.f0Activo) this.lineasTicket.push({ tipo: 'f0', f0: this.f0 });
  }

  cancelar(usuario = '') {
    if (this.resultado) return 'sesion.error_generico';
    const ui = FASE_UI[this.faseCiclo];
    if (ui) this.faseFin[ui] = this.t;
    this.faseTerminacion = ui || null;
    this.faseCiclo = 'CANCELADO';
    this.faseCicloFinal = 'CANCELADO';
    this.subEstado = '';
    this.resultado = 'cancelado';
    this.tResultado = this.t;
    this.canceladoPor = usuario || null;
    this.terminacion = { tipo: 'cancelado', codigo: null, motivo: null, fase: ui || null, canceladoPor: usuario || null };
    if (usuario) this.avisos.push({ clave: 'ticket_ciclo.cancelado_por', params: { usuario }, rotulo: true });
    this._salidasCiclo(true);
    this.proto = { etapa: 'INICIO', t0: this.t };
    this._filaResultado();
    if (this.f0Activo) this.lineasTicket.push({ tipo: 'f0', f0: this.f0 });
    return null;
  }

  // Tras el resultado: válvula de reposo (exitoso) o protocolo de fallo (protocolo_fallo.py)
  _postResultado(m, dt) {
    const o = this.pl.out, atm = this.atm, P = m.pc ?? this.pl.P;
    const rango = EQUIPO.rangoAtm;
    if (this.resultado === 'exitoso') {
      // _mantener_valvula_reposo + aire de reposo con las puertas cerradas
      const escape = this.modoDesc === 2 ? 'descompresion_lenta' : 'descompresion_rapida';
      for (const s of SALIDAS) if (!s.startsWith('bloqueo') && s !== 'vapor_chaqueta') o[s] = false;
      if (P < atm - rango) o.aire_admosferico_camara = true;
      else { o[escape] = true; o.aire_admosferico_camara = P <= atm + rango; }
      this._chaquetaReposo(m);
      this._cic07(m);
      return;
    }
    // Protocolo de fallo / cancelación
    const pr = this.proto;
    for (const s of SALIDAS) if (!s.startsWith('bloqueo')) o[s] = false;
    if (this.fx.presionNull && this.t - pr.t0 > 30) this.fx.presionNull = false;  // simplificación: el sensor vuelve
    if (pr.etapa === 'INICIO') {
      // A13: secado corto tras FALLO o CANCELADO, solo sólidos con secado en el programa; se omite
      // con paro, sensor sin lectura, puerta, falla del vacío o sin energía/datos
      pr.secado = !this.liquido && this.num('secado', 'tiempo_secado') > 0
        && !['SIS-01', 'SEN-02', 'SEN-04', 'PUE-02', 'CIC-02', 'CIC-06', 'SUM-01', 'COM-02'].includes(this.codigo);
      pr.etapa = this.liquido && (m.tc ?? 100) > (this.num('finalizacion', 'temp_max_apertura') || 80) ? 'ENFRIAMIENTO' : 'VENTEO';
      pr.tEtapa = this.t;
    }
    if (pr.etapa === 'ENFRIAMIENTO') {
      const modo = this.modoDesc === 5 ? 5 : 4;
      if (this.fx.presionNull) { o.descompresion_lenta = true; }
      else {
        const listo = this._enfriamiento(m, pr, { modo, soloAviso: true });
        if (listo || (m.tc ?? 0) <= (this.num('finalizacion', 'temp_max_apertura') || 80)) { pr.etapa = 'VENTEO'; pr.tEtapa = this.t; }
      }
    } else if (pr.etapa === 'VENTEO') {
      if (this.fx.presionNull) o.descompresion_lenta = true;
      else if (P > atm + rango) { o.descompresion_lenta = true; if (!this.liquido) o.descompresion_rapida = true; }
      else if (P < atm - rango) o.aire_admosferico_camara = true;
      else if (pr.secado) { pr.etapa = 'SECADO_TF'; pr.tEtapa = this.t; pr.vacioDesde = null; pr.vacioOk = false; }
      else { pr.etapa = 'REPOSO'; this.fx.principalNull = false; }
    } else if (pr.etapa === 'SECADO_TF') {
      // A13: secado corto tras fallo (bomba + vacío) y ruptura con aire
      o.bomba_vacio = true; o.vacio_camara = true;
      if (P < atm - rango) { pr.vacioDesde = pr.vacioDesde ?? this.t; if (this.t - pr.vacioDesde >= 10) pr.vacioOk = true; }
      else pr.vacioDesde = null;
      if (this.t - pr.tEtapa >= 60) { pr.etapa = 'RUPTURA'; pr.tEtapa = this.t; }
    } else if (pr.etapa === 'RUPTURA') {
      o.aire_admosferico_camara = true;
      if (P >= atm - rango || this.t - pr.tEtapa > 120) {
        pr.etapa = 'REPOSO';
        this.avisos.push({ clave: 'ticket_ciclo.secado_tras_fallo', params: {}, rotulo: true,
          valorClave: pr.vacioOk ? 'ticket_ciclo.secado_estado.hecho' : 'ticket_ciclo.secado_estado.sin_vacio', valorParams: { segundos: 60 } });
        this.fx.principalNull = false;
      }
    } else {
      if (P > atm + rango) o.descompresion_rapida = !this.liquido, o.descompresion_lenta = true;
      else o.aire_admosferico_camara = true;
    }
    this._chaquetaReposo(m);
  }

  _chaquetaReposo(m) {
    const o = this.pl.out;
    if (this.liquido && (this.modoDesc === 4 || this.modoDesc === 5)) { o.vapor_chaqueta = false; return; }
    const c = this.num('globals', 'presion_chaqueta') || 300;
    if (m.pj < c) o.vapor_chaqueta = true;
    else if (m.pj > c + 5) o.vapor_chaqueta = false;
  }

  _cic07(m) {
    // CIC-07: pasado timeout_temperatura con la cámara sobre el límite de apertura (aviso, una vez)
    const tMax = Math.min(this.num('finalizacion', 'temp_max_apertura') || 80, 120);
    const limite = this.fx.cic07Adelantado != null ? this.fx.cic07Adelantado : this.tResultado + (this.num('finalizacion', 'timeout_temperatura') || 30) * 60;
    if (!this.cic07Emitido && !this.entrega.entregada && m.tc != null && m.tc > tMax && this.t >= limite) {
      this.cic07Emitido = true;
      this.alarma('CIC-07', { temp: m.tc, maximo: tMax, minutos: (this.t - this.tResultado) / 60 });
    }
    if (this.entrega.entregada) this.resolver('CIC-07');
    if (this.pl.fx.retenerCaliente && this.t >= (this.fx.liberarCalorEn ?? Infinity)) this.pl.fx.retenerCaliente = 0;
  }

  /** Motivos de cámara no segura (camara_segura.motivos), con valor y límite. */
  motivosCamara(m = this.m) {
    const atm = this.atm, r = EQUIPO.rangoAtm;
    const out = [];
    if (this.proto && ['VENTEO', 'SECADO_TF', 'RUPTURA'].includes(this.proto.etapa) && this.proto.secado) {
      out.push({ clave: 'puerta.secando_vapor_residual', valores: {} });
    }
    if (m.pc == null) out.push({ clave: 'puerta.sin_presion_camara', valores: {} });
    else if (m.pc > atm + r) out.push({ clave: 'puerta.sobrepresion', valores: { pres: m.pc, pres_max: atm + r } });
    else if (m.pc < atm - r) out.push({ clave: 'puerta.vacio', valores: { pres: m.pc, pres_min: atm - r } });
    const tMax = Math.min(this.num('finalizacion', 'temp_max_apertura') || EQUIPO.tempMaxApertura, 120);
    if (m.tc == null) out.push({ clave: 'puerta.sin_temp_camara', valores: {} });
    else if (m.tc > tMax) out.push({ clave: 'puerta.temp_alta', valores: { temp: m.tc, temp_max: tMax } });
    return out;
  }

  _evaluarEntrega(m) {
    // entrega_camara.py: sin motivos durante 3 tramas seguidas; con el paro soltado no hace falta
    const motivos = this.motivosCamara(m);
    this.entrega.motivos = motivos;
    if (motivos.length === 0 && !this.paro && !(this.t < this.sinEnergiaHasta)) this.entrega.cuenta += 1;
    else this.entrega.cuenta = 0;
    if (this.entrega.cuenta >= 3) {
      this.entrega.entregada = true;
      this.entrega.tEntrega = this.t;
      this.entrega.motivos = [];
      this._fila('E');
    }
  }

  puedeConfirmar() {
    if (!this.resultado) return false;
    if (this.entrega.entregada) return true;
    // ack_confirma_estado_seguro: con el paro soltado no espera la entrega
    return this.codigo === 'SIS-01' && !this.paro;
  }

  confirmar({ forzar = false, usuario = '' } = {}) {
    if (!this.resultado) return 'sesion.error_generico';
    if (this.paro) return 'sesion.camara_no_entregada';
    if (!this.puedeConfirmar() && !forzar) return 'sesion.camara_no_entregada';
    if (!this.entrega.entregada) {
      if (forzar) {
        this.confirmacionForzada = { usuario, motivos: this.entrega.motivos.slice() };
        this.avisos.push({ clave: 'ticket_ciclo.confirmado_forzado', params: { usuario: usuario || '—' }, motivos: this.entrega.motivos.slice() });
      } else if (this.codigo === 'SIS-01') {
        this.confirmadoTrasParo = true;
        this.avisos.push({ clave: 'ticket_ciclo.confirmado_tras_paro', params: {} });
      }
      this._fila('E');
    }
    this.confirmado = true;
    this.tConfirmacion = this.t;
    for (const a of this.alarmas) if (a.despeje === 'AUTO' && a.resuelta == null) a.resuelta = this.t;
    return null;
  }

  // ── Perturbaciones de los fallos (panel oculto) ──────────────────────────────────────
  aplicaFallo(def) {
    if (!def) return false;
    if (def.cargas && !def.cargas.includes(this.liquido ? 'liquido' : 'solido')) return false;
    if (!this.resultado) {
      if (!def.fases.includes(this.faseCiclo)) return false;
      if (def.codigo === 'CIC-25' || def.codigo === 'CIC-24') return this.fs.sub === 'ENFRIAMIENTO' && this.fs.e?.a;
      if (def.codigo === 'CIC-05' && this.fs.sub === 'DESCOMPRESION_FINAL') return true;
      return true;
    }
    return def.fases.includes('ESPERA') && this.resultado === 'exitoso' && !this.entrega.entregada;
  }

  /** Aplica el fallo `codigo` con su efecto real. Devuelve null o un motivo de rechazo. */
  inyectar(def) {
    if (!this.aplicaFallo(def)) return 'no_aplica';
    const pl = this.pl, vel = Math.max(1, this.op.escalaReal || 1);
    switch (def.codigo) {
      case 'SIS-01':
        this.paro = { liberaEn: this.t + 8 * vel };
        this._salidasCiclo(true);
        this.fallar('SIS-01', { faseCiclo: 'EMERGENCIA', valores: { estado: 'CICLO' } });
        break;
      case 'SEN-02': this.fx.principalNull = true; break;
      case 'SEN-04': this.fx.presionNull = true; break;
      case 'PUE-02': this.puertaSensorHasta = this.t + 3 * vel; break;
      case 'SUM-01':
        this.sinEnergiaHasta = this.t + 5 * vel;
        this.fallar('SUM-01', { faseCiclo: 'FALLO_SUMINISTRO', valores: { fase: this.faseCiclo } });
        break;
      case 'COM-02':
        this.sinEnergiaHasta = this.t + 4 * vel;
        this.fallar('COM-02', { faseCiclo: 'FALLO_CONEXION', valores: { segundos: 3.0, fase: this.faseCiclo } });
        break;
      case 'CIC-02': pl.fx.bombaFalla = true; this._cic02Pendiente = true; break;
      case 'CIC-03': pl.fx.sinVapor = true; this.fs.limite = Math.min(this.fs.limite ?? Infinity, this.t + 20); break;
      case 'CIC-04': pl.fx.sinVapor = true; break;
      case 'CIC-12': pl.fx.aireInyectado = 40; this.fx.forzarC03 = true; break;
      case 'CIC-05': pl.fx.rapidaPegada = true; this.fs.limite = Math.min(this.fs.limite ?? Infinity, this.t + 20); break;
      case 'CIC-06': pl.fx.bombaFalla = true; pl.fx.fugaAire = 0.03; break;
      case 'SEN-11': case 'CIC-19': this.fx.refNull = true; break;
      case 'CIC-09': this.fx.refOffset = -4; this.fx.refOffsetHasta = this.t + 30; break;
      case 'CIC-25': pl.fx.aireFalla = true; pl.fx.fugaAire = 0.03; this._restaurarAireEn = this.t + 25; break;
      case 'CIC-24': pl.fx.aireFalla = true; pl.fx.fugaAire = 0.03; this._restaurarAireEn = null; break;
      case 'CIC-07':
        pl.fx.retenerCaliente = 92;
        this.fx.liberarCalorEn = (this.resultado ? this.t : this.t + 60) + 90;
        this.fx.cic07Adelantado = (this.resultado ? this.t : this.t + 30) + 20;
        break;
      default: return 'no_aplica';
    }
    return null;
  }

  /** Limpieza de perturbaciones temporales (se llama en cada paso desde el motor/simulador). */
  revisarPerturbaciones() {
    const pl = this.pl;
    if (this._restaurarAireEn != null && this.t >= this._restaurarAireEn) {
      pl.fx.aireFalla = false; pl.fx.fugaAire = 0; this._restaurarAireEn = null;
    }
    if (this._cic02Pendiente && this.faseCiclo === 'PRE_VACIO' && this.fs.sub === 'VACIO_BAJO' && this.fs.limiteBajo == null) {
      this.fs.limiteBajo = this.t + 20;
    }
  }

  /** Quita todas las perturbaciones de la planta (al confirmar). */
  limpiarPerturbaciones() {
    this.pl.fx = {};
    this.fx = {};
  }

  // ── Registro: filas de la tirilla y serie de la gráfica ──────────────────────────────
  horaReal(t) { return this.inicio + t * 1000; }

  _fila(codigo) {
    const m = this.m;
    this.lineasTicket.push({ tipo: 'fila', codigo, t: this.t, tc: m.tc, pc: m.pc });
    this._ult.tFila = this.t;
  }

  _registrar(m) {
    if (m.tc != null) this.tempMax = Math.max(this.tempMax, m.tc);
    if (m.pc != null) this.presMax = Math.max(this.presMax, m.pc);
    // Filas (cycle_logger._tick): al cambiar de código de fase o de sub-estado; periódicas en H y S
    // El registrador mira el estado una vez por segundo simulado (como su hilo real).
    const segundo = Math.floor(this.t) !== Math.floor(this.t - DT_MAX + 1e-9);
    if (segundo && !this.entrega.entregada && !this.confirmado) {
      const codigo = CODIGO_FASE[this.faseCiclo] ?? ' ';
      if (codigo !== this._ult.codigo || this.subEstado !== this._ult.sub) {
        this._fila(codigo);
        this._ult.codigo = codigo; this._ult.sub = this.subEstado;
      } else {
        let intervalo = null;
        if (!this.resultado && codigo === 'H') intervalo = EQUIPO.intervaloImpresion;
        else if (!this.resultado && codigo === 'S') intervalo = EQUIPO.intervaloImpresionEst;
        else if (this.resultado) intervalo = EQUIPO.intervaloImpresion;    // filas de la espera (ENT-07)
        if (intervalo && this.t - this._ult.tFila >= intervalo) this._fila(this.resultado ? 'E' : codigo);
      }
    }
    // Serie: una muestra por segundo simulado (submuestreo si crece demasiado)
    // La gráfica sigue muestreando hasta la entrega (ENT-09); después queda fija.
    if (this.t >= this._proxMuestra && !this.entrega.entregada) {
      this.serie.push({ t: Math.round(this.t), tc: m.tc, tr: m.tr, pc: m.pc, pj: m.pj, fase: this.faseUi || this.faseCiclo });
      this._proxMuestra = this.t + this.periodoSerie;
      if (this.serie.length > 7200) {
        this.serie = this.serie.filter((_, i) => i % 2 === 0);
        this.periodoSerie *= 2;
      }
    }
  }

  // ── Progreso (GET /cycle/current/progress) ───────────────────────────────────────────
  /** @param refs {faseUi: segundos} duraciones de referencia (último ciclo completado o nominal) */
  progreso(refs = {}) {
    const activa = this.faseUi;
    const est = {};
    const fases = this.aplicables.map((f) => {
      let estado, dur;
      if (f === activa) { estado = 'activa'; dur = this.t - (this.faseIni[f] ?? this.t); }
      else if (this.faseFin[f] != null) { estado = 'completada'; dur = this.faseFin[f] - this.faseIni[f]; }
      else { estado = 'pendiente'; dur = null; }
      est[f] = estado;
      return { fase: f, estado, duracionS: dur };
    });
    if (this.resultado === 'fallo' || this.resultado === 'cancelado') {
      const corte = this.aplicables.indexOf(this.faseTerminacion);
      if (corte >= 0) fases.forEach((it, i) => {
        if (i < corte) it.estado = 'completada';
        else if (i === corte) it.estado = this.resultado === 'cancelado' ? 'interrumpida' : 'fallida';
        else { it.estado = 'pendiente'; it.duracionS = null; }
      });
    }
    const restanteFase = (e, ref) => (e < ref ? ref - e : EXTENSION_S - ((e - ref) % EXTENSION_S));
    const acotar = (x) => Math.round(clamp(x, 0, TOPE_FRACCION_ACTIVA) * 10000) / 10000;
    for (const it of fases) {
      const propio = it.fase === 'esterilizacion' && it.estado === 'activa';
      const ref = refs[it.fase] > 0 ? refs[it.fase] : null;
      if (it.estado === 'completada') it.fraccion = 1;
      else if (it.estado === 'pendiente') it.fraccion = 0;
      else if (it.estado !== 'activa') it.fraccion = null;
      else if (propio) {
        it.fraccion = this.exposicionRestante != null && this.exposicionTotal > 0
          ? acotar(1 - this.exposicionRestante / this.exposicionTotal) : 0;
      } else if (ref == null) it.fraccion = null;
      else { const e = it.duracionS || 0; const r = restanteFase(e, ref); it.fraccion = e + r > 0 ? acotar(e / (e + r)) : 0; }
      it.referenciaS = propio ? this.exposicionTotal : ref;
    }
    let restante = null;
    if (activa) {
      const pend = this.aplicables.slice(this.aplicables.indexOf(activa));
      const usaPropio = activa === 'esterilizacion' && this.exposicionRestante != null;
      const necesarias = usaPropio ? pend.slice(1) : pend;
      if (necesarias.every((f) => refs[f] > 0)) {
        const e = this.t - (this.faseIni[activa] ?? this.t);
        restante = (usaPropio ? this.exposicionRestante : restanteFase(e, refs[activa]))
          + pend.slice(1).reduce((s, f) => s + refs[f], 0);
      }
    } else if (this.resultado === 'exitoso') restante = 0;
    // ENT-09: el transcurrido sigue hasta la entrega de la cámara y ahí se detiene.
    const transcurrido = this.entrega.entregada && this.entrega.tEntrega != null ? this.entrega.tEntrega : this.t;
    return { faseActiva: activa, fases, transcurridoS: transcurrido, restanteS: restante, detalleFase: this.detalleFase() };
  }

  /** progreso_ciclo.detalle_fase en camelCase. */
  detalleFase() {
    const a = this.faseUi, m = this.m;
    if (!a) return null;
    switch (a) {
      case 'precalentamiento': return { tipo: 'presion', actual: m.pj, objetivo: this.num('precalentamiento', 'presion_precalentamiento') };
      case 'vacio': {
        const fs = this.fs;
        if (!fs.pulsos) return { tipo: 'prevacio', pulso: null, total: null, nivel: null };
        const nivel = ['DECOMPRESION', 'VACIO_BAJO', 'HOLD_BAJO', 'APAGANDO_VACIO'].includes(fs.sub) ? 'bajo' : 'alto';
        return { tipo: 'prevacio', pulso: fs.i + 1, total: fs.pulsos.length, nivel };
      }
      case 'calentamiento':
        if (this.estabilizacion) return { tipo: 'estabilizando', transcurridoS: this.estabilizacion.s, totalS: this.estabilizacion.total };
        return { tipo: 'temperatura', actual: m.tc, objetivo: this.tObj };
      case 'esterilizacion':
        return { tipo: 'exposicion', transcurridoS: this.exposicionRestante != null ? this.exposicionTotal - this.exposicionRestante : 0,
          totalS: this.exposicionTotal, f0: this.f0Activo ? this.f0 : null, f0Objetivo: this.f0Activo ? this.f0Objetivo : null };
      case 'descompresion':
        if (this.descompresionEnfriando) return { tipo: 'temperatura', actual: m.tc, objetivo: this.num('descompresion', `modo_${this.modoDesc}`, 'temperatura_enfriamiento') || 80 };
        return { tipo: 'presion', actual: m.pc, objetivo: this.atm + (this.modoDesc === 0 ? EQUIPO.rangoAtm : this.num('descompresion', 'presion_fin_descompresion')) };
      case 'secado':
        return { tipo: 'tiempo', transcurridoS: this.secado?.s ?? 0, totalS: this.secado?.total ?? this.num('secado', 'tiempo_secado') * 60 };
    }
    return null;
  }

  /** Datos crudos de la tirilla (tirilla.js los convierte en texto en el idioma vigente). */
  datosTicket() {
    const fin = this.entrega.tEntrega ?? this.tConfirmacion ?? this.t;
    return {
      cabecera: { inicio: this.inicio, serie: EQUIPO.serie, modelo: EQUIPO.modelo, version: EQUIPO.version,
        numero: this.numero, programaId: this.prog.id, nombreClave: this.prog.nombreClave, displayName: this.prog.displayName,
        tempEster: this.tEst, tiempoEster: this.exposicionTotal / 60, f0Activo: this.f0Activo, f0Objetivo: this.f0Objetivo },
      lineas: this.lineasTicket.slice(),
      pie: { estado: this.faseCicloFinal, codigo: this.codigo, f0Total: this.f0Activo ? this.f0 : null,
        avisos: this.avisos.slice(), observaciones: this.observaciones.slice(),
        horaFin: this.horaReal(fin), operador: this.operador, tempFinal: this.m.tc ?? this.pl.T },
    };
  }
}

/** Ciclo completo en modo rápido (sin animación). op: {semilla, numero, operador, inicio,
 *  fallo:{codigo, fase, tras}, cancelar:{fase, tras, usuario}, ruido} -> Corrida terminada y confirmada. */
export function simularRapido(prog, op = {}, catalogo = null) {
  const pl = new Planta({ preparada: true });
  const rnd = op.semilla != null ? generadorAleatorio(op.semilla) : Math.random;
  const c = new Corrida(pl, prog, { numero: op.numero, operador: op.operador, inicio: op.inicio, rnd, ruido: op.ruido !== false, escalaReal: 1 });
  let inyectado = false, cancelado = false;
  const tMax = 6 * 3600;
  while (c.t < tMax) {
    c.paso(DT_MAX);
    c.revisarPerturbaciones();
    if (op.fallo && !inyectado && !c.resultado && c.faseCiclo === op.fallo.fase && c.t - c.fs.t0 >= (op.fallo.tras ?? 20)) {
      const def = catalogo ? catalogo(op.fallo.codigo) : null;
      if (def && c.aplicaFallo(def)) { c.inyectar(def); inyectado = true; }
    }
    if (op.cancelar && !cancelado && !c.resultado && c.faseCiclo === op.cancelar.fase && c.t - c.fs.t0 >= (op.cancelar.tras ?? 20)) {
      c.cancelar(op.cancelar.usuario || op.operador || ''); cancelado = true;
    }
    if (c.resultado && c.puedeConfirmar()) { c.confirmar({}); break; }
    if (c.resultado && c.t - c.tResultado > 3600) { c.confirmar({ forzar: true, usuario: '' }); break; }
  }
  return c;
}

/** Duraciones nominales por fase y total de un programa (ensayo rápido sin ruido), con caché. */
const cacheNominal = new Map();
export function duracionNominal(prog) {
  const clave = prog.id + JSON.stringify(prog.parametros);
  if (cacheNominal.has(clave)) return cacheNominal.get(clave);
  const c = simularRapido(prog, { ruido: false, numero: 0 });
  const fases = {};
  for (const f of c.aplicables) if (c.faseFin[f] != null) fases[f] = c.faseFin[f] - c.faseIni[f];
  const r = { total: Math.max(60, c.entrega.tEntrega ?? c.t), fases, resultado: c.resultado };
  cacheNominal.set(clave, r);
  return r;
}
