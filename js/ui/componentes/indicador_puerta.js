// IndicadorPuerta (Componentes/IndicadorPuerta.qml): estado de una puerta sin
// actuador, sin acción. Caja 298x110 radio 14: cerrada (azul puertaCerrada*),
// abierta (ámbar advertencia*) o sin datos (gris, «PUERTA —»); icono de puerta de
// 42 de alto centrado en x 65 y texto 22 Bold desde x 131 (en dos líneas si no cabe).
// Composición adaptable: fila flex que llena la caja que le da su contenedor.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { iconoPuerta } from './_ciclo_util.js';

/** crearIndicadorPuerta({ancho = 298, alto = 110, numero = 1}) -> { el, actualizar(estadoPuerta, datosVigentes) } */
export function crearIndicadorPuerta({ numero = 1 } = {}) {
  const icono = h('span', { class: 'fc-ip-icono' });
  const texto = h('span', { class: 'fc-ip-texto' });
  const el = h('div', { class: 'fc-indicador-puerta' }, icono, texto);
  let previo = '';
  return {
    el,
    actualizar(estadoPuerta, datosVigentes = true) {
      const sinDatos = !datosVigentes || !estadoPuerta;
      const cerrada = !sinDatos && /^CERRAD/.test(estadoPuerta);
      const modo = sinDatos ? 'sin_datos' : (cerrada ? 'cerrada' : 'abierta');
      if (modo === previo) return;
      previo = modo;
      el.dataset.modo = modo;
      texto.textContent = modo === 'cerrada' ? t('ciclo.puerta_cerrada_estado')
        : modo === 'abierta' ? t('ciclo.puerta_abierta_estado') : t('ciclo.puerta_sin_datos_estado');
      icono.replaceChildren(modo === 'sin_datos' ? '' : iconoPuerta(numero, cerrada, '1em', 'currentColor'));
      icono.classList.toggle('oculto', modo === 'sin_datos');
    },
  };
}
