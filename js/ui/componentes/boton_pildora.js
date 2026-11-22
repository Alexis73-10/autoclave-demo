// BotonPildora (Componentes/BotonPildora.qml): píldora de 64 de alto, mínimo 220 de ancho.
import { h } from '../../core/dom.js';
import { medir } from './menu_iconos.js';

/** crearBotonPildora({texto, primario=false, habilitado=true, alPulsar}) -> {el, fijarTexto(t), habilitar(b)} */
export function crearBotonPildora({ texto = '', primario = false, habilitado = true, alPulsar } = {}) {
  const el = h('button', { class: `mn-pildora${primario ? ' primario' : ''}` });
  const poner = (t) => { el.textContent = t; el.style.width = `${Math.max(220, medir(t, 22, 600) + 56)}px`; };
  const habilitar = (b) => { el.classList.toggle('deshabilitado', !b); el.disabled = !b; };
  poner(texto);
  habilitar(habilitado);
  el.addEventListener('click', () => { if (!el.disabled) alPulsar?.(); });
  return { el, fijarTexto: poner, habilitar };
}
