// FilaInterruptor.qml: fila tocable con interruptor (pomo blanco; on accionPrimario, off bordeCampo).
// crearFilaInterruptor({etiqueta, detalle, marcado, bloqueado, ultima, alAlternar(nuevoValor)})
//   -> { el, actualizar(datos) }
import { h, iconoMono } from '../../core/dom.js';

export function crearFilaInterruptor(op = {}) {
  const o = { etiqueta: '', detalle: '', marcado: false, bloqueado: false, ultima: false, ...op };
  const etiqueta = h('div', { class: 'fi-etiqueta' });
  const detalle = h('div', { class: 'fi-detalle' });
  const candado = h('span', { class: 'fi-candado' }, iconoMono('candado', { tam: null, clase: 'fi-candado-ico', color: 'var(--c-borde-campo)' }));
  const pomo = h('span', { class: 'fi-pomo' });
  const inter = h('span', { class: 'fi-inter' }, pomo);
  const el = h('div', { class: 'fi tocable', role: 'switch', tabindex: '0', onclick: () => { if (!o.bloqueado) { o.marcado = !o.marcado; pintar(); o.alAlternar?.(o.marcado); } } },
    h('div', { class: 'fi-textos' }, etiqueta, detalle), candado, inter);

  function pintar() {
    etiqueta.textContent = o.etiqueta;
    detalle.textContent = o.detalle || '';
    detalle.style.display = o.detalle ? '' : 'none';
    candado.style.display = o.bloqueado ? '' : 'none';
    inter.classList.toggle('on', !!o.marcado);
    el.classList.toggle('bloqueado', !!o.bloqueado);
    el.classList.toggle('ultima', !!o.ultima);
    el.setAttribute('aria-checked', o.marcado ? 'true' : 'false');
    el.setAttribute('aria-disabled', o.bloqueado ? 'true' : 'false');
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
