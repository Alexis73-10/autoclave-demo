// SeccionEstadoSeguro (Componentes/SeccionEstadoSeguro.qml) y FilaAlarma.
// Filas de seguridad compartidas por la tarjeta de alarmas de Preciclo, la de
// Ciclo en curso y el panel de la campana: paro (alta), confirmación del paro
// pendiente (alta, con su botón), NO ABRIR con motivo (media) y modo prueba (baja).
// Grupos (nivel): "emergencia" (paro y confirmación), "alarma" (NO ABRIR),
// "aviso" (modo prueba); "" = todos. Toda fila abre VentanaDetalleAlarma (ALD).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { sim } from '../../sim/motor.js';
import { abrirDetalleAlarma } from './ventana_detalle_alarma.js';
import { colorNivel } from './_ciclo_util.js';

/** FilaAlarma: barra de color 12 px por prioridad + texto 24 (multilínea), alto mín. 72. */
export function crearFilaAlarma({ nivel = 'alta', texto = '', alTocar = null, clase = '' } = {}) {
  const barra = h('span', { class: 'fc-fa-barra', style: { background: colorNivel(nivel) } });
  const tx = h('span', { class: 'fc-fa-texto', text: texto });
  const el = h('div', { class: `fc-fila-alarma ${clase}` }, barra, tx);
  if (alTocar) { el.classList.add('tocable'); el.addEventListener('click', alTocar); }
  return {
    el,
    fijar(n, txt) { barra.style.background = colorNivel(n); if (tx.textContent !== txt) tx.textContent = txt; },
  };
}

/** Banderas de seguridad leídas de sim.estado (campos opcionales del simulador). */
export function seguridadDe(e) {
  const po = e?.paro && typeof e.paro === 'object' ? e.paro : null;
  const paro = !!(po ? po.activo : (e?.paroActivo ?? e?.paro));
  const confirmar = !paro && !!(po ? po.requiereConfirmacion : e?.confirmacionParo);
  const noAbrir = !paro && e?.camaraSegura === false;
  const modoPrueba = !!(e?.modoPrueba ?? e?.modo_prueba);
  const cEm = (paro || confirmar) ? 1 : 0;
  const cAl = noAbrir ? 1 : 0;
  const cAv = modoPrueba ? 1 : 0;
  return { paro, confirmar, noAbrir, modoPrueba, motivo: e?.noAbrirMotivo || '',
    conteoEmergencia: cEm, conteoAlarma: cAl, conteoAviso: cAv, conteoTotal: cEm + cAl + cAv,
    urgente: paro || confirmar, parpadeo: paro || confirmar };
}

// Fila sintética con la forma de una alarma (domain/detalle_aviso.py)
const SINTETICAS = {
  paro: { codigo: 'PARO_EMERGENCIA', nivel: 'alta', desc: 'sistema.paro_no_abrir' },
  estado_seguro_pendiente: { codigo: 'ESTADO_SEGURO_PENDIENTE', nivel: 'alta', desc: 'sistema.estado_seguro_pendiente' },
  no_abrir: { codigo: 'NO_ABRIR', nivel: 'media', desc: '' },
  modo_prueba: { codigo: 'MODO_PRUEBA', nivel: 'baja', desc: 'sistema.modo_prueba' },
};
const apariciones = {};
export function filaSintetica(clave, e) {
  const s = SINTETICAS[clave];
  const seg = seguridadDe(e);
  const activa = clave === 'paro' ? seg.paro : clave === 'estado_seguro_pendiente' ? seg.confirmar
    : clave === 'no_abrir' ? seg.noAbrir : seg.modoPrueba;
  if (!activa) { delete apariciones[clave]; return null; }
  apariciones[clave] ??= Date.now();
  return { id: s.codigo, codigo: s.codigo, codigoVisible: s.codigo, nivel: s.nivel,
    titulo: t(`aviso_detalle.${clave}.titulo`),
    descripcion: clave === 'no_abrir' ? (seg.motivo || t('sistema.no_abrir')) : t(s.desc),
    accion: t(`aviso_detalle.${clave}.accion`), aparecida: apariciones[clave], sintetica: true };
}

/**
 * crearSeccionEstadoSeguro({grupo = ''}) -> { el, actualizar(estado), conteo(), destruir() }
 * Se actualiza con cada tick (`actualizar(sim.estado)`); `conteo()` = filas visibles.
 */
export function crearSeccionEstadoSeguro({ grupo = '' } = {}) {
  const en = (g) => grupo === '' || grupo === g;
  const abrir = (clave) => {
    const d = filaSintetica(clave, sim.estado);
    if (d) abrirDetalleAlarma(d, { obtener: (e) => filaSintetica(clave, e) });
  };
  const fParo = crearFilaAlarma({ nivel: 'alta', texto: t('sistema.paro_no_abrir'), alTocar: () => abrir('paro') });
  const nParo = h('div', { class: 'fc-ses-nota', text: t('sistema.paro_suelte') });
  const fConf = crearFilaAlarma({ nivel: 'alta', texto: t('sistema.estado_seguro_pendiente'), alTocar: () => abrir('estado_seguro_pendiente') });
  const nConf = h('div', { class: 'fc-ses-nota borde', text: t('sistema.paro_liberado') });
  const bConf = h('button', { class: 'fc-ses-boton', text: t('sistema.confirmar_estado_seguro'),
    onclick: () => { (sim.confirmarParo || sim.confirmarEstadoSeguro)?.call(sim); } });
  const tConf = h('div', { class: 'fc-ses-guia', text: t('sistema.confirmar_sin_sesion') });
  const fNo = crearFilaAlarma({ nivel: 'media', texto: t('sistema.no_abrir'), alTocar: () => abrir('no_abrir') });
  const fPr = crearFilaAlarma({ nivel: 'baja', texto: t('sistema.modo_prueba'), alTocar: () => abrir('modo_prueba') });
  const el = h('div', { class: 'fc-seccion-seguridad' }, fParo.el, nParo, fConf.el, nConf, bConf, tConf, fNo.el, fPr.el);
  let n = 0;
  const ver = (nodo, v) => nodo.classList.toggle('oculto', !v);
  function actualizar(e) {
    const s = seguridadDe(e);
    const vp = s.paro && en('emergencia');
    const vc = s.confirmar && en('emergencia');
    const vn = s.noAbrir && en('alarma');
    const vm = s.modoPrueba && en('aviso');
    ver(fParo.el, vp); ver(nParo, vp);
    [fConf.el, nConf, bConf, tConf].forEach((x) => ver(x, vc));
    ver(fNo.el, vn); ver(fPr.el, vm);
    if (vn) fNo.fijar('media', s.motivo ? `${t('sistema.no_abrir')} — ${s.motivo}` : t('sistema.no_abrir'));
    n = (vp || vc ? 1 : 0) + (vn ? 1 : 0) + (vm ? 1 : 0);
    el.classList.toggle('vacia', n === 0);
  }
  actualizar(sim.estado);
  return { el, actualizar, conteo: () => n, destruir() {} };
}
