// Lógica de Reportes de la demo: réplica de services/domain/reportes/dashboard.py (indicadores, duración media,
// serie, periodo anterior, estado del día del calendario, agrupación de alarmas y operadores) y de la parte
// de presentación de ui_qml/domain/reporte_dashboard.py. Funciones puras sobre los registros del historial.
//
// DR-H01: ningún texto de Reportes dice «conforme» ni «apto»; el calendario muestra el resultado del ciclo.
import { t, idioma } from '../../core/i18n.js';
import { lista } from './menu_util.js';

export const PERIODOS = ['dia', 'semana', 'mes', 'anio'];
const DIA_MS = 86400000;
const UMBRAL_EXITO_PROGRAMA = 95;
const MAX_ALARMAS = 8;
const MAX_OPERADORES = 5;
const DURACION_MAX_S = 24 * 3600;

// ── fechas (reloj local) ─────────────────────────────────────────────────
export const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const lunesDe = (d) => sumarDias(inicioDia(d), -((new Date(d).getDay() + 6) % 7));
export const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const diaSemana = (d) => (d.getDay() + 6) % 7;   // lunes = 0
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** [desde, hasta] inclusivos del periodo que contiene `fecha`. */
export function rango(periodo, fecha) {
  const f = inicioDia(fecha);
  if (periodo === 'dia') return { desde: f, hasta: f };
  if (periodo === 'semana') { const l = lunesDe(f); return { desde: l, hasta: sumarDias(l, 6) }; }
  if (periodo === 'mes') return { desde: new Date(f.getFullYear(), f.getMonth(), 1), hasta: new Date(f.getFullYear(), f.getMonth() + 1, 0) };
  return { desde: new Date(f.getFullYear(), 0, 1), hasta: new Date(f.getFullYear(), 11, 31) };
}

/** Primer día del periodo desplazado `pasos` periodos (sin pasarse del actual). */
export function desplazar(periodo, fecha, pasos, hoy = new Date()) {
  const f = inicioDia(fecha);
  let n;
  if (periodo === 'dia') n = sumarDias(f, pasos);
  else if (periodo === 'semana') n = sumarDias(lunesDe(f), 7 * pasos);
  else if (periodo === 'mes') n = new Date(f.getFullYear(), f.getMonth() + pasos, 1);
  else n = new Date(f.getFullYear() + pasos, 0, 1);
  return rango(periodo, n).desde > inicioDia(hoy) ? fecha : n;
}
export const esActual = (periodo, fecha, hoy = new Date()) => rango(periodo, fecha).hasta >= inicioDia(hoy);

export function anterior(periodo, fecha) {
  const r = rango(periodo, fecha);
  const prev = periodo === 'dia' ? sumarDias(r.desde, -1)
    : periodo === 'semana' ? sumarDias(r.desde, -7)
      : periodo === 'mes' ? new Date(r.desde.getFullYear(), r.desde.getMonth() - 1, 1)
        : new Date(r.desde.getFullYear() - 1, 0, 1);
  return rango(periodo, prev);
}

const esEn = () => idioma() === 'en';
const dm = (d) => (esEn() ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
export const dmy = (d) => (esEn() ? `${dm(d)}/${d.getFullYear()}` : `${dm(d)}/${d.getFullYear()}`);
const mesLargo = (d, minus = false) => { const m = lista('fecha.meses_largos')[d.getMonth()] ?? ''; return minus && !esEn() ? m.toLowerCase() : m; };

/** «Octubre 2026», «Semana del 26/10 al 01/11», «Lunes 2 de noviembre», «2026». */
export function tituloPeriodo(periodo, desde, hasta) {
  if (periodo === 'anio') return String(desde.getFullYear());
  if (periodo === 'dia') {
    return t('reportes.dash_titulo_dia', { dia: lista('fecha.dias')[diaSemana(desde)], d: desde.getDate(), mes: mesLargo(desde, true), anio: desde.getFullYear() });
  }
  if (periodo === 'semana') return t('reportes.dash_titulo_semana', { desde: dm(desde), hasta: dm(hasta) });
  return `${mesLargo(desde)} ${desde.getFullYear()}`;
}

/** Rótulo del periodo en la ventana Historial: «Jueves 19 nov 2026», «Semana del 16/11 al 22/11», «Noviembre 2026». */
export function rotuloHistorial(periodo, desde, hasta) {
  if (periodo === 'dia') return `${lista('fecha.dias')[diaSemana(desde)]} ${desde.getDate()} ${lista('fecha.meses')[desde.getMonth()]} ${desde.getFullYear()}`;
  return tituloPeriodo(periodo, desde, hasta);
}

export function encabezado(periodo, fecha) {
  const r = rango(periodo, fecha);
  const a = anterior(periodo, fecha);
  return {
    titulo: tituloPeriodo(periodo, r.desde, r.hasta),
    rango: mismoDia(r.desde, r.hasta) ? dmy(r.desde) : t('reportes.dash_rango', { desde: dmy(r.desde), hasta: dmy(r.hasta) }),
    comparado: t('reportes.dash_comparado', { periodo: tituloPeriodo(periodo, a.desde, a.hasta) }),
  };
}

// ── filtrado y resultado ─────────────────────────────────────────────────
export function enRango(registros, desde, hasta) {
  const a = inicioDia(desde).getTime();
  const b = sumarDias(inicioDia(hasta), 1).getTime();
  return registros.filter((r) => r.inicio >= a && r.inicio < b);
}
const grupo = (r) => (r.resultado === 'exitoso' ? 'completados' : r.resultado === 'cancelado' ? 'cancelados' : r.resultado === 'fallo' ? 'fallos' : 'sin_cierre');

export function indicadoresBase(filas) {
  const c = { total: 0, completados: 0, fallos: 0, cancelados: 0, sin_cierre: 0 };
  for (const f of filas) { c.total++; c[grupo(f)]++; }
  c.exito_pct = c.total ? Math.round(100 * c.completados / c.total) : 0;
  return c;
}

/** (segundos medios | null, excluidas): solo COMPLETADOS con 0 < duración <= 24 h (DR-H03). */
export function duracionMedia(filas) {
  const d = []; let excluidas = 0;
  for (const f of filas) {
    if (f.resultado !== 'exitoso') continue;
    const seg = f.duracionS ?? ((f.fin != null && f.inicio != null) ? (f.fin - f.inicio) / 1000 : null);
    if (seg != null && seg > 0 && seg <= DURACION_MAX_S) d.push(seg); else excluidas++;
  }
  return { medio: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, excluidas };
}

// ── serie (gráfica de área) ──────────────────────────────────────────────
function ejeY(maximo) {
  if (maximo <= 0) return { max: 4, paso: 1, marcas: [0, 1, 2, 3, 4].map((v) => ({ valor: v, y: v / 4 })) };
  let escala = 1;
  for (;;) {
    for (const base of [1, 2, 5]) {
      const paso = base * escala;
      if (Math.ceil(maximo / paso) <= 4) {
        const tope = Math.ceil(maximo / paso) * paso;
        const marcas = [];
        for (let v = 0; v <= tope; v += paso) marcas.push({ valor: v, y: v / tope });
        return { max: tope, paso, marcas };
      }
    }
    escala *= 10;
  }
}

export function serie(filas, periodo, desde, hasta) {
  const claves = [];
  if (periodo === 'dia') for (let h = 0; h < 24; h++) claves.push(new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), h));
  else if (periodo === 'anio') for (let m = 0; m < 12; m++) claves.push(new Date(desde.getFullYear(), m, 1));
  else for (let d = new Date(desde); d <= hasta; d = sumarDias(d, 1)) claves.push(new Date(d));
  const clave = (ms) => {
    const d = new Date(ms);
    if (periodo === 'dia') return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
    if (periodo === 'anio') return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return inicioDia(d).getTime();
  };
  const puntos = new Map(claves.map((k) => [k.getTime(), { inicio: k, total: 0, completados: 0, fallos: 0 }]));
  for (const f of filas) {
    const p = puntos.get(clave(f.inicio));
    if (!p) continue;
    p.total++;
    const g = grupo(f);
    if (g === 'completados') p.completados++;
    if (g === 'fallos') p.fallos++;
  }
  const lst = [...puntos.values()];
  const n = lst.length;
  const x = (i) => (n <= 1 ? 0.5 : i / (n - 1));
  const maximo = Math.max(0, ...lst.map((p) => p.total));
  const eje = ejeY(maximo);
  const dias = lista('fecha.dias'), cortos = lista('fecha.meses'), largos = lista('fecha.meses_largos');
  const puntosOut = lst.map((p, i) => {
    const d = p.inicio;
    const rotulo = periodo === 'dia' ? `${String(d.getHours()).padStart(2, '0')}:00`
      : periodo === 'anio' ? `${largos[d.getMonth()]} ${d.getFullYear()}`
        : `${dias[diaSemana(d)].slice(0, 3)} ${d.getDate()} ${cortos[d.getMonth()]}`;
    return { x: x(i), yTotal: p.total / eje.max, yCompletados: p.completados / eje.max, conFallo: p.fallos > 0,
      total: p.total, completados: p.completados, fallos: p.fallos, rotulo };
  });
  const ejeX = [];
  lst.forEach((p, i) => {
    const d = p.inicio;
    if (periodo === 'dia') { if (i % 6 === 0) ejeX.push({ x: x(i), texto: `${String(d.getHours()).padStart(2, '0')}:00` }); }
    else if (periodo === 'anio') { const m = cortos[d.getMonth()]; ejeX.push({ x: x(i), texto: m.charAt(0).toUpperCase() + m.slice(1) }); }
    else if (periodo === 'semana') ejeX.push({ x: x(i), texto: String(d.getDate()) });
    else if (d.getDate() === 1 || d.getDate() % 5 === 0) ejeX.push({ x: x(i), texto: String(d.getDate()) });
  });
  return { vacia: maximo === 0, puntos: puntosOut, ejeY: eje, ejeX };
}

// ── indicadores ──────────────────────────────────────────────────────────
function normalizar(valores) {
  const n = valores.length;
  const mx = Math.max(0, ...valores.filter((v) => v != null));
  return valores.map((v, i) => (v == null ? null : { x: n <= 1 ? 0.5 : i / (n - 1), y: mx > 0 ? v / mx : 0 })).filter(Boolean);
}
function comparacion(delta, buenoSi, unidad) {
  if (delta == null) return { disponible: false, texto: '', flecha: 'ninguna', color: 'var(--c-texto-secundario)' };
  let flecha = 'igual', color = 'var(--c-texto-secundario)', signo = '';
  if (delta !== 0) {
    flecha = delta > 0 ? 'arriba' : 'abajo';
    signo = delta > 0 ? '+' : '−';
    if (buenoSi === 'sube') color = delta > 0 ? 'var(--c-menu-verde-texto)' : 'var(--c-peligro-texto)';
    else if (buenoSi === 'baja') color = delta < 0 ? 'var(--c-menu-verde-texto)' : 'var(--c-peligro-texto)';
  }
  let texto = delta ? `${signo}${Math.abs(delta)}` : '0';
  if (unidad) texto += ` ${t(unidad)}`;
  return { disponible: true, texto, flecha, color };
}

export function indicadores(filas, filasAnt, serieFilas) {
  const ind = indicadoresBase(filas);
  const ant = filasAnt ? indicadoresBase(filasAnt) : null;
  const { medio, excluidas } = duracionMedia(filas);
  const minutos = medio != null ? Math.round(medio / 60) : null;
  const dAnt = filasAnt ? duracionMedia(filasAnt).medio : null;
  const dTotal = ant ? ind.total - ant.total : null;
  const sinExito = ind.total === 0 || !ant || ant.total === 0;
  const dExito = sinExito ? null : ind.exito_pct - ant.exito_pct;
  const dFallos = ant ? ind.fallos - ant.fallos : null;
  const dDur = (!ant || medio == null || dAnt == null) ? null : minutos - Math.round(dAnt / 60);
  const totales = serieFilas.map((p) => p.total);
  const exitos = serieFilas.map((p) => (p.total ? Math.round(100 * p.completados / p.total) : null));
  let acum = 0;
  const acumulados = serieFilas.map((p) => (acum += p.fallos));
  const sinDatos = !ant;
  const tarjeta = (clave, valor, pie, comp, mini) => ({
    clave, titulo: t(`reportes.ind_${clave}`), valor, pie, mini,
    comparacion: { ...comp, sinDatos, textoSinDatos: sinDatos ? t('reportes.dash_sin_anterior') : '' },
  });
  return [
    tarjeta('ciclos', String(ind.total), '', comparacion(dTotal, null, ''), normalizar(totales)),
    tarjeta('exito', ind.total ? `${ind.exito_pct}%` : '—', ind.total ? t('reportes.ind_exito_pie', { n: ind.completados, total: ind.total }) : '',
      comparacion(dExito, 'sube', 'reportes.unidad_pp'), normalizar(exitos)),
    tarjeta('fallos', String(ind.fallos), t('reportes.ind_fallos_pie', { cancelados: ind.cancelados, sin_cierre: ind.sin_cierre }),
      comparacion(dFallos, 'baja', ''), normalizar(acumulados)),
    tarjeta('duracion', minutos != null ? t('reportes.dash_min', { n: minutos }) : '—',
      excluidas > 0 ? t('reportes.ind_duracion_excluidas', { n: excluidas }) : '', comparacion(dDur, null, 'reportes.unidad_min'), []),
  ];
}

export function dona(filas) {
  const ind = indicadoresBase(filas);
  const colores = { completados: 'var(--c-menu-verde)', fallos: 'var(--c-peligro-texto)', cancelados: 'var(--c-menu-naranja)', sin_cierre: 'var(--c-texto-guia)' };
  let acum = 0;
  const porciones = ['completados', 'fallos', 'cancelados', 'sin_cierre'].map((c) => {
    const n = ind[c];
    const f = ind.total ? n / ind.total : 0;
    const p = { clave: c, rotulo: t(`reportes.dona_${c}`), cantidad: n, porcentaje: `${Math.round(100 * f)}%`, fraccion: f, inicio: acum, color: colores[c] };
    acum += f;
    return p;
  });
  return { vacia: ind.total === 0, total: ind.total, centro: ind.total ? `${ind.exito_pct}%` : '', textoVacio: t('reportes.dona_sin_ciclos'), porciones };
}

export function programas(filas) {
  const por = new Map();
  for (const f of filas) {
    const k = f.numeroPrograma ?? f.programaNombre;
    const p = por.get(k) ?? { numero: f.numeroPrograma, nombre: f.programaNombre ?? '', total: 0, completados: 0, fallos: 0, cancelados: 0, sin_cierre: 0 };
    p.total++;
    p[grupo(f)]++;
    por.set(k, p);
  }
  const out = [...por.values()].map((p) => {
    const pct = p.total ? Math.round(100 * p.completados / p.total) : 0;
    const partes = [];
    if (p.fallos) partes.push(t('reportes.prog_fallos', { n: p.fallos }));
    if (p.cancelados) partes.push(t('reportes.prog_cancelados', { n: p.cancelados }));
    if (p.sin_cierre) partes.push(t('reportes.prog_sin_cierre', { n: p.sin_cierre }));
    return { numero: p.numero == null ? '—' : String(p.numero).padStart(2, '0'), nombre: p.nombre,
      detalle: partes.length ? partes.join(' · ') : t('reportes.prog_sin_incidencias'), total: p.total, exitoPct: pct,
      ancho: p.total ? p.completados / p.total : 0, color: pct >= UMBRAL_EXITO_PROGRAMA ? 'var(--c-menu-verde)' : 'var(--c-menu-naranja)' };
  });
  return out.sort((a, b) => b.total - a.total);
}

export function causas(filas) {
  const por = new Map();
  for (const f of filas) {
    if (f.resultado !== 'fallo') continue;
    const c = String(f.motivo || f.codigo || 'FALLO');
    por.set(c, (por.get(c) ?? 0) + 1);
  }
  return [...por.entries()].map(([causa, cantidad]) => ({ causa, cantidad })).sort((a, b) => b.cantidad - a.cantidad || a.causa.localeCompare(b.causa));
}

// ── alarmas y operadores ─────────────────────────────────────────────────
const NIVELES = ['FALLO_CRITICO', 'ALARMA', 'AVISO', 'INFORMATIVO'];
const CLAVE_NIVEL = { FALLO_CRITICO: 'reportes.nivel_fallo_critico', ALARMA: 'reportes.nivel_alarma', AVISO: 'reportes.nivel_aviso', INFORMATIVO: 'reportes.nivel_informativo' };
const COLOR_NIVEL = { FALLO_CRITICO: 'var(--c-alarma-alta)', ALARMA: 'var(--c-alarma-media)', AVISO: 'var(--c-alarma-baja)', INFORMATIVO: 'var(--c-alarma-baja)' };
const DE_NIVEL_SIM = { alta: 'FALLO_CRITICO', media: 'ALARMA', baja: 'AVISO' };

export function alarmas(filas) {
  const grupos = new Map();
  for (const f of filas) {
    for (const a of (f.alarmas ?? [])) {
      const codigo = String(a.codigo ?? a.id ?? '');
      if (!codigo) continue;
      const nivel = DE_NIVEL_SIM[a.nivel] ?? (NIVELES.includes(a.nivel) ? a.nivel : 'AVISO');
      const g = grupos.get(codigo) ?? { codigo, codigoVisible: a.codigoVisible ?? codigo, titulo: a.titulo ?? codigo, nivel, cantidad: 0, alarma: a };
      g.cantidad++;
      if (NIVELES.indexOf(nivel) < NIVELES.indexOf(g.nivel)) g.nivel = nivel;
      grupos.set(codigo, g);
    }
  }
  const todas = [...grupos.values()].sort((a, b) => NIVELES.indexOf(a.nivel) - NIVELES.indexOf(b.nivel) || b.cantidad - a.cantidad || a.codigo.localeCompare(b.codigo))
    .map((g) => ({ ...g, nivelRotulo: t(CLAVE_NIVEL[g.nivel]), color: COLOR_NIVEL[g.nivel] }));
  const total = todas.reduce((a, g) => a + g.cantidad, 0);
  const niveles = NIVELES.map((n) => {
    const c = todas.filter((g) => g.nivel === n).reduce((a, g) => a + g.cantidad, 0);
    return { nivel: n, rotulo: t(CLAVE_NIVEL[n]), cantidad: c, fraccion: total ? c / total : 0, color: COLOR_NIVEL[n] };
  });
  return { total, filas: todas.slice(0, MAX_ALARMAS), todas, hayMas: todas.length > MAX_ALARMAS, niveles, vacia: todas.length === 0 };
}

const iniciales = (nombre) => {
  const p = nombre.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
};

export function operadores(filas) {
  const cuentas = new Map();
  for (const f of filas) {
    const n = String(f.operador ?? '').trim();
    const k = n && n !== '—' ? n : '';
    cuentas.set(k, (cuentas.get(k) ?? 0) + 1);
  }
  const orden = [...cuentas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const vis = orden.slice(0, MAX_OPERADORES), resto = orden.slice(MAX_OPERADORES);
  const mayor = Math.max(0, ...vis.map((o) => o[1]));
  return {
    filas: vis.map(([n, c]) => ({ nombre: n || t('reportes.oper_sin_operador'), iniciales: n ? iniciales(n) : '?', sinOperador: !n, cantidad: c, fraccion: mayor ? c / mayor : 0 })),
    otros: resto.length ? { texto: t('reportes.oper_otros', { n: resto.length }), cantidad: resto.reduce((a, o) => a + o[1], 0) } : null,
    vacia: vis.length === 0,
  };
}

// ── calendario por programa ──────────────────────────────────────────────
export const ESTADOS_DIA = ['exito', 'exito_fallo_previo', 'sin_exito', 'falto', 'no_ejecutado', 'sin_operacion', 'en_curso', 'futuro'];
export const ORDEN_CONTEO = ['exito', 'exito_fallo_previo', 'sin_exito', 'falto', 'no_ejecutado', 'sin_operacion', 'en_curso'];
/** Aspecto de cada estado (con tokens de tema; la forma distingue sin depender del tono). */
export const ASPECTO = {
  exito: { forma: 'relleno', relleno: 'var(--c-exito-fondo)', borde: 'var(--c-menu-verde)', punto: '', grosor: 1, punteado: false },
  exito_fallo_previo: { forma: 'relleno_punto', relleno: 'var(--c-exito-fondo)', borde: 'var(--c-menu-verde)', punto: 'var(--c-peligro-texto)', grosor: 1, punteado: false },
  sin_exito: { forma: 'solido', relleno: 'var(--c-peligro-texto)', borde: 'var(--c-peligro-texto)', punto: '', grosor: 1, punteado: false },
  falto: { forma: 'borde_grueso', relleno: 'var(--c-fondo-tarjeta)', borde: 'var(--c-peligro-texto)', punto: '', grosor: 3, punteado: false },
  no_ejecutado: { forma: 'gris', relleno: 'var(--c-borde-divisor)', borde: 'var(--c-borde-campo)', punto: '', grosor: 1, punteado: false },
  sin_operacion: { forma: 'punteado', relleno: '', borde: 'var(--c-borde-campo)', punto: '', grosor: 1, punteado: true },
  en_curso: { forma: 'azul', relleno: 'var(--c-accion-primario)', borde: 'var(--c-accion-primario)', punto: '', grosor: 1, punteado: false },
  futuro: { forma: 'deshabilitado', relleno: '', borde: 'var(--c-borde-divisor)', punto: '', grosor: 1, punteado: false },
};

/** Estado del día de un programa (REP-07). `intentos`: ciclos del programa ese día por orden de inicio. */
export function estadoDia(intentos, nDia, esPrograma1, hoy, dia) {
  if (inicioDia(dia) > inicioDia(hoy)) return 'futuro';
  if (nDia === 0 && intentos.length === 0) return 'sin_operacion';
  if (intentos.length) {
    const exitos = intentos.map((i, k) => (i.resultado === 'exitoso' ? k : -1)).filter((k) => k >= 0);
    if (!exitos.length) return 'sin_exito';
    const ultimo = exitos[exitos.length - 1];
    let previo = false;
    for (let k = 0; k < ultimo; k++) if (!exitos.includes(k)) previo = true;
    return previo ? 'exito_fallo_previo' : 'exito';
  }
  return esPrograma1 ? 'falto' : 'no_ejecutado';
}

/** Programas ofrecidos por el calendario: los del periodo y, siempre, el 01 si está habilitado. */
export function programasCalendario(filas, programasSim = []) {
  const por = new Map();
  for (const f of filas) if (f.numeroPrograma != null) por.set(f.numeroPrograma, f.programaNombre ?? '');
  const p1 = programasSim.find((p) => p.numero === 1 && p.habilitado !== false);
  if (p1 && !por.has(1)) por.set(1, p1.nombre);
  return [...por.entries()].sort((a, b) => a[0] - b[0]).map(([numero, nombre]) => {
    const num = String(numero).padStart(2, '0');
    return { numero, numeroTexto: num, nombre, etiqueta: `${num} · ${nombre}` };
  });
}

function celda(d, estado, enPeriodo, intentos) {
  return { vacia: false, fecha: d, dia: d.getDate(), estado, enPeriodo, intentos, tocable: estado !== 'futuro', ...ASPECTO[estado], rotulo: t(`reportes.estado_${estado}`) };
}

/** Semanas (lunes a domingo) del mes; vacía = relleno. */
function semanasDeMes(anio, mes, estadoDe, enPeriodo) {
  const primero = new Date(anio, mes, 1), ultimo = new Date(anio, mes + 1, 0);
  const semanas = [];
  let fila = Array(diaSemana(primero)).fill({ vacia: true });
  for (let d = new Date(primero); d <= ultimo; d = sumarDias(d, 1)) {
    fila.push(celda(new Date(d), estadoDe(new Date(d)), enPeriodo(new Date(d))));
    if (fila.length === 7) { semanas.push(fila); fila = []; }
  }
  if (fila.length) semanas.push([...fila, ...Array(7 - fila.length).fill({ vacia: true })]);
  return semanas;
}

/**
 * calendario(todos, periodo, fecha, programaNumero, programasSim, hoy) -> estructura para CalendarioEjecucion.
 * `todos`: todos los ciclos del historial (no solo los del periodo).
 */
export function calendario(todos, periodo, fecha, programaNumero, programasSim = [], hoy = new Date(), mesAnio = null) {
  // Dentro del periodo Año, un mes elegido se ve como calendario de ese mes (con «Ver año» para volver)
  if (periodo === 'anio' && mesAnio != null) {
    const ref = new Date(rango('anio', fecha).desde.getFullYear(), mesAnio, 1);
    return { ...calendario(todos, 'mes', ref, programaNumero, programasSim, hoy), puedeVerAnio: true };
  }
  const r = rango(periodo, fecha);
  const filasPeriodo = enRango(todos, r.desde, r.hasta);
  const progs = programasCalendario(filasPeriodo, programasSim);
  const sel = progs.some((p) => p.numero === programaNumero) ? programaNumero : (progs[0]?.numero ?? null);
  const base = { puedeVerAnio: false, programas: progs, programa: sel, sinProgramas: progs.length === 0, textoSinProgramas: progs.length ? '' : t('reportes.cal_sin_programas'),
    diasSemana: lista('fecha.dias').map((x) => x.slice(0, 3)), leyenda: t('reportes.cal_leyenda'), textoToqueDia: t('reportes.cal_toque_dia') };
  if (sel == null) return { ...base, vista: periodo === 'anio' ? 'anio' : 'mes', titulo: '', conteo: [], semanas: [], meses: [] };
  const porDia = new Map();
  for (const c of todos) {
    const k = iso(new Date(c.inicio));
    const v = porDia.get(k) ?? { n: 0, intentos: [] };
    v.n++;
    if (c.numeroPrograma === sel) v.intentos.push(c);
    porDia.set(k, v);
  }
  for (const v of porDia.values()) v.intentos.sort((a, b) => a.inicio - b.inicio);
  const estadoDe = (d) => {
    const v = porDia.get(iso(d)) ?? { n: 0, intentos: [] };
    return estadoDia(v.intentos, v.n, sel === 1, hoy, d);
  };
  const conteo = (dias) => ORDEN_CONTEO.map((e) => ({ estado: e, rotulo: t(`reportes.estado_${e}`), cantidad: dias.filter((d) => d === e).length, ...ASPECTO[e] }));
  if (periodo === 'anio') {
    const anio = r.desde.getFullYear();
    const todosDias = [];
    const meses = [];
    for (let m = 0; m < 12; m++) {
      const ultimo = new Date(anio, m + 1, 0).getDate();
      const dias = [];
      for (let d = 1; d <= ultimo; d++) dias.push(estadoDe(new Date(anio, m, d)));
      todosDias.push(...dias);
      let habilitado = true, resumen;
      if (dias.every((e) => e === 'futuro' || e === 'sin_operacion')) { habilitado = false; resumen = t('reportes.mes_sin_datos'); }
      else {
        const previo = dias.filter((e) => e === 'exito_fallo_previo').length;
        const sin = dias.filter((e) => e === 'sin_exito' || e === 'falto').length;
        const partes = [];
        if (previo) partes.push(t('reportes.mes_con_fallo_previo', { n: previo }));
        if (sin) partes.push(t('reportes.mes_sin_exito', { n: sin }));
        resumen = partes.length ? partes.join(' · ') : t('reportes.mes_sin_novedad');
      }
      meses.push({ mes: m, anio, nombre: lista('fecha.meses_largos')[m], habilitado, resumen,
        semanas: semanasDeMes(anio, m, estadoDe, () => true) });
    }
    return { ...base, vista: 'anio', titulo: String(anio), anio, conteo: conteo(todosDias), semanas: [], meses };
  }
  const ref = r.desde;
  const enPeriodo = (d) => d >= r.desde && d <= r.hasta;
  const semanas = semanasDeMes(ref.getFullYear(), ref.getMonth(), estadoDe, enPeriodo);
  const visibles = [];
  for (const s of semanas) for (const c of s) if (!c.vacia && (periodo === 'mes' || c.enPeriodo)) visibles.push(c.estado);
  return { ...base, vista: 'mes', titulo: `${lista('fecha.meses_largos')[ref.getMonth()]} ${ref.getFullYear()}`, anio: ref.getFullYear(), mes: ref.getMonth(),
    conteo: conteo(visibles), semanas, meses: [] };
}

/** Panel del día: {titulo, estado, estadoRotulo, explicacion, ...aspecto, intentos}. */
export function panelDia(todos, fecha, programaNumero, hoy = new Date()) {
  const k = iso(fecha);
  const delDia = todos.filter((c) => iso(new Date(c.inicio)) === k);
  const intentos = delDia.filter((c) => c.numeroPrograma === programaNumero).sort((a, b) => a.inicio - b.inicio);
  const estado = estadoDia(intentos, delDia.length, programaNumero === 1, hoy, fecha);
  const otros = delDia.length - intentos.length;
  return {
    titulo: t('reportes.dash_titulo_dia', { dia: lista('fecha.dias')[diaSemana(fecha)], d: fecha.getDate(), mes: mesLargo(fecha, true), anio: fecha.getFullYear() }),
    estado, estadoRotulo: t(`reportes.estado_${estado}`),
    explicacion: estado === 'falto' && otros > 0 ? t('reportes.expl_falto_n', { n: otros }) : t(`reportes.expl_${estado}`),
    ...ASPECTO[estado], intentos,
  };
}

/** Todo el dashboard de un periodo. */
export function dashboard(todos, periodo, fecha) {
  const r = rango(periodo, fecha);
  const a = anterior(periodo, fecha);
  const filas = enRango(todos, r.desde, r.hasta);
  const filasAnt = enRango(todos, a.desde, a.hasta);
  // sin ciclos en el periodo anterior no hay comparación posible
  const s = serie(filas, periodo, r.desde, r.hasta);
  return {
    encabezado: encabezado(periodo, fecha), filas,
    indicadores: indicadores(filas, filasAnt.length ? filasAnt : null, s.puntos.map((p) => ({ total: p.total, completados: p.completados, fallos: p.fallos }))),
    dona: dona(filas), serie: s, programas: programas(filas), causas: causas(filas), alarmas: alarmas(filas), operadores: operadores(filas),
  };
}

export { UMBRAL_EXITO_PROGRAMA, DIA_MS };
