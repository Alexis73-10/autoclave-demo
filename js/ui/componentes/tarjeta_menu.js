// TarjetaMenu (Componentes/TarjetaMenu.qml): tarjeta de acción del Menú principal. Aro con el icono
// arriba a la izquierda, título y descripción abajo a la izquierda y flecha abajo a la derecha.
import { h } from '../../core/dom.js';
import { mascara, encajar } from './menu_iconos.js';

/**
 * crearTarjetaMenu({titulo, descripcion='', icono (nombre en iconos/mono o color), carpeta='mono',
 *   incluyeAro=false, colorAcento, colorTitulo, aroAcento=false, conBorde=false, alPulsar}) -> {el, destruir()}
 * (x, y, ancho, alto, tamIcono, tamTitulo, tamDescripcion se aceptan y se ignoran: el tamaño lo da el CSS.)
 */
export function crearTarjetaMenu({ titulo = '', descripcion = '', icono, carpeta = 'mono', incluyeAro = false,
  colorAcento = 'var(--c-texto-primario)', colorTitulo = 'var(--c-texto-primario)', aroAcento = false,
  conBorde = false, alPulsar } = {}) {
  const el = h('button', { class: `mn-tarjeta-menu${conBorde ? ' con-borde' : ''}` });
  el.style.setProperty('--acento', colorAcento);
  const aro = h('span', { class: `mn-tm-aro${incluyeAro ? ' incluido' : aroAcento ? ' acento' : ''}` });
  const ruta = `assets/iconos/${carpeta}/${icono}.svg`;
  aro.append(carpeta === 'mono'
    ? mascara(ruta, null, colorAcento, 'mn-tm-ico')
    : h('img', { class: 'mn-tm-ico', src: ruta, alt: '', draggable: 'false' }));
  const elTitulo = h('span', { class: 'mn-tm-titulo', text: titulo, style: { color: colorTitulo } });
  const textos = h('span', { class: 'mn-tm-textos' }, elTitulo,
    descripcion ? h('span', { class: 'mn-tm-desc', text: descripcion }) : null);
  const flecha = mascara('assets/iconos/mono/chevron_derecha.svg', null, 'var(--c-texto-negro)', 'mn-tm-flecha');
  el.append(aro, textos, flecha);
  if (alPulsar) el.addEventListener('click', alPulsar);
  const quitar = encajar(elTitulo);
  return { el, destruir: quitar };
}
