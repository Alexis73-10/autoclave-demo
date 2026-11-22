// Tirilla del ciclo: el ticket de 24 columnas de la impresora térmica (A4 §1) sobre
// un papel blanco con fuente mono, desplazable. No existe como pantalla en el
// software (allí se imprime); es un agregado de la demo. params: {registro} o
// {cicloId}; sin registro guardado y con el ciclo en curso, se arma del ciclo vivo
// y se actualiza cada segundo.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import * as router from '../../core/router.js';
import { sim } from '../../sim/motor.js';
import { crearFondo } from '../componentes/_comun_pantalla_ciclo.js';
import { mascara, loc, dos } from '../componentes/_ciclo_util.js';

let modTirilla = null, modHistorial = null;
async function cargarModulos() {
  if (!modTirilla) { try { modTirilla = await import('../../sim/tirilla.js'); } catch { modTirilla = {}; } }
  if (!modHistorial) { try { modHistorial = await import('../../sim/historial.js'); } catch { modHistorial = {}; } }
}

function registroDeCiclo(c) {
  return { ...c, alarmas: c.alarmasCiclo || [], fin: null, duracionS: c.transcurridoS, enCurso: !c.resultado };
}

/** Respaldo si el simulador no da los datos del ticket (ciclo aún en curso): mismo formato de A4 §1. */
const CODIGO = { PRECALENTAMIENTO: 'PH', PRE_VACIO: 'PV', VACIO: 'PV', CALENTAMIENTO: 'H', ESTERILIZACION: 'S', COMPLETADO: 'E' };
const MESES = { es: 'ENE FEB MAR ABR MAY JUN JUL AGO SEP OCT NOV DIC', en: 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC' };
function tirillaRespaldo(r) {
  const L = '-'.repeat(24);
  const d = new Date(r.inicio || Date.now());
  const meses = (document.documentElement.lang === 'en' ? MESES.en : MESES.es).split(' ');
  const eq = sim.estado.equipo || {};
  const hms = (seg) => { const x = Math.max(0, Math.round(seg)); return `${dos(Math.floor(x / 3600))}:${dos(Math.floor(x / 60) % 60)}:${dos(x % 60)}`; };
  const f06 = (v) => (v == null ? ' -----' : Number(v).toFixed(1).padStart(6, '0'));
  const lineas = [' ', L, `Fecha: ${dos(d.getDate())}/${meses[d.getMonth()]}/${d.getFullYear()}`,
    `Hora:  ${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`,
    `Num serie: ${eq.serie || ''}`, `Modelo: ${eq.modelo || ''}`,
    `Ciclo No.: ${String(r.numero ?? 0).padStart(6, '0')}`, String(r.programaNombre || ''), `(${r.programaId || ''})`,
    '  Hora      C      kPa'];
  let prevFase = null, ultT = -1e9;
  for (const s of r.serie || []) {
    const f = String(s.fase || '').toUpperCase();
    const intervalo = f === 'ESTERILIZACION' ? 30 : f === 'CALENTAMIENTO' ? 60 : Infinity;
    if (f !== prevFase || s.t - ultT >= intervalo) {
      lineas.push(`${CODIGO[f] || ' '} ${hms(s.t)} ${f06(s.tc)} ${f06(s.pc)}`);
      prevFase = f; ultT = s.t;
    }
  }
  if (!r.resultado) lineas.push('', loc({ es: '(ciclo en curso)', en: '(cycle running)' }));
  else lineas.push(L, '', '', '', '', '');
  return lineas;
}

export function crear(params = {}) {
  const raiz = h('div', { class: 'fc-pantalla fc-tirilla' });
  const papel = h('pre', { class: 'fc-papel' });
  const rollo = h('div', { class: 'fc-rollo desplazable' }, h('div', { class: 'fc-papel-borde' }), papel, h('div', { class: 'fc-papel-corte' }));
  const volver = h('button', { class: 'fc-tir-volver', 'aria-label': t('acciones.cerrar') },
    mascara('assets/iconos/color/back_icon.svg', 70, 'var(--c-icono-barra-menu)'));
  volver.addEventListener('click', () => router.pop());
  const titulo = h('div', { class: 'fc-tir-titulo', text: loc({ es: 'TIRILLA DEL CICLO', en: 'CYCLE TICKET' }) });
  const barra = h('div', { class: 'fc-tir-barra' }, volver, h('span', { class: 'marca-demo fc-tir-demo', text: 'DEMO' }));
  raiz.append(crearFondo(), titulo, rollo, barra);

  let quitar = null, ultimo = '', enVivo = false;
  const pintar = (lineas) => {
    const txt = lineas.join('\n');
    if (txt === ultimo) return;
    const alFinal = rollo.scrollTop + rollo.clientHeight >= rollo.scrollHeight - 8;
    ultimo = txt; papel.textContent = txt;
    if (enVivo && alFinal) rollo.scrollTop = rollo.scrollHeight;
  };
  const generar = (r) => { const l = modTirilla?.generarTirilla ? modTirilla.generarTirilla(r) : (r.tirilla || []); return l && l.length ? l : tirillaRespaldo(r); };

  cargarModulos().then(() => {
    let reg = params.registro || null;
    const id = params.cicloId ?? null;
    if (!reg && id != null) reg = modHistorial?.obtener?.(id) || null;
    const vivo = () => { const c = sim.estado.ciclo; return c && (id == null || c.id === id) ? c : null; };
    if (!reg && vivo()) {
      enVivo = true;
      let t0 = 0;
      const act = () => { const c = vivo(); if (c && Date.now() - t0 > 1000) { t0 = Date.now(); pintar(generar(sim.registroEnCurso?.() || registroDeCiclo(c))); } };
      act();
      quitar = on('sim', act);
      return;
    }
    if (!reg) reg = sim.estado.ultimoCiclo || modHistorial?.listar?.()[0] || null;
    if (reg) pintar(reg.tirilla && reg.tirilla.length ? reg.tirilla : generar(reg));
    else papel.textContent = t('sistema.sin_lectura');
  });

  return { el: raiz, destruir() { quitar?.(); } };
}
