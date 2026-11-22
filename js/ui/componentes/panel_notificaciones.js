// PanelNotificaciones (Componentes/PanelNotificaciones.qml): cuadro de la campana.
// PanelModal de alto 1400 con tres grupos plegables por nivel: «Emergencia / Fallas»
// (abierto al empezar), «Alarmas» y «Avisos»; cabecera de 96 con contador en
// píldora (rojo en emergencia, azul en los demás, gris en cero) y chevron. Cada
// grupo lleva sus filas de seguridad (SeccionEstadoSeguro) y las alarmas de su
// nivel (FilaAlarma, solo el nombre); tocar una fila abre VentanaDetalleAlarma.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { sim } from '../../sim/motor.js';
import { abrirPanelModal } from './_panel_modal.js';
import { crearSeccionEstadoSeguro, crearFilaAlarma, seguridadDe } from './seccion_estado_seguro.js';
import { abrirDetalleAlarma } from './ventana_detalle_alarma.js';
import { grupoDe, textosAlarma, mascara } from './_ciclo_util.js';

/** Insignia de la campana: {conteo, urgente (roja), parpadeo}. Alarmas activas + filas de seguridad. */
export function resumenNotificaciones(estado = sim.estado) {
  const s = seguridadDe(estado);
  const alarmas = (estado?.alarmas || []).length;
  return { conteo: alarmas + s.conteoTotal, urgente: s.urgente, parpadeo: s.parpadeo };
}

/**
 * Insignia circular (InsigniaCampana.qml) para dibujar sobre una campana:
 * crearInsigniaCampana({tam = 26, tamFuente = 17}) -> { el, actualizar(estado) }.
 * El que la usa la posiciona (en Preciclo/Ciclo: x 922, y 50, 26 x 25).
 */
export function crearInsigniaCampana({ tam = 26, tamFuente = 17 } = {}) {
  const el = h('div', { class: 'fc-insignia oculto', style: { width: `${tam}px`, height: `${tam - 1}px`, fontSize: `${tamFuente}px` } });
  return {
    el,
    actualizar(estado) {
      const r = resumenNotificaciones(estado);
      el.classList.toggle('oculto', r.conteo <= 0);
      el.classList.toggle('urgente', r.urgente);
      el.classList.toggle('parpadeo', r.parpadeo);
      const txt = String(r.conteo);
      if (el.textContent !== txt) el.textContent = txt;
    },
  };
}

const GRUPOS = [
  { seccion: 'emergencia', clave: 'notificaciones.grupo_emergencia', abierto: true },
  { seccion: 'alarma', clave: 'notificaciones.grupo_alarmas', abierto: false },
  { seccion: 'aviso', clave: 'notificaciones.grupo_avisos', abierto: false },
];

/** abrirPanelNotificaciones() -> { cerrar() }. Se actualiza solo mientras está abierto. */
export function abrirPanelNotificaciones() {
  const grupos = GRUPOS.map((g) => {
    const seguridad = crearSeccionEstadoSeguro({ grupo: g.seccion });
    const contador = h('span', { class: 'fc-pn-contador', text: '0' });
    const chevron = mascara('assets/iconos/color/chevron_abajo.svg', 40, 'var(--c-texto-negro)', 'fc-pn-chevron');
    const cabecera = h('div', { class: 'fc-pn-cabecera' },
      h('span', { class: 'fc-pn-titulo', text: t(g.clave) }), contador, chevron);
    const filas = h('div', { class: 'fc-pn-filas' }, seguridad.el);
    const lista = h('div', { class: 'fc-pn-lista' });
    filas.append(lista);
    const el = h('div', { class: 'fc-pn-grupo' }, cabecera, filas);
    const grupo = { ...g, el, seguridad, contador, chevron, filas, lista, abierto: g.abierto, cache: '' };
    cabecera.addEventListener('click', () => { grupo.abierto = !grupo.abierto; pintarGrupo(grupo, sim.estado); });
    return grupo;
  });
  const vacio = h('div', { class: 'fc-pn-vacio', text: t('ciclo.sin_alarmas') });
  const columna = h('div', { class: 'fc-pn-columna desplazable' }, grupos.map((g) => g.el), vacio);

  function pintarGrupo(g, e) {
    g.seguridad.actualizar(e);
    const propias = (e?.alarmas || []).filter((a) => grupoDe(a.nivel) === g.seccion);
    const n = g.seguridad.conteo() + propias.length;
    g.contador.textContent = String(n);
    g.contador.dataset.tono = n === 0 ? 'cero' : g.seccion === 'emergencia' ? 'rojo' : 'azul';
    g.chevron.style.webkitMaskImage = g.chevron.style.maskImage =
      `url("assets/iconos/color/${g.abierto ? 'chevron_arriba' : 'chevron_abajo'}.svg")`;
    g.chevron.style.backgroundColor = g.abierto ? 'var(--c-texto-primario)' : 'var(--c-texto-negro)';
    g.filas.classList.toggle('oculto', !g.abierto);
    const firma = propias.map((a) => `${a.id}|${a.nivel}|${a.titulo}`).join(';');
    if (firma !== g.cache) {
      g.cache = firma;
      g.lista.replaceChildren(...propias.map((a) => crearFilaAlarma({
        nivel: a.nivel, texto: textosAlarma(a).titulo,
        alTocar: () => abrirDetalleAlarma(a, { obtener: (es) => (es?.alarmas || []).find((x) => x.id === a.id) || null }),
      }).el));
    }
    return n;
  }
  function pintar(e) {
    let total = 0;
    for (const g of grupos) total += pintarGrupo(g, e);
    vacio.classList.toggle('oculto', total > 0);
  }
  pintar(sim.estado);
  const quitar = on('sim', pintar);
  const panel = abrirPanelModal({ titulo: t('notificaciones.titulo'), altoTarjeta: 1400, contenido: columna, alCerrar: quitar });
  return { cerrar: panel.cerrar };
}
