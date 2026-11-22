// FilaInterruptor.qml: fila de 88 con interruptor 73x39 (pomo blanco; on accionPrimario, off bordeCampo).
// crearFilaInterruptor({etiqueta, detalle, marcado, bloqueado, ultima, alAlternar(nuevoValor)})
//   -> { el, actualizar(datos) }
import { h, iconoMono } from '../../core/dom.js';

export function crearFilaInterruptor(op = {}) {
  const o = { etiqueta: '', detalle: '', marcado: false, bloqueado: false, ultima: false, ...op };
  const etiqueta = h('div', { class: 'fi-etiqueta' });
  const detalle = h('div', { class: 'fi-detalle' });
  const candado = h('span', { class: 'fi-candado' }, iconoMono('candado', { tam: 36, color: 'var(--c-borde-campo)' }));
  const pomo = h('span', { class: 'fi-pomo' });
  const inter = h('span', { class: 'fi-inter' }, pomo);
  const el = h('div', { class: 'fi', onpointerup: () => { if (!o.bloqueado) { o.marcado = !o.marcado; pintar(); o.alAlternar?.(o.marcado); } } },
    h('div', { class: 'fi-textos' }, etiqueta, detalle), candado, inter);

  function pintar() {
    etiqueta.textContent = o.etiqueta;
    detalle.textContent = o.detalle || '';
    detalle.style.display = o.detalle ? '' : 'none';
    candado.style.display = o.bloqueado ? '' : 'none';
    inter.classList.toggle('on', !!o.marcado);
    el.classList.toggle('bloqueado', !!o.bloqueado);
    el.classList.toggle('ultima', !!o.ultima);
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
