// ModalConfirmacion (Componentes/ModalConfirmacion.qml): título 36 Bold, divisor,
// cuerpo 28, nota opcional ámbar y dos botones de 88 de alto (mín. 340): «Volver»
// (contorno) y la acción (color configurable). Tocar el velo = Volver, sin acción.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';
import { medir } from './_ciclo_util.js';

/**
 * abrirModalConfirmacion({titulo, cuerpo, nota, textoVolver, textoAccion,
 *   colorAccion = 'var(--c-accion-primario)', colorTextoAccion = 'var(--c-texto-sobre-accion)',
 *   alAceptar, alCancelar}) -> { el, cerrar() }
 */
export function abrirModalConfirmacion({ titulo = '', cuerpo = '', nota = '', textoVolver = t('ciclo.modal_volver'),
  textoAccion = '', colorAccion = 'var(--c-accion-primario)', colorTextoAccion = 'var(--c-texto-sobre-accion)',
  alAceptar = null, alCancelar = null } = {}) {
  const ancho = 1200 - 160;
  const util = ancho - 96 - 40;
  const base = 340;
  const aV = Math.min(Math.max(base, medir(textoVolver, 26, 600) + 32), util / 2);
  const aA = Math.min(Math.max(base, medir(textoAccion, 26, 600) + 32), util - aV);
  let accion = 'cancelar';
  const bVolver = h('button', { class: 'fc-mc-volver', style: { width: `${aV}px` } }, h('span', { text: textoVolver }));
  const bAccion = h('button', { class: 'fc-mc-accion', style: { width: `${aA}px`, background: colorAccion, color: colorTextoAccion } },
    h('span', { text: textoAccion }));
  const tarjeta = h('div', { class: 'fc-mc-tarjeta fc-entrada', style: { width: `${ancho}px` } },
    h('div', { class: 'fc-mc-titulo', text: titulo }),
    h('div', { class: 'fc-mc-linea' }),
    h('div', { class: 'fc-mc-cuerpo desplazable' },
      cuerpo ? h('div', { class: 'fc-mc-texto', text: cuerpo }) : null,
      nota ? h('div', { class: 'fc-mc-nota', text: nota }) : null),
    h('div', { class: 'fc-mc-botones' }, bVolver, bAccion));
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());
  const cerrar = abrirModal(tarjeta, {
    cerrarAlTocarVelo: true,
    alCerrar: () => { if (accion === 'aceptar') alAceptar?.(); else alCancelar?.(); },
  });
  bVolver.addEventListener('click', () => { accion = 'cancelar'; cerrar(); });
  bAccion.addEventListener('click', () => { accion = 'aceptar'; cerrar(); });
  return { el: tarjeta, cerrar: () => { accion = 'cancelar'; cerrar(); } };
}
