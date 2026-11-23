// ModalConfirmacion (Componentes/ModalConfirmacion.qml): título 36 Bold, divisor,
// cuerpo 28, nota opcional ámbar y dos botones de 88 de alto (mín. 340): «Volver»
// (contorno) y la acción (color configurable). Tocar el velo = Volver, sin acción.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';

/**
 * abrirModalConfirmacion({titulo, cuerpo, nota, textoVolver, textoAccion,
 *   colorAccion = 'var(--c-accion-primario)', colorTextoAccion = 'var(--c-texto-sobre-accion)',
 *   alAceptar, alCancelar}) -> { el, cerrar() }
 */
export function abrirModalConfirmacion({ titulo = '', cuerpo = '', nota = '', textoVolver = t('ciclo.modal_volver'),
  textoAccion = '', colorAccion = 'var(--c-accion-primario)', colorTextoAccion = 'var(--c-texto-sobre-accion)',
  alAceptar = null, alCancelar = null } = {}) {
  // Composición adaptable: tarjeta de ancho relativo a la ventana (CSS), cuerpo desplazable,
  // botones de 44 px o más que se apilan si no caben lado a lado.
  let accion = 'cancelar';
  const bVolver = h('button', { class: 'fc-mc-volver' }, h('span', { text: textoVolver }));
  const bAccion = h('button', { class: 'fc-mc-accion', style: { background: colorAccion, color: colorTextoAccion } },
    h('span', { text: textoAccion }));
  const tarjeta = h('div', { class: 'fc-mc-tarjeta fc-entrada' },
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
