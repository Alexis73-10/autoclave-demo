// Piezas comunes de Login y CambioClave (Pantallas/Login.qml y CambioClave.qml): marco con barra superior,
// tarjeta de contenido y barra inferior; campo de entrada con icono; botón principal.
// Vertical: identidad (título, avatar, subtítulo) arriba y formulario debajo. Horizontal: identidad a la
// izquierda y formulario a la derecha (solo CSS: html[data-orient="h"] .ss-grilla).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import * as router from '../../core/router.js';
import { crearFondoApp } from './fondo_app.js';
import { crearBarraSuperior } from './barra_superior.js';
import { crearTarjetaContenido } from './tarjeta_contenido.js';
import { crearBarraInferiorMenu } from './barra_inferior_menu.js';
import { mascara } from './menu_iconos.js';

/**
 * crearMarcoSesion({alAtras, alInicio}) -> {el, tarjeta, desplazable, destruir()}
 * `tarjeta.contenido` es la zona de la tarjeta; `desplazable` es el panel que se desplaza dentro.
 */
export function crearMarcoSesion({ alAtras, alInicio } = {}) {
  const barra = crearBarraSuperior();
  const tarjeta = crearTarjetaContenido();
  const desplazable = h('div', { class: 'ss-desplazable desplazable' });
  tarjeta.contenido.append(desplazable);
  const inferior = crearBarraInferiorMenu({ inicioActivo: true, alAtras: alAtras ?? (() => router.pop()), alInicio });
  const el = h('div', { class: 'ss-raiz' }, crearFondoApp(), barra.el,
    h('div', { class: 'ss-cuerpo' }, tarjeta.el, h('div', { class: 'mn-pie' }, inferior.el)));
  // Compatibilidad: quien agrega a tarjeta.contenido lo agrega al panel desplazable.
  const api = { ...tarjeta, contenido: desplazable };
  return { el, tarjeta: api, desplazable, destruir: () => barra.destruir() };
}

/** Bloque de identidad: título, avatar circular y subtítulo. */
export function bloqueIdentidad(titulo, subtitulo) {
  return h('div', { class: 'ss-ident' },
    h('div', { class: 'ss-titulo', text: titulo }),
    h('div', { class: 'ss-avatar' }, mascara('assets/iconos/color/usuario.svg', null, 'var(--c-texto-guia)', 'ss-avatar-ico')),
    h('div', { class: 'ss-subtitulo', text: subtitulo }));
}

/**
 * campoEntrada({icono, colorIcono, marcador, secreto=false, alTocar}) -> {el, fijar(texto), activar(bool)}
 * Campo de solo lectura (se escribe con el teclado en pantalla). `secreto` agrega el ojo.
 */
export function campoEntrada({ icono, colorIcono, marcador, secreto = false, alTocar } = {}) {
  const ic = mascara(`assets/iconos/color/${icono}.svg`, null, colorIcono, 'ss-campo-ico');
  const valor = h('span', { class: 'ss-valor', 'data-recorte-permitido': 'texto largo: se ve el final, como el TextField del QML' });
  const el = h('div', { class: 'ss-campo', role: 'button', 'aria-label': marcador, onclick: () => alTocar?.(el) }, ic, valor);
  let texto = '';
  let visible = false;
  const pintar = () => {
    valor.classList.toggle('marcador', texto === '');
    valor.textContent = texto === '' ? marcador : (secreto && !visible ? '•'.repeat(texto.length) : texto);
  };
  if (secreto) {
    const ojo = mascara('assets/iconos/color/ojo_mostrar.svg', null, 'var(--c-texto-secundario)', 'ss-ojo-ico');
    const zona = h('button', { class: 'ss-ojo', 'aria-label': 'Mostrar', onclick: (e) => {
      e.stopPropagation();
      visible = !visible;
      ojo.style.webkitMaskImage = ojo.style.maskImage = `url("assets/iconos/color/${visible ? 'ojo_ocultar' : 'ojo_mostrar'}.svg")`;
      pintar();
    } }, ojo);
    el.append(zona);
  }
  pintar();
  return { el, fijar(x) { texto = x; pintar(); }, activar(b) { el.classList.toggle('activo', b); } };
}

/** Botón principal (radio 6, accion-primario) con icono opcional y texto en seminegrita. */
export function botonPrincipal(textoBoton, alPulsar, icono = null) {
  const el = h('button', { class: 'ss-boton', onclick: () => alPulsar?.() });
  if (icono) el.append(mascara(`assets/iconos/mono/${icono}.svg`, null, 'var(--c-texto-sobre-accion)', 'ss-boton-ico'));
  el.append(h('span', { text: textoBoton }));
  return el;
}

export { t };
