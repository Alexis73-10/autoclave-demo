// VentanaDetalleAlarma (Componentes/VentanaDetalleAlarma.qml): detalle de una
// alarma, alerta o fallo. Tarjeta min(W-80, 1000), radio 24: «Detalle de la alarma»
// (24 SemiBold gris) y divisor; barra de color del nivel + nombre 30 Bold; campos
// Nivel, Código, Hora de activación, Descripción, Causa o acción y Estado
// (rótulo 20 guía, valor 24); botón Cerrar azul (mín. 300 x 88).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { abrirModal } from '../../core/capas.js';
import { horaLarga, colorNivel, textosAlarma } from './_ciclo_util.js';

const NIVEL_CLAVE = { alta: 'alarma_detalle.nivel_emergencia', media: 'alarma_detalle.nivel_alarma', baja: 'alarma_detalle.nivel_aviso' };

/**
 * abrirDetalleAlarma(alarma, {obtener}) -> { el, cerrar() }
 * alarma: fila de sim.estado.alarmas ({id, codigo, codigoVisible, nivel, titulo,
 *   descripcion, accion?, aparecida, reconocida}) o una fila sintética armada igual
 *   (NO ABRIR, modo prueba...). `obtener(estado)` (opcional) devuelve la fila vigente
 *   en cada tick, o null si ya no está activa («Ya no está activa»).
 */
export function abrirDetalleAlarma(alarma, { obtener = null } = {}) {
  let datos = alarma || {};
  let vigente = true;
  const barra = h('span', { class: 'fc-da-barra' });
  const nombre = h('div', { class: 'fc-da-nombre' });
  const campos = {};
  const campo = (clave, rotulo) => {
    const v = h('div', { class: 'fc-da-valor' });
    campos[clave] = v;
    return h('div', { class: 'fc-da-campo' }, h('div', { class: 'fc-da-rotulo', text: t(rotulo) }), v);
  };
  const cont = h('div', { class: 'fc-da-contenido desplazable' },
    h('div', { class: 'fc-da-fila-nombre' }, barra, nombre),
    campo('nivel', 'alarma_detalle.nivel'), campo('codigo', 'alarma_detalle.codigo'),
    campo('hora', 'alarma_detalle.hora'), campo('descripcion', 'alarma_detalle.descripcion'),
    campo('accion', 'alarma_detalle.accion'), campo('estado', 'alarma_detalle.estado'));
  const bCerrar = h('button', { class: 'fc-da-boton', text: t('alarma_detalle.cerrar') });
  const tarjeta = h('div', { class: 'fc-da-tarjeta fc-entrada' },
    h('div', { class: 'fc-da-cabecera' }, h('div', { class: 'fc-da-titulo', text: t('alarma_detalle.titulo') })),
    cont, h('div', { class: 'fc-da-botones' }, bCerrar));
  tarjeta.addEventListener('pointerdown', (e) => e.stopPropagation());

  const sin = t('alarma_detalle.sin_dato');
  function pintar() {
    const tx = textosAlarma(datos);
    barra.style.background = colorNivel(datos.nivel);
    nombre.textContent = datos.nombre || tx.titulo || datos.id || '';
    const val = (k, v) => { campos[k].textContent = v ? v : sin; };
    val('nivel', datos.nivel ? t(NIVEL_CLAVE[datos.nivel] || NIVEL_CLAVE.alta) : '');
    val('codigo', datos.codigoVisible || datos.codigo || '');
    val('hora', horaLarga(datos.aparecida));
    val('descripcion', tx.descripcion);
    val('accion', tx.accion);
    val('estado', !vigente ? t('alarma_detalle.estado_retirada')
      : datos.reconocida ? t('alarma_detalle.estado_reconocida') : t('alarma_detalle.estado_activa'));
  }
  pintar();
  const quitar = obtener ? on('sim', (e) => {
    const d = obtener(e);
    if (d) { datos = d; vigente = true; } else vigente = false;
    pintar();
  }) : null;
  const cerrar = abrirModal(tarjeta, { cerrarAlTocarVelo: true, alCerrar: () => quitar?.() });
  bCerrar.addEventListener('click', () => cerrar());
  return { el: tarjeta, cerrar };
}
