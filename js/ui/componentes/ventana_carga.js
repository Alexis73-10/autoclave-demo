// VentanaCarga (Componentes/VentanaCarga.qml, RCB-09.2), simplificada: «Carga del
// ciclo» con el lote y los elementos leídos. Sin lector real: «Simular lectura»
// toma un código de demostración y «Escribir código» usa el teclado en pantalla.
// Se guarda en almacen (clave `carga`) y el botón Carga de Preciclo muestra el resumen.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { leer, guardar } from '../../core/almacen.js';
import * as teclado from '../../core/teclado.js';
import { abrirVentanaFlotante } from './ventana_flotante.js';
import { abrirModalConfirmacion } from './modal_confirmacion.js';
import { loc } from './_ciclo_util.js';

const CATALOGO_DEMO = [
  { codigo: 'INS-0101', nombre: { es: 'Set de instrumental básico', en: 'Basic instrument set' } },
  { codigo: 'INS-0204', nombre: { es: 'Pinza Kelly curva', en: 'Curved Kelly forceps' } },
  { codigo: 'TEX-0310', nombre: { es: 'Paquete de campos quirúrgicos', en: 'Surgical drape pack' } },
  { codigo: 'INS-0415', nombre: { es: 'Bandeja de curaciones', en: 'Dressing tray' } },
];

const vacia = () => ({ lote: '', elementos: [] });
export function cargaActual() { return leer('carga', vacia()); }

/** Resumen para el botón Carga: «Lote L · n elementos» o «Carga: sin registrar». */
export function resumenCarga() {
  const c = cargaActual();
  if (!c.lote && !c.elementos.length) return t('registro_carga.resumen_sin');
  return t('registro_carga.resumen', { lote: c.lote || t('registro_carga.sin_lote'), n: c.elementos.reduce((s, e) => s + e.cantidad, 0) });
}

/** abrirVentanaCarga({alCerrar}) -> { cerrar() } */
export function abrirVentanaCarga({ alCerrar = null } = {}) {
  let carga = cargaActual();
  const persistir = () => { guardar('carga', carga); pintar(); };
  const lote = h('div', { class: 'fc-vc-lote' });
  const tabla = h('div', { class: 'fc-vc-tabla desplazable' });
  const total = h('div', { class: 'fc-vc-total' });
  const leerCodigo = (codigo) => {
    codigo = String(codigo || '').trim().toUpperCase();
    if (!codigo) return;
    if (!carga.lote && !CATALOGO_DEMO.some((c) => c.codigo === codigo)) { carga.lote = codigo; persistir(); return; }
    if (!carga.lote) carga.lote = `L${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`;
    const e = carga.elementos.find((x) => x.codigo === codigo);
    if (e) e.cantidad += 1;
    else {
      const cat = CATALOGO_DEMO.find((c) => c.codigo === codigo);
      carga.elementos.push({ codigo, nombre: cat?.nombre || null, cantidad: 1 });
    }
    persistir();
  };
  let indice = 0;
  const simular = () => {
    if (!carga.lote) leerCodigo(`L${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 90) + 10)}`);
    else { leerCodigo(CATALOGO_DEMO[indice % CATALOGO_DEMO.length].codigo); indice++; }
  };
  function pintar() {
    lote.replaceChildren(h('span', { class: 'fc-vc-rot', text: t('registro_carga.lote') }),
      h('span', { class: 'fc-vc-val', text: carga.lote || t('registro_carga.sin_lote') }));
    if (!carga.elementos.length) tabla.replaceChildren(h('div', { class: 'fc-vc-vacia', text: t('registro_carga.lista_vacia') }));
    else tabla.replaceChildren(
      h('div', { class: 'fc-vc-fila cab' }, h('span', { text: t('registro_carga.col_cantidad') }),
        h('span', { text: t('registro_carga.col_elemento') }), h('span', { text: t('registro_carga.col_codigo') }), h('span')),
      ...carga.elementos.map((e) => h('div', { class: 'fc-vc-fila' },
        h('span', { class: 'cant', text: String(e.cantidad) }),
        h('span', { text: e.nombre ? loc(e.nombre) : t('registro_carga.sin_catalogo') }),
        h('span', { class: 'cod', text: e.codigo }),
        h('button', { class: 'fc-vc-menos', text: t('registro_carga.quitar_uno'), onclick: () => {
          e.cantidad -= 1; if (e.cantidad <= 0) carga.elementos = carga.elementos.filter((x) => x !== e); persistir();
        } }))));
    const unidades = carga.elementos.reduce((s, e) => s + e.cantidad, 0);
    total.textContent = t('registro_carga.total', { codigos: carga.elementos.length, unidades });
  }
  const boton = (texto, fn, clase = '') => h('button', { class: `fc-vc-boton ${clase}`, text: texto, onclick: fn });
  const v = abrirVentanaFlotante({
    titulo: t('registro_carga.ventana_titulo'), altoTarjeta: 1300, alCerrar,
    contenido: h('div', { class: 'fc-vc' },
      h('div', { class: 'fc-vc-paso', text: `${t('registro_carga.paso_lote')}  ·  ${t('registro_carga.paso_elementos')}` }),
      lote,
      h('div', { class: 'fc-vc-acciones' },
        boton(loc({ es: 'Simular lectura', en: 'Simulate scan' }), simular, 'primario'),
        boton(t('registro_carga.escribir'), () => (teclado.abrirAlfanumericoAccion || teclado.abrirAlfanumerico)({ titulo: t('registro_carga.escribir_titulo'), alEntregar: leerCodigo }))),
      tabla, total,
      h('div', { class: 'fc-vc-pie' },
        boton(t('registro_carga.vaciar'), () => abrirModalConfirmacion({ titulo: t('registro_carga.vaciar_titulo'),
          cuerpo: t('registro_carga.vaciar_texto'), textoAccion: t('registro_carga.vaciar'), colorAccion: 'var(--c-peligro-texto)',
          alAceptar: () => { carga = vacia(); persistir(); } })),
        boton(t('registro_carga.listo'), () => v.cerrar(), 'primario'))),
  });
  pintar();
  return { cerrar: v.cerrar };
}
