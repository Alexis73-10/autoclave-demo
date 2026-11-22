// DialogoConfirmacion.qml: modal con mensaje centrado (30 SemiBold) y dos botones de 88.
// abrirDialogoConfirmacion({mensaje, textoConfirmar, textoCancelar, colorConfirmar, alConfirmar, alDescartar})
//   -> cerrar()   (sin textos usa acciones.confirmar / acciones.cancelar)
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';

export function abrirDialogoConfirmacion({ mensaje = '', textoConfirmar, textoCancelar, colorConfirmar, alConfirmar, alDescartar } = {}) {
  let cerrar = null;
  const cancelar = h('button', { class: 'dc-boton', type: 'button', text: textoCancelar ?? t('acciones.cancelar'),
    onclick: () => { cerrar(); alDescartar?.(); } });
  const confirmar = h('button', { class: 'dc-boton dc-confirmar', type: 'button', text: textoConfirmar ?? t('acciones.confirmar'),
    style: colorConfirmar ? { background: colorConfirmar } : null,
    onclick: () => { cerrar(); alConfirmar?.(); } });
  const tarjeta = h('div', { class: 'dc-tarjeta' }, h('div', { class: 'dc-mensaje', text: mensaje }), h('div', { class: 'dc-botones' }, cancelar, confirmar));
  cerrar = abrirModal(tarjeta);
  return cerrar;
}
