// TarjetaMenu (Componentes/TarjetaMenu.qml): tarjeta de acción del Menú principal.
// Aro de 117 en (84, 82), título y descripción anclados abajo-izquierda y flecha abajo-derecha.
import { h } from '../../core/dom.js';
import { pos, texto } from './menu_util.js';
import { mascara } from './menu_iconos.js';

/**
 * crearTarjetaMenu({x, y, ancho, alto=320, titulo, descripcion='', icono (nombre en iconos/mono o color),
 *   carpeta='mono', tamIcono=80, incluyeAro=false, colorAcento, colorTitulo, aroAcento=false, conBorde=false,
 *   tamTitulo=28.75, tamDescripcion=24, alPulsar}) -> {el}
 */
export function crearTarjetaMenu({ x, y, ancho, alto = 320, titulo, descripcion = '', icono, carpeta = 'mono', tamIcono = 80,
  incluyeAro = false, colorAcento = 'var(--c-texto-primario)', colorTitulo = 'var(--c-texto-primario)', aroAcento = false,
  conBorde = false, tamTitulo = 28.75, tamDescripcion = 24, alPulsar } = {}) {
  const el = pos(h('div', { class: 'mn-tarjeta-menu' }), x, y, ancho, alto);
  if (conBorde) el.style.boxShadow = `inset 0 0 0 4px ${colorAcento}`;
  const dAro = 117;
  const aro = pos(h('div', { class: 'mn-aro' }), 84 - dAro / 2, 82 - dAro / 2, dAro, dAro);
  const grosorAro = incluyeAro ? 0 : aroAcento ? 4 : 2;
  if (grosorAro) aro.style.boxShadow = `inset 0 0 0 ${grosorAro}px ${aroAcento ? colorAcento : 'var(--c-borde-divisor)'}`;
  const tam = incluyeAro ? dAro * 48 / 40 : tamIcono;
  const ruta = `assets/iconos/${carpeta}/${icono}.svg`;
  const ic = carpeta === 'mono'
    ? mascara(ruta, tam, colorAcento)
    : h('img', { src: ruta, alt: '', draggable: 'false', style: { width: `${tam}px`, height: `${tam}px` } });
  pos(ic, dAro / 2 - tam / 2 - (incluyeAro || aroAcento ? 0 : 0), dAro / 2 - tam / 2);
  aro.append(ic);
  el.append(aro);

  const lineasDesc = descripcion === '' ? 0 : descripcion.split('\n').length;
  const lineasTit = titulo.split('\n').length;
  const xT = 29, anchoT = ancho - xT - (30 + 15 + 16);
  const blDesc = lineasDesc === 0 ? alto - 32 : alto - 32 - 28 * (lineasDesc - 1);
  const blTit = (lineasDesc === 0 ? blDesc : blDesc - 41) - 33 * (lineasTit - 1);
  el.append(texto(titulo, { x: xT, w: anchoT, bl: blTit, tam: tamTitulo, peso: 700, color: colorTitulo, interlineado: 33, pre: true }));
  if (lineasDesc) el.append(texto(descripcion, { x: xT, w: anchoT, bl: blDesc, tam: tamDescripcion, peso: 400, interlineado: 28, pre: true,
    color: 'var(--c-texto-primario)' }));
  const k = 24 / (43.8 - 4.3);
  const fl = mascara('assets/iconos/mono/chevron_derecha.svg', 48 * k, 'var(--c-texto-negro)');
  pos(fl, ancho - 30 - 35.2 * k, alto - 62.5 - (4.3 + 43.8) / 2 * k);
  el.append(fl);
  if (alPulsar) el.addEventListener('click', alPulsar);
  return { el };
}
