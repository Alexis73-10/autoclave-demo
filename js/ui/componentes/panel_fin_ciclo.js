// PanelFinCiclo (Componentes/PanelFinCiclo.qml) + FilaAcordeon + armado de textos
// (ui_qml/domain/fin_de_ciclo.py). En un ciclo no exitoso reemplaza a la gráfica:
// «CARGA NO ESTÉRIL» 36 Bold rojo (u «OBSERVACIONES DEL CICLO» ámbar), subtítulo 22,
// botón «Ver gráfica» (66 de alto, borde azul), divisor, fila destacada de la causa
// (abierta al empezar) y acordeón de las alarmas del ciclo.
//
// armarFin(ciclo) -> {modo:''|'fallo'|'cancelado'|'emergencia'|'observaciones', horaFin, causa, alarmas, cantidad, notaObservaciones}
// crearPanelFinCiclo({ancho, alto, alVerGrafica}) -> {el, fijar(fin, subtitulo), volverAlPanel()}
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { hms, dos, valorI18n, textosAlarma } from './_ciclo_util.js';

const FASES = ['precalentamiento', 'vacio', 'calentamiento', 'esterilizacion', 'descompresion', 'secado'];
const PRIORIDAD = { FALLO_CRITICO: 'alta', ALARMA: 'media', AVISO: 'baja', INFORMATIVO: 'baja', EMERGENCIA: 'alta', FALLA: 'media', ALERTA: 'baja' };
const prioridad = (n) => (['alta', 'media', 'baja'].includes(n) ? n : PRIORIDAD[n] || 'alta');
const nombreFase = (f) => { const k = String(f || '').toLowerCase().replace('pre_vacio', 'vacio'); return FASES.includes(k) ? t(`fases.${k}`) : t('sistema.sin_lectura'); };
function fechaCorta(v) {
  const d = new Date(v);
  if (v == null || v === '' || isNaN(d)) return '';
  const meses = valorI18n('fecha.meses') || [];
  return `${dos(d.getDate())}-${(meses[d.getMonth()] || '').toLowerCase()}-${d.getFullYear()}`;
}

export function armarFin(ciclo) {
  const vacio = { modo: '', horaFin: '', causa: {}, alarmas: [], cantidad: 0, notaObservaciones: '' };
  if (!ciclo || !ciclo.resultado) return vacio;
  const term = ciclo.terminacion || {};
  let tipo = ['fallo', 'emergencia', 'cancelado', 'exitoso'].includes(term.tipo) ? term.tipo : 'fallo';
  if (ciclo.resultado === 'exitoso') tipo = term.tipo === 'exitoso' || !term.tipo ? 'exitoso' : 'fallo';
  else if (tipo === 'exitoso') tipo = ciclo.resultado === 'cancelado' ? 'cancelado' : 'fallo';
  const horaFin = term.horaFin ?? null;
  const fase = nombreFase(term.fase);
  const hora = hms(horaFin);
  const fecha = [fechaCorta(horaFin), hora].filter(Boolean).join(' ');
  const filas = (ciclo.alarmasCiclo || []).map((a) => {
    const tx = textosAlarma(a);
    const visible = a.codigoVisible || a.codigo || '';
    return {
      titulo: tx.titulo || visible, hora: hms(a.aparecida), nivel: prioridad(a.nivel), descripcion: tx.descripcion,
      queHacer: tx.accion,
      meta: a.resuelta ? t('ciclo.fin_meta_alarma_resuelta', { hora: hms(a.aparecida), codigo: visible, resuelta: hms(a.resuelta) })
        : t('ciclo.fin_meta_alarma_activa', { hora: hms(a.aparecida), codigo: visible }),
    };
  });
  for (const o of term.observaciones || []) {
    if ((ciclo.alarmasCiclo || []).some((a) => a.codigo === 'SEN-11')) break;
    const tx = textosAlarma({ codigo: 'SEN-11' });
    filas.push({ titulo: tx.titulo || 'SEN-11', hora: o.hora || '', nivel: 'baja',
      descripcion: (tx.descripcion || '').replace('{sensor}', o.sensor).replace('{fase}', nombreFase(o.fase)),
      queHacer: tx.accion, meta: t('ciclo.fin_meta_alarma_activa', { hora: o.hora || '', codigo: 'SEN-11' }) });
  }
  let causa = {};
  if (tipo === 'cancelado') {
    const u = term.canceladoPor;
    causa = { titulo: t('ciclo.fin_causa_cancelado'),
      subtitulo: u ? t('ciclo.fin_causa_cancelado_sub_usuario', { usuario: u, fase }) : t('ciclo.fin_causa_cancelado_sub', { fase }),
      hora, descripcion: '', queHacer: t('ciclo.fin_causa_cancelado_accion'),
      meta: t('ciclo.fin_meta_causa_sin_codigo', { fase, fecha }), nivel: 'cancelado' };
  } else if (tipo === 'emergencia') {
    const codigo = term.codigo || 'SIS-01';
    causa = { titulo: t('ciclo.fin_causa_emergencia'), subtitulo: t('ciclo.fin_causa_emergencia_sub', { fase }), hora,
      descripcion: textosAlarma({ codigo }).descripcion, queHacer: t('ciclo.fin_causa_emergencia_accion'),
      meta: t('ciclo.fin_meta_causa', { fase, fecha, codigo }), nivel: 'fallo' };
  } else if (tipo === 'fallo') {
    const codigo = term.codigo;
    const tx = codigo ? textosAlarma({ codigo, titulo: term.titulo, accion: term.accion }) : { titulo: term.titulo || '', descripcion: '', accion: term.accion || '' };
    causa = { titulo: term.fase ? t('ciclo.fin_causa_fallo_fase', { fase: fase.toLowerCase() }) : t('ciclo.fin_causa_generica'),
      subtitulo: tx.titulo || '', hora, descripcion: term.motivo || tx.descripcion || '', queHacer: tx.accion,
      meta: codigo ? t('ciclo.fin_meta_causa', { fase, fecha, codigo: term.codigoVisible || codigo }) : t('ciclo.fin_meta_causa_sin_codigo', { fase, fecha }), nivel: 'fallo' };
  }
  const nota = (term.observaciones || []).map((o) => t('ciclo.modal_nota_observacion',
    { sensor: o.sensor, hora: o.hora || t('sistema.sin_lectura'), fase: nombreFase(o.fase) })).join('\n');
  return { modo: tipo === 'exitoso' ? (filas.length ? 'observaciones' : '') : tipo, horaFin: hora.slice(0, 5), causa, alarmas: filas,
    cantidad: (tipo === 'exitoso' ? 0 : 1) + filas.length, notaObservaciones: nota };
}

function filaAcordeon({ destacada = false, titulo = '', subtitulo = '', hora = '', descripcion = '', queHacer = '', meta = '', nivel = 'alta' }, alPulsar) {
  const color = nivel === 'cancelado' ? 'var(--c-texto-guia)' : nivel === 'media' ? 'var(--c-alarma-media)' : nivel === 'baja' ? 'var(--c-alarma-baja)' : 'var(--c-alarma-alta)';
  const chev = h('span', { class: 'fc-fac-chev', text: '›' });
  const cuerpo = h('div', { class: 'fc-fac-cuerpo' },
    descripcion ? h('div', { class: 'fc-fac-desc', text: descripcion }) : null,
    queHacer ? h('div', { class: 'fc-fac-rot', text: t('ciclo.fin_que_hacer') }) : null,
    queHacer ? h('div', { class: 'fc-fac-desc', text: queHacer }) : null,
    meta ? h('div', { class: 'fc-fac-meta', text: meta }) : null);
  const el = h('div', { class: `fc-fila-acordeon${destacada ? ' destacada' : ''}` },
    h('span', { class: 'fc-fac-barra', style: { background: color } }),
    h('div', { class: 'fc-fac-cont' },
      h('div', { class: 'fc-fac-cab' },
        h('div', { class: 'fc-fac-tit' }, h('div', { class: 'fc-fac-titulo', text: titulo }),
          destacada && subtitulo ? h('div', { class: 'fc-fac-sub', text: subtitulo }) : null),
        h('span', { class: 'fc-fac-hora', text: hora }), chev),
      cuerpo));
  el.addEventListener('click', alPulsar);
  return { el, abrir(v) { el.classList.toggle('abierta', v); } };
}

export function crearPanelFinCiclo({ ancho = 1129, alto = 794, alVerGrafica = null } = {}) {
  const el = h('div', { class: 'fc-panel-fin', style: { width: `${ancho}px`, height: `${alto}px` } });
  const titulo = h('div', { class: 'fc-pf-titulo' });
  const sub = h('div', { class: 'fc-pf-sub' });
  const cab = h('div', { class: 'fc-pf-cab' }, titulo, sub);
  const bVer = h('button', { class: 'fc-pf-ver', text: t('ciclo.fin_ver_grafica') });
  bVer.addEventListener('click', () => alVerGrafica?.());
  const lista = h('div', { class: 'fc-pf-lista desplazable' });
  el.append(h('div', { class: 'fc-pf-arriba' }), lista);
  el.firstChild.append(cab, bVer);
  let filas = [], abierta = -1, inicial = 0, firma = '';
  const alternar = (i) => { abierta = abierta === i ? -1 : i; filas.forEach((f, k) => f.abrir(k === abierta)); };
  return {
    el,
    fijar(fin, subtitulo) {
      const obs = fin.modo === 'observaciones';
      const f = JSON.stringify([fin, subtitulo]);
      if (f === firma) return;
      firma = f;
      titulo.textContent = obs ? t('ciclo.fin_titulo_observaciones') : t('ciclo.carga_no_esteril');
      titulo.classList.toggle('obs', obs);
      sub.textContent = subtitulo || '';
      filas = [];
      const nodos = [];
      if (!obs) {
        const c = fin.causa || {};
        const fila = filaAcordeon({ destacada: true, titulo: c.titulo || t('ciclo.fin_causa_generica'), subtitulo: c.subtitulo,
          hora: c.hora, descripcion: c.descripcion, queHacer: c.queHacer, meta: c.meta,
          nivel: c.nivel === 'cancelado' ? 'cancelado' : 'alta' }, () => alternar(0));
        filas.push(fila); nodos.push(fila.el, h('div', { class: 'fc-pf-esp' }));
      }
      const al = fin.alarmas || [];
      nodos.push(h('div', { class: 'fc-pf-rotulo', text: al.length ? t('ciclo.fin_alarmas_rotulo_n', { n: al.length }) : t('ciclo.fin_alarmas_rotulo') }));
      al.forEach((a) => { const i = filas.length; const fila = filaAcordeon(a, () => alternar(i)); filas.push(fila); nodos.push(fila.el); });
      if (!al.length) nodos.push(h('div', { class: 'fc-pf-sin', text: t('ciclo.fin_sin_alarmas') }));
      lista.replaceChildren(...nodos);
      inicial = obs ? (al.length ? 0 : -1) : 0;
      abierta = inicial;
      filas.forEach((x, k) => x.abrir(k === abierta));
    },
    volverAlPanel() { abierta = inicial; filas.forEach((x, k) => x.abrir(k === abierta)); lista.scrollTop = 0; },
  };
}
