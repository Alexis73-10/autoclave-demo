// Tirilla (ticket térmico de 24 columnas) con el formato real:
//   src/autoclave/services/domain/logging/ticket_formatter.py
//   (format_header :464, format_row :535, format_footer :547, lineas_resultado :597, _linea_aviso)
// Sin línea de empresa (el real no la lleva en la tirilla). Idioma y textos: ticket_ciclo.* (i18n real).
// Unidades de fábrica (°C, kPa abs): no se imprime la línea «Unidades».
import { t, idioma } from '../core/i18n.js';
import { codigoVisible } from './fallos.js';

export const ANCHO = 24;
const SEP = '------------------------';
const MESES = { es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] };
const RESULTADOS = ['COMPLETADO', 'CANCELADO', 'INTERRUMPIDO', 'EMERGENCIA', 'FALLO', 'SENSOR_AUSENTE'];

const tt = (clave, params) => t(`ticket_ciclo.${clave}`, params);
const p2 = (n) => String(n).padStart(2, '0');
const hms = (f) => { const d = new Date(f); return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };
const hm = (f) => { const d = new Date(f); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
/** Transcurrido HH:MM:SS (cycle_logger._fmt_elapsed). */
export function transcurrido(seg) {
  const s = Math.max(0, Math.floor(seg));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}
/** f"{v:06.1f}" de Python; sin dato " -----". */
function f06(v) {
  if (v == null || !Number.isFinite(v)) return ' -----';
  const s = Math.abs(v).toFixed(1).padStart(v < 0 ? 5 : 6, '0');
  return v < 0 ? '-' + s : s;
}

/** lineas_rotulo: "Rótulo: valor" o el rótulo solo y el valor debajo en trozos de 24. */
function lineasRotulo(rotulo, valor) {
  const v = valor == null ? '' : String(valor);
  if (`${rotulo}: ${v}`.length <= ANCHO) return [`${rotulo}: ${v}`];
  const out = [`${rotulo}:`];
  for (let i = 0; i < v.length; i += ANCHO) out.push(v.slice(i, i + ANCHO));
  return out;
}
/** lineas_version: una versión larga se parte antes de " (" o "+". */
function lineasVersion(rotulo, valor) {
  const v = valor == null ? '' : String(valor);
  if (`${rotulo}: ${v}`.length <= ANCHO) return [`${rotulo}: ${v}`];
  if (v.length <= ANCHO) return [`${rotulo}:`, v];
  for (const sep of [' (', '+']) {
    const i = v.indexOf(sep);
    if (i > 0) return [`${rotulo}:`, v.slice(0, i), v.slice(i).trim()];
  }
  return lineasRotulo(rotulo, v);
}

/** resultado_ticket: en español el código tal cual; en inglés traducido. */
function resultadoTicket(r) {
  r = r || '';
  if (idioma() === 'es') return r;
  if (RESULTADOS.includes(r)) return tt(`resultado.${r}`);
  for (const c of RESULTADOS) {
    if (r.startsWith(c + '_')) {
      let fase = r.slice(c.length + 1), params = {};
      const m = /^PUERTA_(\d+)_([A-Z_]+)$/.exec(fase);
      if (m) { fase = `PUERTA_${m[2]}`; params = { n: m[1] }; }
      const clave = `ticket_ciclo.fase.${fase}`;
      const txt = t(clave, params);
      if (txt !== clave) return tt('resultado_fase', { resultado: tt(`resultado.${c}`), fase: txt });
      return tt(`resultado.${c}`) + r.slice(c.length);
    }
  }
  return r;
}

function textoMotivo(codigo) {
  return codigo ? `${codigoVisible(codigo)} - ${t(`alarmas.${codigo}.titulo`)}` : '';
}
function nombreSensor(id) {
  const c = `io.ai.${id}`;
  const s = t(c);
  return s === c ? String(id) : s;
}
function textoMotivoCamara(mo) {
  if (!mo) return '---';
  const v = { ...mo.valores };
  for (const k of Object.keys(v)) {
    if (k.startsWith('temp')) v[k] = `${Number(v[k]).toFixed(0)} °C`;
    if (k.startsWith('pres')) v[k] = `${Number(v[k]).toFixed(0)} kPa`;
  }
  return t(mo.clave, v);
}

function lineaAviso(a, inicio) {
  if (typeof a === 'string') return `${tt('aviso')}: ${a}`;
  switch (a.clave) {
    case 'ticket_ciclo.cancelado_por': return `${tt('cancelado_por')}: ${a.params?.usuario || '---'}`;
    case 'ticket_ciclo.secado_tras_fallo': return `${tt('secado_tras_fallo')}: ${t(a.valorClave, a.valorParams || {})}`;
    case 'ticket_ciclo.confirmado_forzado':
      return t(a.clave, { usuario: a.params?.usuario || '---', motivo: (a.motivos || []).map(textoMotivoCamara).join('; ') || '---' });
    case 'ticket_ciclo.confirmado_tras_paro':
    case 'ticket_ciclo.entrega_no_registrada':
      return t(a.clave, {});
    case 'ticket_ciclo.aviso_uniformidad':
      return `${tt('aviso')}: ${t(a.clave, { sensor: nombreSensor(a.params.sensor), temp: `${a.params.temp} C` })}`;
    case 'ticket_ciclo.aviso_contrapresion':
      return `${tt('aviso')}: ${t(a.clave, { hora: typeof a.params.hora === 'number' ? hm(a.params.hora) : a.params.hora })}`;
    default:
      return `${tt('aviso')}: ${t(a.clave, a.params || {})}`;
  }
}

/**
 * generarTirilla(registro) -> string[] (24 columnas). `registro` es un registro del historial
 * (con `ticket`, los datos crudos de Corrida.datosTicket) o directamente esos datos crudos.
 * Si el registro solo trae `tirilla` (líneas ya armadas), la devuelve tal cual.
 */
export function generarTirilla(registro) {
  const tk = registro?.ticket || (registro?.cabecera ? registro : null);
  if (!tk) return Array.isArray(registro?.tirilla) ? registro.tirilla.slice() : [];
  const c = tk.cabecera, pie = tk.pie;
  const d = new Date(c.inicio);
  const meses = MESES[idioma()] || MESES.es;
  const nombre = c.nombreClave ? t(c.nombreClave) : c.displayName || c.programaId;
  const lineas = [
    ' ', SEP,
    `${tt('fecha')}: ${p2(d.getDate())}/${meses[d.getMonth()]}/${d.getFullYear()}`,
    `${tt('hora')}:  ${hms(c.inicio)}`,
    `${tt('serie')}: ${c.serie}`,
    ...lineasRotulo(tt('modelo'), c.modelo),
    ...lineasVersion(tt('software'), c.version),
    `${tt('ciclo')}: ${String(c.numero ?? 0).padStart(6, '0')}`,
    nombre,
    `(${c.programaId})`,
    `${tt('temp_ester')}: ${Number(c.tempEster).toFixed(1)} C`,
    `${tt('tiempo_ester')}: ${Number(c.tiempoEster).toFixed(1)} min`,
  ];
  if (c.f0Activo) lineas.push(tt('f0_activo', { objetivo: c.f0Objetivo }));
  lineas.push(`  ${tt('hora').padEnd(4)}      C      kPa`);
  for (const l of tk.lineas) {
    if (l.tipo === 'fila') lineas.push(`${(l.codigo || ' ').padEnd(1)} ${transcurrido(l.t)} ${f06(l.tc)} ${f06(l.pc)}`);
    else if (l.tipo === 'error') lineas.push(`${tt('error_ciclo')}: ${textoMotivo(l.codigo) || resultadoTicket(pie.estado) || '---'}`);
    else if (l.tipo === 'f0') lineas.push(`${tt('f0_total')}: ${Number(l.f0).toFixed(1)} min`);
  }
  // Pie (format_footer)
  lineas.push(`${tt('temp_final')}: ${pie.tempFinal != null ? Number(pie.tempFinal).toFixed(0) : '---'} C`);
  lineas.push(`${tt('estado')}: ${resultadoTicket(pie.estado)}`);
  if (pie.codigo) lineas.push(`${tt('motivo')}: ${textoMotivo(pie.codigo)}`);
  if (String(pie.estado || '') !== 'COMPLETADO') lineas.push(tt('no_esteril'));
  if (pie.f0Total != null) lineas.push(`${tt('f0_total')}: ${Number(pie.f0Total).toFixed(1)} min`);
  for (const ob of pie.observaciones || []) {
    const faseTxt = t(`ticket_ciclo.fase.${String(ob.fase || '').toUpperCase()}`);
    lineas.push(`${tt('observacion')}: ${tt('observacion_referencia', { sensor: nombreSensor(ob.sensor), hora: hm(c.inicio + ob.t * 1000), fase: faseTxt })}`);
  }
  for (const a of pie.avisos || []) lineas.push(lineaAviso(a, c.inicio));
  lineas.push(`${tt('hora_fin')}: ${hms(pie.horaFin)}`);
  lineas.push(pie.operador ? `${tt('operador')}: ${pie.operador}` : `${tt('operador')}: ____________`);
  lineas.push(SEP, '', '', '', '', '');
  return lineas;
}
