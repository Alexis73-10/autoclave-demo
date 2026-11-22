// CampoFormulario.qml: etiqueta 22 Medium + recuadro 82 (radio 6) + error 20. Alto total 125.
// crearCampoFormulario({etiqueta, marcador, valor, activo, error, oculto, conOjo, alTocar, alOjo})
//   -> { el, actualizar(datos) }   (datos = cualquier subconjunto de las opciones)
import { h, iconoMono } from '../../core/dom.js';

export function crearCampoFormulario(op = {}) {
  const o = { etiqueta: '', marcador: '', valor: '', activo: false, error: '', oculto: false, conOjo: false, ...op };
  const etiqueta = h('div', { class: 'cf-etiqueta' });
  const texto = h('span', { class: 'cf-texto' });
  const ojo = h('button', { class: 'cf-ojo', type: 'button', onpointerup: (e) => { e.stopPropagation(); o.alOjo?.(); } });
  const caja = h('div', { class: 'cf-caja', onpointerup: () => o.alTocar?.() }, texto, ojo);
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
    if (o.conOjo) ojo.append(iconoMono(o.oculto ? 'ojo_mostrar' : 'ojo_ocultar', { tam: 44, color: 'var(--c-texto-secundario)' }));
    ojo.style.display = o.conOjo ? 'flex' : 'none';
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
