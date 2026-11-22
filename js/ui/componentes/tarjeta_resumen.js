// TarjetaResumen (Componentes/TarjetaResumen.qml): tarjeta del Resumen del sistema.
// Aro de 106 con borde 5 centrado arriba (y 26), rótulo 20 Bold (línea base 186), valor 46 Bold (258),
// subrótulo 19 (303). `contenido` permite poner contenido propio (Último ciclo).
import { h } from '../../core/dom.js';
import { pos, texto } from './menu_util.js';
import { mascara, ajustar } from './menu_iconos.js';

/**
 * crearTarjetaResumen({x, y, ancho, alto=330, icono (en iconos/mono), tamIcono=76, incluyeAro=false, colorAcento,
 *   rotulo, valor, subrotulo, interactiva=true, alPulsar}) -> {el, contenido, fijarValor(v)}
 */
export function crearTarjetaResumen({ x, y, ancho, alto = 330, icono, tamIcono = 76, incluyeAro = false,
  colorAcento = 'var(--c-texto-primario)', rotulo = '', valor = null, subrotulo = '', interactiva = true, alPulsar } = {}) {
  const el = pos(h('div', { class: `mn-tarjeta-resumen${interactiva ? '' : ' sin-toque'}` }), x, y, ancho, alto);
  const d = 106;
  const aro = pos(h('div', { class: 'mn-aro' }), ancho / 2 - d / 2, 26, d, d);
  if (!incluyeAro) aro.style.boxShadow = `inset 0 0 0 5px ${colorAcento}`;
  const tam = incluyeAro ? d * 48 / 40 : tamIcono;
  aro.append(pos(mascara(`assets/iconos/mono/${icono}.svg`, tam, colorAcento), d / 2 - tam / 2, d / 2 - tam / 2));
  el.append(aro);
  const lineas = rotulo.split('\n').length;
  el.append(texto(rotulo, { cx: ancho / 2, w: ancho - 16, bl: 186 - 27 * (lineas - 1), tam: 20, peso: 700, interlineado: 27, pre: true,
    color: 'var(--c-texto-primario)' }));
  const contenido = pos(h('div', { class: 'mn-rs-contenido' }), 0, 0, ancho, alto);
  let elValor = null;
  if (valor != null) {
    elValor = texto(valor, { cx: ancho / 2, w: ancho - 24, bl: 258, tam: 46, peso: 700, color: 'var(--c-texto-primario)' });
    elValor.style.whiteSpace = 'nowrap';
    el.append(elValor);
    ajustar(elValor, ancho - 24, 46, 700, 20);
    if (subrotulo) el.append(texto(subrotulo, { cx: ancho / 2, w: ancho - 16, bl: 303, tam: 19, color: 'var(--c-texto-primario)' }));
  }
  el.append(contenido);
  if (interactiva && alPulsar) el.addEventListener('click', alPulsar);
  return { el, contenido, fijarValor(v) { if (elValor) { elValor.textContent = v; ajustar(elValor, ancho - 24, 46, 700, 20); } } };
}
