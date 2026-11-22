// Simulador del equipo para la demo: API `sim` y forma de `sim.estado` de DESARROLLO.md.
// El núcleo físico y la máquina de fases están en ciclo.js (puro); aquí vive el equipo en
// vivo: estados PREPARACION / PREPARADO / CICLO / FALLA, puertas, alarmas, reloj, velocidad
// y la publicación de `sim.estado` (~10 Hz real) con emit('sim').
//
// Tiempo: el reloj de pared es real (`ahora`); el ciclo corre en segundos SIMULADOS con
// velocidad = duración nominal del programa / 180 s (≈3 min reales por ciclo), multiplicada por
// ?vel=N de la URL (solo pruebas). Integración en pasos de <= 0,5 s simulados (subpasos).
// Fuera de ciclo el equipo corre a VEL_REPOSO (x4) para que la chaqueta caliente en segundos.
//
// Añadidos respecto a DESARROLLO.md (no se quitó ni renombró nada):
//   sim.habilitarPrograma(id, bool) -> null | clave   (Prion viene deshabilitado de fábrica)
//   sim.restaurarPrograma(id?)                          (vuelve a los valores de fábrica)
//   sim.ultimoRechazo  {clave, params, texto} del último rechazo con parámetros (puertas, inicio)
//   sim.dispararFallo(codigo) -> null | 'sin_ciclo' | 'no_aplica' | 'desconocido'
//   sim.confirmarCiclo({forzar, usuario})  (usuario: texto u objeto de sesión, para la tirilla)
//   estado.vaciadoChaqueta, estado.paro, estado.equipo, estado.sensores.temp_2_camara,
//   estado.salidas.aire_atmosferico_camara (alias del nombre interno aire_admosferico_camara),
//   ciclo.subEstado (nombre interno real), ciclo.prevacioProgreso, ciclo.exposicionRestanteS,
//   ciclo.exposicionTotalS, ciclo.presionTrabajo, ciclo.consignaChaqueta, ciclo.velocidad.
import { emit, on } from '../core/eventos.js';
import { t, idioma } from '../core/i18n.js';
import { leer, guardar, borrar } from '../core/almacen.js';
import { Planta, Corrida, controlReposo, duracionNominal, DT_MAX, EQUIPO, FASE_UI } from './ciclo.js';
import * as P from './programas.js';
import { FALLOS, fallo as defFallo, datosAlarma, codigoVisible, formatearPlantilla, MOTIVO_NO_REGISTRADO } from './fallos.js';
import * as historial from './historial.js';

const DURACION_OBJETIVO_S = 180;   // ≈3 min reales por ciclo
const VEL_REPOSO = 4;
const TICK_MS = 100;
const T_PUERTA_MS = 2500;
const CLAVE_PROGRAMA = 'sim:programa';

function leerVelParam() {
  try {
    const v = Number(new URLSearchParams(globalThis.location?.search || '').get('vel'));
    return Number.isFinite(v) && v > 0 ? v : 1;
  } catch { return 1; }
}

// ── Estado interno ───────────────────────────────────────────────────────────────────────
const velParam = leerVelParam();
let planta = new Planta();
let maquina = 'PREPARACION';
let programaId = leer(CLAVE_PROGRAMA, P.PROGRAMA_POR_DEFECTO) || P.PROGRAMA_POR_DEFECTO;
if (!P.obtenerPrograma(programaId)) programaId = P.PROGRAMA_POR_DEFECTO;
let corrida = null;
let velCiclo = 1;
let refsCiclo = {};
let resultadoEmitido = false;
const puertas = { 1: 'CERRADA', 2: 'CERRADA' };
const movPuerta = {};           // n -> {destino, hasta}
let alarmas = [];               // globales
let secAlarma = 1;
let ultimoCiclo = null;
let vaciado = 'INACTIVO';
let tVaciado = 0;
const ctxReposo = {};
let ultimoTick = Date.now();
let intervalo = null;
let estado = null;
let cacheProgramas = null;
let mOff = null;                // última medida fuera de ciclo

on('idioma', () => { cacheProgramas = null; });

function rnd(a) { return (Math.random() * 2 - 1) * a; }
const r1 = (x) => Math.round(x * 10) / 10;

function medirReposo() {
  return { tc: r1(planta.T + rnd(0.1)), pc: r1(planta.P + rnd(0.3)), tr: r1(planta.Tref + rnd(0.1)),
    t2: r1(planta.T2 + rnd(0.1)), td: r1(planta.Td + rnd(0.2)), pj: r1(planta.Pj + rnd(0.3)) };
}

// ── Textos ───────────────────────────────────────────────────────────────────────────────
const PUERTAS_TXT = { es: (n) => `Puerta ${n}`, en: (n) => `Door ${n}` };
function traducirValores(valores = {}) {
  const v = {};
  for (const [k, x] of Object.entries(valores)) {
    if (k.endsWith('Clave')) { v[k.slice(0, -5)] = t(x); continue; }
    if ((k === 'sensor' || k === 'sensores') && typeof x === 'string') {
      const c = `io.ai.${x}`; const s = t(c); v[k] = s === c ? x : s; continue;
    }
    if (k === 'puerta' && typeof x === 'string' && /^puerta_\d$/.test(x)) { v[k] = (PUERTAS_TXT[idioma()] || PUERTAS_TXT.es)(x.slice(-1)); continue; }
    v[k] = x;
  }
  return v;
}
function textoMotivo(motivo) {
  if (!motivo) return null;
  if (motivo.noRegistrado) return MOTIVO_NO_REGISTRADO[idioma()] || MOTIVO_NO_REGISTRADO.es;
  return formatearPlantilla(t(motivo.clave), traducirValores(motivo.valores));
}
function descripcionAlarma(codigo, valores, motivo) {
  const v = traducirValores(valores);
  if (motivo) v.motivo = textoMotivo(motivo);
  const pl = t(`alarmas.${codigo}.plantilla`);
  return pl === `alarmas.${codigo}.plantilla` ? '' : formatearPlantilla(pl, v);
}
function textoMotivoCamara(mo) {
  const v = { ...mo.valores };
  for (const k of Object.keys(v)) {
    if (typeof v[k] !== 'number') continue;
    if (k.startsWith('temp')) v[k] = `${Math.round(v[k])} °C`;
    if (k.startsWith('pres')) v[k] = `${Math.round(v[k])} kPa`;
  }
  return t(mo.clave, v);
}

// ── Alarmas globales ─────────────────────────────────────────────────────────────────────
function agregarAlarma({ codigo, valores = {}, motivo = null, enCiclo = false, origen = null, aparecida = Date.now() }) {
  const d = datosAlarma(codigo);
  const a = { id: `a${secAlarma++}`, codigo, valores, motivo, nivel: d.nivel, bloqueante: d.bloqueante,
    despeje: d.despeje, aparecida, reconocida: false, enCiclo, origen };
  alarmas.push(a);
  emit('alarma-nueva', vistaAlarma(a));
  return a;
}
function quitarAlarmas(pred) { alarmas = alarmas.filter((a) => !pred(a)); }

function vistaAlarma(a) {
  return { id: a.id, codigo: a.codigo, codigoVisible: codigoVisible(a.codigo), nivel: a.nivel,
    titulo: t(`alarmas.${a.codigo}.titulo`), descripcion: descripcionAlarma(a.codigo, a.valores, a.motivo),
    accion: t(`alarmas.${a.codigo}.accion`), bloqueante: a.bloqueante, despeje: a.despeje,
    aparecida: a.aparecida, reconocida: a.reconocida, enCiclo: a.enCiclo };
}

/** Refleja en la lista global las alarmas de la corrida (nuevas y despejadas solas). */
function sincronizarAlarmasCiclo() {
  if (!corrida) return;
  for (const ca of corrida.alarmas) {
    let g = alarmas.find((a) => a.origen === ca);
    if (!g && ca.resuelta == null && !ca._vista) {
      ca._vista = true;
      g = agregarAlarma({ codigo: ca.codigo, valores: ca.valores, motivo: ca.motivo,
        enCiclo: true, origen: ca, aparecida: corrida.horaReal(ca.aparecida) });
    }
    if (g && ca.resuelta != null && ca.despeje === 'AUTO') quitarAlarmas((a) => a === g);
  }
}

function vigilarPuertasReposo() {
  const abierta = [1, 2].find((n) => puertas[n] !== 'CERRADA');
  const act = alarmas.find((a) => a.codigo === 'PUE-01');
  if (abierta && maquina !== 'CICLO' && !act) agregarAlarma({ codigo: 'PUE-01', valores: { puerta: `puerta_${abierta}` } });
  if ((!abierta || maquina === 'CICLO') && act) quitarAlarmas((a) => a.codigo === 'PUE-01');
}

// ── Programas ────────────────────────────────────────────────────────────────────────────
function listaProgramas() {
  if (!cacheProgramas) {
    cacheProgramas = P.listarProgramas().map((p) => ({ ...p, nombre: p.nombreClave ? t(p.nombreClave) : p.displayName }));
  }
  return cacheProgramas;
}
function programaSel() { return listaProgramas().find((p) => p.id === programaId) || null; }

// ── Reloj del simulador ──────────────────────────────────────────────────────────────────
function chaquetaEnBanda(m) {
  const prog = programaSel();
  const obj = Number(P.valor(prog, 'globals', 'presion_chaqueta') ?? 300);
  const rango = Number(P.valor(prog, 'globals', 'rango_presion_chaqueta') ?? 50);
  return m.pj != null && m.pj >= obj - rango && m.pj <= obj + rango;
}

function paso() {
  const ahora = Date.now();
  const dtReal = Math.min(1, Math.max(0, (ahora - ultimoTick) / 1000));
  ultimoTick = ahora;
  // Tras la entrega de la cámara el ciclo espera la confirmación a tiempo real.
  const vel = corrida ? (corrida.entrega?.entregada ? velParam : velCiclo) : VEL_REPOSO * velParam;
  const dtSim = dtReal * vel;
  const n = Math.max(1, Math.ceil(dtSim / DT_MAX - 1e-9));
  const h = dtSim / n;
  ctxReposo.presionChaqueta = Number(P.valor(programaSel(), 'globals', 'presion_chaqueta') ?? 300);
  // puertas (tiempo real)
  for (const k of [1, 2]) {
    const mv = movPuerta[k];
    if (mv && ahora >= mv.hasta) { puertas[k] = mv.destino; delete movPuerta[k]; }
    planta.puertaAbierta[k] = puertas[k] !== 'CERRADA';
  }
  if (h > 0) {
    for (let i = 0; i < n; i++) {
      if (corrida) corrida.paso(h);
      else {
        ctxReposo.vaciado = vaciado; ctxReposo.tVaciado = tVaciado;
        controlReposo(planta, ctxReposo);
        planta.paso(h);
        if (vaciado === 'EN_CURSO') tVaciado += h;
      }
    }
  }
  if (corrida) {
    sincronizarAlarmasCiclo();
    if (corrida.resultado && !resultadoEmitido) {
      resultadoEmitido = true;
      const vista = vistaCiclo();
      queueMicrotask(() => emit('ciclo-terminado', vista));
    }
  } else {
    mOff = medirReposo();
    // PREPARACION -> PREPARADO con la chaqueta en banda (preparacion.run)
    if (maquina === 'PREPARACION' && chaquetaEnBanda(mOff)) maquina = 'PREPARADO';
    // Vaciado de chaqueta tras líquidos 4/5 (preparado._vaciado_chaqueta)
    if (vaciado === 'PENDIENTE' && [1, 2].some((k) => puertas[k] === 'ABIERTA')) { vaciado = 'EN_CURSO'; tVaciado = 0; }
    else if (vaciado === 'EN_CURSO' && (tVaciado >= 30 || [1, 2].every((k) => puertas[k] === 'CERRADA'))) vaciado = 'HECHO';
  }
  vigilarPuertasReposo();
  estado = construirEstado(ahora);
  emit('sim', estado);
}

// ── Construcción de sim.estado ───────────────────────────────────────────────────────────
const SUB_ETAPA = { RAMPA: 'RAMPA', ESTABLE_PREESTERILIZACION: 'ESTABLE', RECUPERACION: 'RECUPERACION', PWM_ACTIVO: 'PWM',
  enfriamiento: 'ENFRIAMIENTO', descompresion: 'DESCOMPRESION', VACIO_BAJO: 'VACIO_BAJO', AIRE_ALTO: 'AIRE_ALTO' };

function vistaCiclo() {
  const c = corrida;
  if (!c) return null;
  const pr = c.progreso(refsCiclo);
  const horaFin = c.tResultado != null ? c.horaReal(c.tResultado) : null;
  let terminacion = null;
  if (c.terminacion) {
    const tm = c.terminacion;
    terminacion = {
      tipo: tm.tipo, codigo: tm.codigo, codigoVisible: tm.codigo ? codigoVisible(tm.codigo) : null,
      titulo: tm.codigo ? t(`alarmas.${tm.codigo}.titulo`) : null,
      motivo: tm.codigo ? (tm.motivo ? textoMotivo(tm.motivo) : descripcionAlarma(tm.codigo, c.valores, null)) : null,
      accion: tm.codigo ? t(`alarmas.${tm.codigo}.accion`) : null,
      valores: c.valores, fase: tm.fase, horaFin, canceladoPor: tm.canceladoPor,
      observaciones: c.observaciones.map((o) => ({ sensor: traducirValores({ sensor: o.sensor }).sensor, hora: c.horaReal(o.t), fase: o.fase })),
    };
  }
  const sub = c.faseCiclo === 'PRE_VACIO' && c.prevacioProgreso ? c.prevacioProgreso.replace(/\s+/, ' ') : (SUB_ETAPA[c.subEstado] ?? (c.subEstado || null));
  return {
    id: `c${c.numero}-${c.inicio}`, numero: c.numero, programaId: c.prog.id,
    programaNombre: c.prog.nombreClave ? t(c.prog.nombreClave) : c.prog.displayName,
    operador: c.operador, inicio: c.inicio, tipoCarga: c.prog.tipoCarga,
    faseCiclo: c.faseCiclo, faseActiva: pr.faseActiva, subEtapa: c.resultado ? null : sub, subEstado: c.subEstado || null,
    fases: pr.fases, transcurridoS: pr.transcurridoS, restanteS: pr.restanteS, detalleFase: pr.detalleFase,
    f0: c.f0Activo ? Math.round(c.f0 * 100) / 100 : null, f0Activo: c.f0Activo, f0Objetivo: c.f0Activo ? c.f0Objetivo : null,
    resultado: c.resultado, terminacion,
    alarmasCiclo: c.alarmas.map((a) => ({ codigo: a.codigo, codigoVisible: codigoVisible(a.codigo), nivel: a.nivel,
      titulo: t(`alarmas.${a.codigo}.titulo`), descripcion: descripcionAlarma(a.codigo, a.valores, a.motivo),
      accion: t(`alarmas.${a.codigo}.accion`), aparecida: c.horaReal(a.aparecida),
      resuelta: a.resuelta != null ? c.horaReal(a.resuelta) : null })),
    entrega: c.resultado ? {
      entregada: c.entrega.entregada, motivos: c.entrega.entregada ? [] : c.entrega.motivos.map(textoMotivoCamara),
      esperaRestanteS: c.entrega.entregada ? null : 0, forzable: !c.entrega.entregada && !c.paro,
    } : { entregada: false, motivos: [], esperaRestanteS: null, forzable: false },
    serie: c.serie,
    prevacioProgreso: c.prevacioProgreso || null,
    exposicionRestanteS: c.exposicionRestante, exposicionTotalS: c.exposicionTotal,
    presionTrabajo: c.presionTrabajo, consignaChaqueta: c.consignaChaqueta ?? null, velocidad: velCiclo,
    confirmadoTrasParo: c.confirmadoTrasParo, confirmacionForzada: !!c.confirmacionForzada,
  };
}

function motivosReposo(m) {
  const atm = planta.atm, r = EQUIPO.rangoAtm;
  const prog = programaSel();
  const tMax = Math.min(Number(P.valor(prog, 'finalizacion', 'temp_max_apertura') ?? EQUIPO.tempMaxApertura), 120);
  const out = [];
  if (m.pc > atm + r) out.push({ clave: 'puerta.sobrepresion', valores: { pres: m.pc, pres_max: atm + r } });
  else if (m.pc < atm - r) out.push({ clave: 'puerta.vacio', valores: { pres: m.pc, pres_min: atm - r } });
  if (m.tc > tMax) out.push({ clave: 'puerta.temp_alta', valores: { temp: m.tc, temp_max: tMax } });
  return out;
}

function construirEstado(ahora) {
  const m = corrida ? corrida.m : (mOff || medirReposo());
  const o = planta.out;
  const salidas = { ...o, aire_atmosferico_camara: o.aire_admosferico_camara };
  const sinAck = alarmas.some((a) => !a.reconocida && (a.nivel === 'alta' || a.nivel === 'media'));
  salidas.buzer_alarma = sinAck && Math.floor(ahora / 400) % 2 === 0;
  const fx = planta.fx;
  const paroActivo = !!corrida?.paro;
  const sinEnergia = corrida ? corrida.t < corrida.sinEnergiaHasta : false;
  const puertaSensor = corrida ? corrida.t < corrida.puertaSensorHasta : false;
  const entradas = {
    aire_comprimido: !fx.aireFalla, presion_agua: true,
    puerta_1_cerrada: puertas[1] === 'CERRADA' && !puertaSensor, puerta_1_abierta: puertas[1] === 'ABIERTA',
    puerta_2_cerrada: puertas[2] === 'CERRADA', puerta_2_abierta: puertas[2] === 'ABIERTA',
    atrapamiento_puerta_1: false, atrapamiento_puerta_2: false,
    agua_bomba: true, agua_generador: true,
    paro_emergencia: !paroActivo,          // contacto NC: true = circuito cerrado (paro no pulsado)
    agua_camara: false, vapor_suministro: !fx.sinVapor, suministro_electrico: !sinEnergia,
  };
  const motivos = corrida ? corrida.motivosCamara(m) : motivosReposo(m);
  const camaraSegura = motivos.length === 0;
  const prog = programaSel();
  const listo = maquina === 'PREPARADO' && [1, 2].every((k) => puertas[k] === 'CERRADA') && chaquetaEnBanda(m)
    && !alarmas.some((a) => a.bloqueante && a.codigo !== 'PUE-01') && vaciado !== 'PENDIENTE' && vaciado !== 'EN_CURSO'
    && prog?.habilitado !== false;
  return Object.freeze({
    maquina, listo, programaId, velocidad: corrida ? velCiclo : VEL_REPOSO * velParam, ahora,
    puertas: { ...puertas }, numPuertas: 2,
    sensores: { temp_camara: m.tc, temp_ref: m.tr, temp_drenaje: m.td, pres_camara: m.pc, pres_chaqueta: m.pj, temp_2_camara: m.t2 },
    salidas, entradas,
    camaraSegura, noAbrirMotivo: camaraSegura ? null : textoMotivoCamara(motivos[0]),
    alarmas: alarmas.map(vistaAlarma),
    ciclo: vistaCiclo(),
    ultimoCiclo,
    vaciadoChaqueta: vaciado,
    paro: { activo: paroActivo, requiereConfirmacion: false },
    equipo: { serie: EQUIPO.serie, modelo: EQUIPO.modelo, version: EQUIPO.version, presionAtm: EQUIPO.presionAtm },
  });
}

function nombreUsuario(u) {
  if (!u) return '';
  if (typeof u === 'string') return u;
  return u.nombre || u.usuario || '';
}
function publicar() { estado = construirEstado(Date.now()); emit('sim', estado); }

// ── API pública ──────────────────────────────────────────────────────────────────────────
export const sim = {
  get estado() { return estado || construirEstado(Date.now()); },
  /** Registro del ciclo en curso con los datos de la tirilla (para verla en vivo); null sin ciclo. */
  registroEnCurso() {
    if (!corrida) return null;
    try { return historial.registroDeCorrida(corrida); } catch (e) { console.warn('[sim] registro en curso:', e); return null; }
  },
  ultimoRechazo: null,

  arrancar() {
    if (intervalo) return;
    ultimoTick = Date.now();
    paso();
    intervalo = setInterval(paso, TICK_MS);
    // Semilla del historial y duraciones nominales sin bloquear la intro
    setTimeout(() => {
      try { historial.semilla(); } catch (e) { console.warn('[sim] semilla:', e); }
      try { for (const p of P.listarProgramas()) duracionNominal(p); } catch (e) { console.warn('[sim] nominal:', e); }
    }, 50);
  },
  detener() { clearInterval(intervalo); intervalo = null; },

  programas: () => listaProgramas(),
  programa: (id) => listaProgramas().find((p) => p.id === id) || null,

  seleccionarPrograma(id) {
    if (maquina === 'CICLO') return 'sesion.error_generico';
    if (!P.obtenerPrograma(id)) return 'sesion.error_generico';
    programaId = id;
    guardar(CLAVE_PROGRAMA, id);
    publicar();
    return null;
  },

  iniciarCiclo({ operador } = {}) {
    sim.ultimoRechazo = null;
    if (maquina === 'CICLO' || corrida) return 'sesion.error_generico';
    const abierta = [1, 2].find((k) => puertas[k] !== 'CERRADA');
    if (abierta) {
      const params = { puerta: traducirValores({ puerta: `puerta_${abierta}` }).puerta };
      sim.ultimoRechazo = { clave: 'alarmas.PUE-01.plantilla', params, texto: t('alarmas.PUE-01.plantilla', params) };
      return 'alarmas.PUE-01.titulo';
    }
    if (!sim.estado.listo) return 'estados.no_preparado';
    const prog = P.obtenerPrograma(programaId);
    if (!prog || prog.habilitado === false) return 'sesion.error_generico';
    const nom = duracionNominal(prog);
    velCiclo = Math.max(1, nom.total / DURACION_OBJETIVO_S) * velParam;
    refsCiclo = nom.fases;
    resultadoEmitido = false;
    vaciado = 'INACTIVO';
    corrida = new Corrida(planta, prog, { numero: historial.siguienteNumero(), operador: nombreUsuario(operador),
      inicio: Date.now(), escalaReal: velCiclo });
    maquina = 'CICLO';
    quitarAlarmas((a) => a.codigo === 'PUE-01');
    publicar();
    return null;
  },

  cancelarCiclo(usuario) {
    if (!corrida || corrida.resultado) return 'sesion.error_generico';
    const r = corrida.cancelar(nombreUsuario(usuario));
    publicar();
    return r;
  },

  confirmarCiclo({ forzar = false, usuario = '' } = {}) {
    if (!corrida) return 'sesion.error_generico';
    const r = corrida.confirmar({ forzar, usuario: nombreUsuario(usuario) });
    if (r) return r;
    const c = corrida;
    const vista = vistaCiclo();
    try { historial.agregar(historial.registroDeCorrida(c)); } catch (e) { console.warn('[sim] historial:', e); }
    ultimoCiclo = { ...vista, serie: historial.submuestrear(c.serie) };
    // Alarmas del ciclo: las de despeje automático se van; las manuales quedan hasta reconocerlas
    quitarAlarmas((a) => a.enCiclo && a.despeje === 'AUTO');
    if (c.resultado === 'fallo') maquina = 'FALLA';
    else {
      maquina = 'PREPARADO';
      if (c.resultado === 'exitoso' && c.liquido && (c.modoDesc === 4 || c.modoDesc === 5)) vaciado = 'PENDIENTE';
    }
    c.limpiarPerturbaciones();
    corrida = null;
    publicar();
    return null;
  },

  abrirPuerta(n) {
    sim.ultimoRechazo = null;
    if (!(n === 1 || n === 2)) return 'puerta.desconocida';
    if (maquina === 'CICLO') return 'puerta.no_permitida';
    if (puertas[n] === 'ABIERTA') return 'puerta.ya_abierta';
    if (movPuerta[n]) { sim.ultimoRechazo = { clave: 'puerta.en_movimiento', params: { estado: puertas[n] } }; return 'puerta.en_movimiento'; }
    const otra = n === 1 ? 2 : 1;
    if (puertas[otra] !== 'CERRADA') {
      const params = { puerta: traducirValores({ puerta: `puerta_${otra}` }).puerta };
      sim.ultimoRechazo = { clave: 'puerta.otra_puerta_abierta', params, texto: t('puerta.otra_puerta_abierta', params) };
      return 'puerta.otra_puerta_abierta';
    }
    const mot = motivosReposo(mOff || medirReposo());
    if (mot.length) {
      sim.ultimoRechazo = { clave: mot[0].clave, params: mot[0].valores, texto: textoMotivoCamara(mot[0]) };
      return mot[0].clave;
    }
    puertas[n] = 'ABRIENDO';
    movPuerta[n] = { destino: 'ABIERTA', hasta: Date.now() + T_PUERTA_MS };
    planta.liquido = false;    // se descarga la carga
    publicar();
    return null;
  },

  cerrarPuerta(n) {
    sim.ultimoRechazo = null;
    if (!(n === 1 || n === 2)) return 'puerta.desconocida';
    if (puertas[n] === 'CERRADA') return 'puerta.ya_cerrada';
    if (movPuerta[n]) return 'puerta.en_movimiento';
    puertas[n] = 'CERRANDO';
    movPuerta[n] = { destino: 'CERRADA', hasta: Date.now() + T_PUERTA_MS };
    publicar();
    return null;
  },

  dispararFallo(codigo) {
    const def = defFallo(codigo);
    if (!def) return 'desconocido';
    if (!corrida) return 'sin_ciclo';
    const r = corrida.inyectar(def);
    sincronizarAlarmasCiclo();
    publicar();
    return r;
  },

  reconocerAlarma(id) {
    const a = alarmas.find((x) => x.id === id);
    if (!a) return;
    a.reconocida = true;
    // Un aviso no bloqueante de un ciclo ya terminado se retira al reconocerlo
    if (!a.bloqueante && (!a.enCiclo || !corrida || a.origen?.resuelta != null)) quitarAlarmas((x) => x === a);
  },
  reconocerTodas() { for (const a of alarmas.slice()) sim.reconocerAlarma(a.id); },

  resetFalla() {
    if (maquina !== 'FALLA') return 'sesion.error_generico';
    quitarAlarmas((a) => a.enCiclo);
    maquina = 'PREPARACION';
    publicar();
    return null;
  },

  guardarParametro(id, seccion, nombre, valor) {
    const r = P.guardarParametro(id, seccion, nombre, valor);
    cacheProgramas = null;
    return r;
  },
  habilitarPrograma(id, si) {
    const r = P.habilitarPrograma(id, si);
    cacheProgramas = null;
    return r;
  },
  restaurarPrograma(id = null) { P.restaurarFabrica(id); cacheProgramas = null; },

  fallosDisponibles() {
    return FALLOS.map((f) => ({
      codigo: f.codigo, codigoVisible: codigoVisible(f.codigo), nivel: f.nivel,
      titulo: t(`alarmas.${f.codigo}.titulo`), accion: t(`alarmas.${f.codigo}.accion`),
      fases: f.fases.slice(), cargas: f.cargas || ['solido', 'liquido'], efecto: f.efecto,
      mecanismo: f.mecanismo[idioma()] || f.mecanismo.es,
      aplicable: corrida ? corrida.aplicaFallo(f) : false,
    }));
  },

  /** Borra los datos del simulador (historial, contador, ajustes de programas) y vuelve a sembrar. */
  reiniciarDatos() {
    corrida = null;
    alarmas = [];
    maquina = 'PREPARACION';
    vaciado = 'INACTIVO';
    ultimoCiclo = null;
    planta = new Planta();
    for (const k of [1, 2]) { puertas[k] = 'CERRADA'; delete movPuerta[k]; }
    historial.borrarHistorial();
    P.restaurarFabrica();
    borrar(CLAVE_PROGRAMA);
    programaId = P.PROGRAMA_POR_DEFECTO;
    cacheProgramas = null;
    try { historial.semilla(); } catch (e) { console.warn('[sim] semilla:', e); }
    emit('historial', null);
    publicar();
  },
};

export { FASE_UI };
