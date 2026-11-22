// Opciones › Catálogo de carga (OpcionesCatalogoCarga.qml): lista de ejemplo con búsqueda y alta con teclado.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { leer, guardar } from '../../../core/almacen.js';
import { abrirAlfanumerico, abrirAlfanumericoAccion } from '../../../core/teclado.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { crearCampoFormulario } from '../../componentes/campo_formulario.js';
import { abrirModal } from '../../../core/capas.js';
import { chip } from './_comun.js';

const BASE = [
  ['PINZA-001', 'Pinza Kelly recta 14 cm'], ['PINZA-002', 'Pinza Kocher curva 16 cm'], ['TIJ-010', 'Tijera Mayo recta 17 cm'],
  ['TIJ-011', 'Tijera Metzenbaum curva 18 cm'], ['BIS-003', 'Mango de bisturí N.º 3'], ['SEP-020', 'Separador Farabeuf'],
  ['PORTA-005', 'Portaagujas Mayo-Hegar 18 cm'], ['ESP-030', 'Espéculo vaginal mediano'], ['CAJA-100', 'Caja de curaciones'],
  ['COMP-200', 'Compresas de gasa x 10'], ['BAJA-999', 'Pinza de disección (retirada)'],
].map(([codigo, nombre], i) => ({ codigo, nombre, activo: codigo !== 'BAJA-999', cantidad: (i * 7) % 23 }));

export function crear(ctx) {
  const puede = ctx.permiso().editar;
  let items = leer('op_catalogo', null) ?? BASE;
  let filtro = '';
  const resumen = h('div', { class: 'op-nota' });
  const cuerpo = h('div', { class: 'op-cat-cuerpo' });
  const buscar = crearCampoFormulario({ etiqueta: t('registro_carga.catalogo_buscar'), marcador: t('registro_carga.catalogo_buscar_titulo'), valor: '',
    alTocar: () => abrirAlfanumerico({ titulo: t('registro_carga.catalogo_buscar_titulo'), valor: filtro, alEntregar: (v) => { filtro = v; buscar.actualizar({ valor: v }); pintar(); } }) });

  function guardarItems() { guardar('op_catalogo', items); pintar(); }
  function pintar() {
    const f = filtro.trim().toLowerCase();
    const vis = items.filter((i) => !f || i.codigo.toLowerCase().includes(f) || i.nombre.toLowerCase().includes(f));
    const activos = items.filter((i) => i.activo).length;
    resumen.textContent = t('registro_carga.catalogo_resumen', { total: items.length, activos, baja: items.length - activos });
    cuerpo.replaceChildren(
      h('div', { class: 'op-cat-fila cab' }, h('span', { text: t('registro_carga.col_codigo') }), h('span', { text: t('registro_carga.col_nombre') }),
        h('span', { text: t('registro_carga.col_estado') }), h('span', { text: t('registro_carga.col_cantidad') })),
      ...(vis.length === 0 ? [h('div', { class: 'op-vacio', text: items.length ? t('registro_carga.catalogo_sin_coincidencias') : t('registro_carga.catalogo_vacio') })]
        : vis.map((i) => h('button', { class: 'op-cat-fila', type: 'button', onclick: () => puede && editar(i) },
          h('span', { class: 'op-cat-cod', text: i.codigo }), h('span', { text: i.nombre }),
          h('span', {}, chip(t(i.activo ? 'registro_carga.estado_activo' : 'registro_carga.estado_baja'), i.activo ? 'ok' : 'mal')),
          h('span', { class: 'op-cat-cant', text: String(i.cantidad) })))));
  }

  function editar(item) {
    let cerrar;
    const accion = (texto, fn, primario) => crearBotonFormulario({ texto, primario, alPulsar: () => { cerrar(); fn(); } }).el;
    const caja = h('div', { class: 'op-modal' }, h('div', { class: 'op-modal-titulo', text: item.codigo }), h('div', { class: 'op-modal-texto', text: item.nombre }),
      h('div', { class: 'op-modal-botones' },
        accion(t('registro_carga.editar'), () => abrirAlfanumericoAccion({ titulo: item.codigo, valor: item.nombre, alEntregar: (v) => { if (v.trim()) { item.nombre = v.trim().slice(0, 60); guardarItems(); ctx.bitacora('catalogo_carga', { entidad: item.codigo }); } } })),
        accion(item.activo ? t('registro_carga.baja') : t('registro_carga.reactivar'), () => { item.activo = !item.activo; guardarItems(); ctx.bitacora('catalogo_carga', { entidad: item.codigo }); }, true),
        accion(t('acciones.cancelar'), () => {})));
    cerrar = abrirModal(caja, { cerrarAlTocarVelo: true });
  }

  function alta() {
    let codigo = '', nombre = '', cerrar;
    const cCod = crearCampoFormulario({ etiqueta: t('registro_carga.col_codigo'), marcador: t('registro_carga.col_codigo'), alTocar: () => abrirAlfanumerico({ titulo: t('registro_carga.col_codigo'), valor: codigo, maxLargo: 64, alEntregar: (v) => { codigo = v.replace(/[|]/g, '').trim(); cCod.actualizar({ valor: codigo, error: '' }); } }) });
    const cNom = crearCampoFormulario({ etiqueta: t('registro_carga.col_nombre'), marcador: t('registro_carga.col_nombre'), alTocar: () => abrirAlfanumerico({ titulo: t('registro_carga.col_nombre'), valor: nombre, maxLargo: 60, alEntregar: (v) => { nombre = v.trim(); cNom.actualizar({ valor: nombre, error: '' }); } }) });
    const ok = crearBotonFormulario({ texto: t('acciones.guardar'), primario: true, alPulsar: () => {
      if (!codigo) { cCod.actualizar({ error: t('validacion.obligatorio') }); return; }
      if (!nombre) { cNom.actualizar({ error: t('validacion.obligatorio') }); return; }
      if (items.some((i) => i.codigo === codigo)) { cCod.actualizar({ error: t('manejo_ciclos.err_nombre_repetido') }); return; }
      items = [...items, { codigo, nombre, activo: true, cantidad: 0 }]; cerrar(); guardarItems(); ctx.bitacora('catalogo_carga', { entidad: codigo });
    } });
    const cancelar = crearBotonFormulario({ texto: t('acciones.cancelar'), alPulsar: () => cerrar() });
    cerrar = abrirModal(h('div', { class: 'op-modal ancho' }, h('div', { class: 'op-modal-titulo', text: t('registro_carga.alta_titulo') }),
      cCod.el, h('div', { style: { height: '20px' } }), cNom.el, h('div', { class: 'op-modal-botones' }, cancelar.el, ok.el)), { cerrarAlTocarVelo: true });
  }

  const nuevo = crearBotonFormulario({ texto: `+ ${t('registro_carga.alta')}`, primario: true, habilitado: puede, alPulsar: alta });
  const el = h('div', { class: 'op-cat' }, h('div', { class: 'op-nota', text: t('registro_carga.catalogo_desc') }), resumen, buscar.el,
    h('div', { class: 'op-cat-lista desplazable' }, cuerpo), h('div', { class: 'op-bloque-btn' }, nuevo.el));
  pintar();
  return { el };
}
