// CampoFormulario.qml: etiqueta + recuadro + línea de error (composición fluida, en rem; ver frente_opciones.css).
// crearCampoFormulario({etiqueta, marcador, valor, activo, error, oculto, conOjo, alTocar, alOjo})
//   -> { el, actualizar(datos) }   (datos = cualquier subconjunto de las opciones)
import { h, iconoMono } from '../../core/dom.js';

export function crearCampoFormulario(op = {}) {
  const o = { etiqueta: '', marcador: '', valor: '', activo: false, error: '', oculto: false, conOjo: false, ...op };
  const etiqueta = h('div', { class: 'cf-etiqueta' });
  const texto = h('span', { class: 'cf-texto' });
  const ojo = h('button', { class: 'cf-ojo', type: 'button', onclick: (e) => { e.stopPropagation(); o.alOjo?.(); } });
  const caja = h('div', { class: 'cf-caja', role: 'button', tabindex: '0', onclick: () => o.alTocar?.() }, texto, ojo);
  const error = h('div', { class: 'cf-error' });
  const el = h('div', { class: 'cf' }, etiqueta, caja, error);

  function pintar() {
    etiqueta.textContent = o.etiqueta;
    const vacio = o.valor === '' || o.valor == null;
    texto.textContent = vacio ? o.marcador : (o.oculto ? '●'.repeat(String(o.valor).length) : String(o.valor));
    texto.classList.toggle('vacio', vacio);
    caja.classList.toggle('activo', !!o.activo);
    caja.classList.toggle('con-error', !!o.error);
    caja.classList.toggle('con-ojo', !!o.conOjo);
    error.textContent = o.error || '';
    ojo.replaceChildren();
    if (o.conOjo) ojo.append(iconoMono(o.oculto ? 'ojo_mostrar' : 'ojo_ocultar', { tam: null, clase: 'cf-ojo-ico', color: 'var(--c-texto-secundario)' }));
    ojo.style.display = o.conOjo ? 'flex' : 'none';
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
