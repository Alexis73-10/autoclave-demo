// Opciones › Respaldo (OpcionesRespaldo.qml): exportar y restaurar a una USB SIMULADA.
// No se escribe ni se lee ningún archivo: la demo solo muestra el flujo y avisa que es simulado.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { casilla, chip, L, fechaHoraIso } from './_comun.js';

export function crear(ctx) {
  const puede = ctx.permiso().editar;
  const partes = { perfil: true, parametros: true, usuarios: true, historial: false };
  let elegido = 0;
  const ahora = Date.now();
  const respaldos = [
    { archivo: 'respaldo_demo_1.acb', serie: 'SN260000', ms: ahora - 6 * 86400000, valido: true },
    { archivo: 'respaldo_demo_2.acb', serie: 'SN260000', ms: ahora - 31 * 86400000, valido: true },
    { archivo: 'respaldo_otro.acb', serie: 'SN269999', ms: ahora - 40 * 86400000, valido: false },
  ];
  const lista = h('div', { class: 'op-resp-lista' });
  const msg = h('div', { class: 'op-nota aviso' });

  function pintarLista() {
    lista.replaceChildren(...respaldos.map((r, i) => h('button', { class: `op-resp-fila${i === elegido ? ' sel' : ''}`, type: 'button', onclick: () => { elegido = i; pintarLista(); } },
      h('span', { class: 'op-fila-textos' }, h('span', { class: 'op-fila-titulo', text: r.archivo }),
        h('span', { class: 'op-fila-sub', text: t('respaldo.detalle', { serie: r.serie, fecha: fechaHoraIso(r.ms) }) })),
      r.valido ? chip(t('respaldo.valido'), 'ok') : chip(`${t('respaldo.rechazado')}: ${t('respaldo.motivo_otra_serie')}`, 'aviso'))));
  }
  pintarLista();

  const exportar = crearBotonFormulario({ texto: t('respaldo.exportar'), primario: true, habilitado: puede, alPulsar: () => {
    if (!Object.values(partes).some(Boolean)) { msg.textContent = t('respaldo.err_sin_partes'); return; }
    msg.textContent = `${t('respaldo.exportado')} ${L({ es: '(simulado: no se escribe ningún archivo)', en: '(simulated: no file is written)' })}`;
    ctx.bitacora('respaldo_exportado', {});
  } });
  const restaurar = crearBotonFormulario({ texto: t('respaldo.restaurar'), habilitado: puede, alPulsar: () => {
    const r = respaldos[elegido];
    if (!r.valido) { msg.textContent = t('respaldo.err_otra_serie'); return; }
    abrirDialogoConfirmacion({ mensaje: t('respaldo.confirmar', { archivo: r.archivo }), alConfirmar: () => {
      msg.textContent = `${t('respaldo.restaurado')} ${L({ es: '(simulado: no se cambia nada)', en: '(simulated: nothing is changed)' })}`;
      ctx.bitacora('respaldo_restaurado', { entidad: r.archivo });
    } });
  } });

  const el = h('div', { class: 'op-resp desplazable' },
    h('div', { class: 'op-nota', text: t('respaldo.usb_detectada', { unidad: 'E:', libre: '14,2 GB' }) }),
    h('div', { class: 'op-bloque-titulo', text: t('respaldo.exportar_titulo') }),
    ...[['perfil', 'respaldo.parte_perfil_calibracion'], ['parametros', 'respaldo.parte_parametros_programas'],
      ['usuarios', 'respaldo.parte_usuarios'], ['historial', 'respaldo.parte_historial']].map(([k, c]) =>
      casilla({ texto: t(c), marcado: partes[k], deshabilitada: !puede, alCambiar: (v) => { partes[k] = v; } })),
    h('div', { class: 'op-bloque-btn' }, exportar.el),
    h('div', { class: 'op-bloque-titulo', text: t('respaldo.restaurar_titulo') }),
    lista,
    h('div', { class: 'op-nota', text: t('respaldo.nota') }),
    h('div', { class: 'op-bloque-btn' }, restaurar.el),
    msg);
  return { el };
}
