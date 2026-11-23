// SelectorSegmentos.qml: segmentos iguales, activo accionPrimario; si no caben en una fila, pasan a dos.
// crearSelectorSegmentos({opciones:[{valor, etiqueta, habilitada?}], valor, habilitado=true, alElegir(valor)})
//   -> { el, actualizar(datos) }
import { h } from '../../core/dom.js';

export function crearSelectorSegmentos(op = {}) {
  const o = { opciones: [], valor: null, habilitado: true, ...op };
  const el = h('div', { class: 'ss' });

  function pintar() {
    el.replaceChildren(...o.opciones.map((s) => {
      const activo = s.valor === o.valor;
      const libre = o.habilitado && s.habilitada !== false;
      return h('button', { class: `ss-seg${activo ? ' activo' : ''}${libre ? '' : ' inactivo'}`, type: 'button',
        onclick: () => { if (libre && !activo) { o.valor = s.valor; pintar(); o.alElegir?.(s.valor); } } },
        h('span', { text: s.etiqueta }));
    }));
    el.classList.toggle('inactivo', !o.habilitado);
    el.dataset.n = String(o.opciones.length);
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
