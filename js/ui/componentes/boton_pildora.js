// BotonPildora (Componentes/BotonPildora.qml): píldora de alto fijo y ancho según el texto (mínimo 220
// en el QML; aquí min(100%, 11rem)).
import { h } from '../../core/dom.js';

/** crearBotonPildora({texto, primario=false, habilitado=true, alPulsar}) -> {el, fijarTexto(t), habilitar(b)} */
export function crearBotonPildora({ texto = '', primario = false, habilitado = true, alPulsar } = {}) {
  const el = h('button', { class: `mn-pildora${primario ? ' primario' : ''}` });
  const poner = (t) => { el.textContent = t; };
  const habilitar = (b) => { el.classList.toggle('deshabilitado', !b); el.disabled = !b; };
  poner(texto);
  habilitar(habilitado);
  el.addEventListener('click', () => { if (!el.disabled) alPulsar?.(); });
  return { el, fijarTexto: poner, habilitar };
}
