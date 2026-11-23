// Ventana de ajuste de un parámetro (VentanaFlotante de Opciones): actual, por defecto, mínimo, máximo
// y el control de edición (teclado numérico, interruptor u opciones) con Guardar.
import { h } from '../../../core/dom.js';
import { t, num } from '../../../core/i18n.js';
import { abrirModal } from '../../../core/capas.js';
import { abrirNumerico } from '../../../core/teclado.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { crearFilaInterruptor } from '../../componentes/fila_interruptor.js';
import { crearDesplegable } from '../../componentes/desplegable.js';

/** Texto de un valor para mostrar: número con decimales, sí/no u opción. */
export function textoValor(v, { tipo = 'numero', decimales = 1, opciones } = {}) {
  if (v == null) return '—';
  if (tipo === 'bool') return t(v ? 'opciones.si' : 'opciones.no');
  if (tipo === 'enum') return opciones?.find((o) => o.valor === v)?.texto ?? String(v);
  if (typeof v !== 'number') return String(v);
  return num(v, Number.isInteger(v) && decimales === 0 ? 0 : decimales);
}

/**
 * abrirAjuste({titulo, descripcion, unidad, actual, defecto, min, max, decimales, tipo, opciones, editable,
 *              motivo, ultima, alGuardar(valor) -> null | clave i18n de error})
 */
export function abrirAjuste(o) {
  const { titulo, descripcion = '', unidad = '', actual, defecto, min, max, decimales = 1, tipo = 'numero', opciones = [], editable = true, motivo = '', ultima = '' } = o;
  let nuevo = actual;
  let cerrar;
  const error = h('div', { class: 'op-aj-error' });
  const fmt = (v) => textoValor(v, { tipo, decimales, opciones });
  const celda = (rotulo, v) => h('div', { class: 'op-aj-celda' }, h('div', { class: 'op-aj-rotulo', text: rotulo }),
    h('div', { class: 'op-aj-valor', text: v == null ? '—' : `${fmt(v)}${tipo === 'numero' && unidad ? ` ${unidad}` : ''}` }));

  const control = h('div', { class: 'op-aj-control' });
  let guardarBtn;
  function pintarControl() {
    control.replaceChildren();
    if (tipo === 'numero') {
      const campo = h('button', { class: `op-aj-campo${editable ? '' : ' inactivo'}`, type: 'button', onclick: () => editable && abrirNumerico({ titulo, valor: nuevo, unidad, min, max, decimales, campo,
        alConfirmar: (v) => { nuevo = v; pintarControl(); } }) },
        h('span', { class: 'op-aj-campo-rotulo', text: t('opciones.toque_nuevo_valor') }), h('span', { class: 'op-aj-campo-valor', text: `${fmt(nuevo)}${unidad ? ` ${unidad}` : ''}` }));
      control.append(campo, h('div', { class: 'op-nota', text: t('opciones.rango_permitido', { min: fmt(min), max: fmt(max), unidad }) }));
    } else if (tipo === 'bool') {
      control.append(crearFilaInterruptor({ etiqueta: titulo, marcado: !!nuevo, bloqueado: !editable, ultima: true, alAlternar: (v) => { nuevo = v; pintarBoton(); } }).el);
    } else {
      const dd = crearDesplegable({ opciones, valor: nuevo, tituloLista: titulo, habilitado: editable, alElegir: (v) => { nuevo = v; dd.actualizar({ valor: v }); pintarBoton(); } });
      control.append(dd.el);
    }
    pintarBoton();
  }
  function pintarBoton() {
    const valido = tipo !== 'numero' || (Number.isFinite(nuevo) && nuevo >= min && nuevo <= max);
    error.textContent = valido ? '' : t('opciones.err_valor_invalido');
    guardarBtn?.actualizar({ habilitado: editable && valido && nuevo !== actual });
  }
  function guardar() {
    const err = o.alGuardar?.(nuevo);
    if (err) { error.textContent = t(err); return; }
    cerrar();
  }
  guardarBtn = crearBotonFormulario({ texto: t('acciones.guardar'), primario: true, alPulsar: guardar });
  const porDefecto = crearBotonFormulario({ texto: t('opciones.por_defecto'), habilitado: editable && defecto != null, alPulsar: () => { nuevo = defecto; pintarControl(); } });
  const cancelar = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });

  pintarControl();
  // Dos columnas (datos | control) que en vertical se apilan y en horizontal van lado a lado (CSS).
  const tarjeta = h('div', { class: 'op-aj desplazable' },
    h('div', { class: 'op-aj-info' },
      h('div', { class: 'op-aj-titulo', text: titulo }),
      descripcion ? h('div', { class: 'op-aj-desc', text: descripcion }) : null,
      h('div', { class: 'op-aj-celdas' }, celda(t('opciones.actual'), actual), celda(t('opciones.por_defecto'), defecto),
        tipo === 'numero' ? celda(t('opciones.minimo'), min) : null, tipo === 'numero' ? celda(t('opciones.maximo'), max) : null)),
    h('div', { class: 'op-aj-edicion' },
      control, error,
      motivo ? h('div', { class: 'op-nota aviso', text: motivo }) : null,
      ultima ? h('div', { class: 'op-nota', text: ultima }) : null,
      h('div', { class: 'op-aj-botones' }, porDefecto.el, cancelar.el, guardarBtn.el)));
  cerrar = abrirModal(tarjeta, { cerrarAlTocarVelo: true });
  return cerrar;
}
