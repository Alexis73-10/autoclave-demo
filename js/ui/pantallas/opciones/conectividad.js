// Opciones › Conectividad (OpcionesConectividad.qml): red en solo lectura con valores ficticios y correo
// deshabilitado en la demo. No hay direcciones, servidores ni destinatarios reales.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { crearFilaInterruptor } from '../../componentes/fila_interruptor.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { L, filaKV } from './_comun.js';

export function crear(ctx) {
  const p = ctx.permiso();
  const motivo = !['admin', 'ingeniero'].includes(ctx.rol) ? t('conectividad.motivo_rol') : '';
  const noDisp = L({ es: 'No disponible en la demo', en: 'Not available in the demo' });
  const envio = crearFilaInterruptor({ etiqueta: t('conectividad.envio'), detalle: t('conectividad.envio_detalle'), marcado: false, bloqueado: true, ultima: true });
  const prueba = crearBotonFormulario({ texto: t('conectividad.prueba'), habilitado: false });
  void p;
  const el = h('div', { class: 'op-conn desplazable' },
    motivo ? h('div', { class: 'op-nota aviso', text: motivo }) : null,
    h('div', { class: 'op-bloque-titulo', text: t('conectividad.red') }),
    filaKV('Ethernet', L({ es: 'Conectado', en: 'Connected' })),
    filaKV(t('conectividad.wifi'), t('conectividad.sin_wifi')),
    h('div', { class: 'op-nota', text: t('conectividad.nota_soporte') }),
    h('div', { class: 'op-bloque-titulo', text: t('conectividad.correo') }),
    envio.el,
    filaKV(t('conectividad.remitente'), noDisp),
    filaKV(t('conectividad.servidor'), noDisp),
    filaKV(t('conectividad.contrasena'), t('conectividad.no_configurada')),
    filaKV(t('conectividad.destinatarios', { n: 0, max: 5 }), t('conectividad.sin_destinatarios')),
    h('div', { class: 'op-bloque-btn' }, prueba.el),
    h('div', { class: 'op-nota aviso', text: noDisp }));
  return { el };
}
