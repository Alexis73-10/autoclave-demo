// TarjetaResumen (Componentes/TarjetaResumen.qml): tarjeta del Resumen del sistema. En vertical, aro
// centrado arriba, rótulo, valor grande y subrótulo; en horizontal (panel lateral del Menú) es una fila
// compacta: aro a la izquierda, rótulo y subrótulo en el centro y valor a la derecha (solo CSS).
import { h } from '../../core/dom.js';
import { mascara, encajar } from './menu_iconos.js';

/**
 * crearTarjetaResumen({icono (en iconos/mono), incluyeAro=false, colorAcento, rotulo, valor, subrotulo,
 *   interactiva=true, alPulsar}) -> {el, contenido, fijarValor(v), destruir()}
 * (x, y, ancho, alto, tamIcono se aceptan y se ignoran.)
 */
export function crearTarjetaResumen({ icono, incluyeAro = false, colorAcento = 'var(--c-texto-primario)', rotulo = '',
  valor = null, subrotulo = '', interactiva = true, alPulsar } = {}) {
  const el = h(interactiva ? 'button' : 'div', { class: `mn-tarjeta-resumen${interactiva ? '' : ' sin-toque'}` });
  const aro = h('span', { class: `mn-rs-aro${incluyeAro ? ' incluido' : ''}` });
  aro.style.setProperty('--acento', colorAcento);
  aro.append(mascara(`assets/iconos/mono/${icono}.svg`, null, colorAcento, 'mn-rs-ico'));
  const rot = h('span', { class: 'mn-rs-rotulo', text: rotulo });
  const contenido = h('span', { class: 'mn-rs-contenido' });
  el.append(aro, rot);
  let elValor = null;
  let quitar = null;
  if (valor != null) {
    elValor = h('span', { class: 'mn-rs-valor', text: valor });
    el.append(elValor);
    quitar = encajar(elValor);
    if (subrotulo) el.append(h('span', { class: 'mn-rs-sub', text: subrotulo }));
  } else el.classList.add('sin-valor');
  el.append(contenido);
  if (interactiva && alPulsar) el.addEventListener('click', alPulsar);
  return {
    el, contenido,
    fijarValor(v) { if (elValor) { elValor.textContent = v; elValor._reencajar?.(); } },
    destruir() { quitar?.(); },
  };
}
