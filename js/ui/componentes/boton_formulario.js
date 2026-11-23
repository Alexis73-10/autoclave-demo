// BotonFormulario.qml: primario (accionPrimario + texto blanco) o secundario; alto mínimo de toque, en rem.
// `ancho` (px de diseño) se conserva por compatibilidad: solo limita el ancho máximo.
// crearBotonFormulario({texto, primario=false, habilitado=true, icono (nombre de iconos/mono), ancho (px), alPulsar})
//   -> { el, actualizar(datos) }
import { h, iconoMono } from '../../core/dom.js';

export function crearBotonFormulario(op = {}) {
  const o = { texto: '', primario: false, habilitado: true, icono: '', ancho: null, ...op };
  const el = h('button', { class: 'bf', type: 'button',
    onclick: () => { if (o.habilitado) o.alPulsar?.(); } });

  function pintar() {
    el.replaceChildren();
    if (o.icono) el.append(iconoMono(o.icono, { tam: null, clase: 'bf-ico', color: o.primario ? 'var(--c-texto-sobre-accion)' : 'var(--c-texto-primario)' }));
    el.append(h('span', { class: 'bf-texto', text: o.texto }));
    el.classList.toggle('primario', !!o.primario);
    el.classList.toggle('inactivo', !o.habilitado);
    el.style.maxWidth = o.ancho ? `${(o.ancho / 30).toFixed(2)}rem` : '';
  }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); } };
}
