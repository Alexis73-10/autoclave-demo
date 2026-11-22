// BotonFormulario.qml: alto 97, radio 8; primario (accionPrimario + texto blanco) o secundario.
// crearBotonFormulario({texto, primario=false, habilitado=true, icono (nombre de iconos/mono), ancho (px), alPulsar})
//   -> { el, actualizar(datos) }
import { h, iconoMono } from '../../core/dom.js';

export function crearBotonFormulario(op = {}) {
  const o = { texto: '', primario: false, habilitado: true, icono: '', ancho: null, ...op };
  const el = h('button', { class: 'bf', type: 'button',
    onclick: () => { if (o.habilitado) o.alPulsar?.(); } });

  function pintar() {
    el.replaceChildren();
    if (o.icono) el.append(iconoMono(o.icono, { tam: 48, color: o.primario ? 'var(--c-texto-sobre-accion)' : 'var(--c-texto-primario)' }));
    el.append(h('span', { class: 'bf-texto', text: o.texto }));
    el.classList.toggle('primario', !!o.primario);
    el.classList.toggle('inactivo', !o.habilitado);
    el.style.width = o.ancho ? `${o.ancho}px` : '';
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
