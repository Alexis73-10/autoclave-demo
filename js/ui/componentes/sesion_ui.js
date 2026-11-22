// Piezas comunes de Login y CambioClave (Pantallas/Login.qml y CambioClave.qml): marco con barra superior,
// tarjeta de contenido y barra inferior; campo de entrada de 88 con icono; botón principal de 625x88.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import * as router from '../../core/router.js';
import { crearFondoApp } from './fondo_app.js';
import { crearBarraSuperior } from './barra_superior.js';
import { crearTarjetaContenido } from './tarjeta_contenido.js';
import { crearBarraInferiorMenu } from './barra_inferior_menu.js';
import { pos } from './menu_util.js';
import { mascara } from './menu_iconos.js';

const ESCALA_BARRA = 1200 / 1196;

/**
 * crearMarcoSesion({alAtras, alInicio}) -> {el, tarjeta (contenido), destruir()}
 * Tarjeta en x 24, y 176, ancho 1152 y alto H-176-201; barra inferior debajo.
 */
export function crearMarcoSesion({ alAtras, alInicio } = {}) {
  const el = h('div', { class: 'ss-raiz' });
  const barra = crearBarraSuperior();
  const alto = 1920 - 176 - ESCALA_BARRA * 201;
  const tarjeta = crearTarjetaContenido({ x: 24, y: 176, ancho: 1152, alto });
  const inferior = crearBarraInferiorMenu({ x: 24, y: 1920 - 171 * ESCALA_BARRA, ancho: 1152, inicioActivo: true,
    alAtras: alAtras ?? (() => router.pop()), alInicio });
  el.append(crearFondoApp(), barra.el, tarjeta.el, inferior.el);
  return { el, tarjeta, destruir: () => barra.destruir() };
}

/** Bloque de identidad: título 36 Bold, avatar de 336 y subtítulo 26. */
export function bloqueIdentidad(titulo, subtitulo) {
  return h('div', { class: 'ss-ident' },
    h('div', { class: 'ss-titulo', text: titulo }),
    h('div', { class: 'ss-avatar' }, mascara('assets/iconos/color/usuario.svg', 168, 'var(--c-texto-guia)')),
    h('div', { class: 'ss-subtitulo', text: subtitulo }));
}

/**
 * campoEntrada({icono, colorIcono, marcador, secreto=false}) -> {el, fijar(texto), activar(bool)}
 * Campo de solo lectura de 88 de alto (se escribe con el teclado en pantalla). `secreto` agrega el ojo.
 */
export function campoEntrada({ icono, colorIcono, marcador, secreto = false, alTocar } = {}) {
  const ic = pos(mascara(`assets/iconos/color/${icono}.svg`, 24, colorIcono), 16, 32);
  const valor = h('div', { class: 'ss-valor' });
  const el = h('div', { class: 'ss-campo', onclick: () => alTocar?.() }, ic, valor);
  let texto = '';
  let visible = false;
  const pintar = () => {
    valor.classList.toggle('marcador', texto === '');
    valor.textContent = texto === '' ? marcador : (secreto && !visible ? '•'.repeat(texto.length) : texto);
  };
  if (secreto) {
    const ojo = pos(mascara('assets/iconos/color/ojo_mostrar.svg', 24, 'var(--c-texto-secundario)'), null, 32);
    ojo.style.right = '16px';
    const zona = h('div', { class: 'ss-ojo', onclick: (e) => {
      e.stopPropagation();
      visible = !visible;
      ojo.style.webkitMaskImage = ojo.style.maskImage = `url("assets/iconos/color/${visible ? 'ojo_ocultar' : 'ojo_mostrar'}.svg")`;
      pintar();
    } });
    el.append(zona, ojo);
    valor.style.right = '64px';
  }
  pintar();
  return { el, fijar(x) { texto = x; pintar(); }, activar(b) { el.classList.toggle('activo', b); } };
}

/** Botón principal de 625x88 (radio 6, accion-primario) con icono opcional y texto 26 SemiBold. */
export function botonPrincipal(textoBoton, alPulsar, icono = null) {
  const el = h('button', { class: 'ss-boton', onclick: () => alPulsar?.() });
  if (icono) el.append(mascara(`assets/iconos/mono/${icono}.svg`, 32, 'var(--c-texto-sobre-accion)'));
  el.append(h('span', { text: textoBoton }));
  return el;
}

export { t };
