// Opciones › Bitácora de auditoría (OpcionesBitacora.qml, solo lectura): filtros Usuario, Tipo (categoría)
// y Desde–Hasta (calendario táctil), lista paginada. Datos de demostración + acciones de la sesión.
import { h } from '../../../core/dom.js';
import { t } from '../../../core/i18n.js';
import { crearDesplegable } from '../../componentes/desplegable.js';
import { abrirCalendario } from '../../componentes/calendario.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { listar, categoriaDe, frase, CATEGORIAS } from './_bitacora.js';
import { fechaHoraIso, fechaIso } from './_comun.js';

const POR_PAGINA = 9;

export function crear() {
  let todas = [];
  let usuario = '', categoria = '', desde = '', hasta = '', pagina = 0;
  let vivo = true;

  const lista = h('div', { class: 'op-bit-lista' });
  const error = h('div', { class: 'op-nota error' });
  const info = h('div', { class: 'op-bit-pag' });

  const ddUsuario = crearDesplegable({ rotulo: t('bitacora.usuario'), valor: '', tituloLista: t('bitacora.usuario'),
    opciones: [{ valor: '', texto: t('bitacora.todos') }], alElegir: (v) => { usuario = v; pagina = 0; ddUsuario.actualizar({ valor: v }); pintar(); } });
  const ddTipo = crearDesplegable({ rotulo: t('bitacora.tipo_rotulo'), valor: '', tituloLista: t('bitacora.tipo_rotulo'),
    opciones: [{ valor: '', texto: t('bitacora.todos') }, ...CATEGORIAS.map((c) => ({ valor: c, texto: t(`bitacora.categoria.${c}`) }))],
    alElegir: (v) => { categoria = v; pagina = 0; ddTipo.actualizar({ valor: v }); pintar(); } });

  function campoFecha(rotulo, titulo, obtener, fijar) {
    const valor = h('div', { class: 'op-bit-fecha-valor' });
    const caja = h('button', { class: 'op-bit-fecha', type: 'button', onclick: () => abrirCalendario({ titulo, valor: obtener(), alElegir: (f) => { fijar(f); pagina = 0; pintar(); } }) },
      h('span', { class: 'op-bit-fecha-rotulo', text: rotulo }), valor);
    return { el: caja, pintar() { valor.textContent = obtener() || '—'; } };
  }
  const cDesde = campoFecha(t('bitacora.desde'), t('calendario.titulo_desde'), () => desde, (f) => { desde = f; });
  const cHasta = campoFecha(t('bitacora.hasta'), t('calendario.titulo_hasta'), () => hasta, (f) => { hasta = f; });

  const anterior = crearBotonFormulario({ texto: `‹ ${t('bitacora.anterior')}`, alPulsar: () => { pagina--; pintar(); } });
  const siguiente = crearBotonFormulario({ texto: `${t('bitacora.siguiente')} ›`, alPulsar: () => { pagina++; pintar(); } });

  function filtradas() {
    return todas.filter((e) => (!usuario || e.usuario === usuario) && (!categoria || categoriaDe(e.evento) === categoria)
      && (!desde || fechaIso(e.ms) >= desde) && (!hasta || fechaIso(e.ms) <= hasta));
  }

  function pintar() {
    cDesde.pintar(); cHasta.pintar();
    const rangoMal = desde && hasta && desde > hasta;
    error.textContent = rangoMal ? t('bitacora.err_rango') : '';
    error.style.display = rangoMal ? '' : 'none';
    const f = rangoMal ? [] : filtradas();
    const paginas = Math.max(1, Math.ceil(f.length / POR_PAGINA));
    pagina = Math.min(Math.max(0, pagina), paginas - 1);
    lista.replaceChildren(...(f.length === 0 ? [h('div', { class: 'op-vacio', text: t('bitacora.vacia') })]
      : f.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA).map((e) => h('div', { class: 'op-bit-fila' },
        h('div', { class: 'op-bit-hora', text: fechaHoraIso(e.ms) }),
        h('div', { class: 'op-bit-texto' }, h('b', { text: e.usuario || 'sistema' }), ` ${frase(e)}`)))));
    info.textContent = t('bitacora.pagina', { n: pagina + 1, m: paginas });
    anterior.actualizar({ habilitado: pagina > 0 });
    siguiente.actualizar({ habilitado: pagina < paginas - 1 });
  }

  const el = h('div', { class: 'op-bit' },
    h('div', { class: 'op-bit-filtros' }, ddUsuario.el, ddTipo.el, cDesde.el, cHasta.el),
    error, lista,
    h('div', { class: 'op-bit-nav' }, anterior.el, info, siguiente.el));

  listar().then((l) => {
    if (!vivo) return;
    todas = l;
    const usuarios = [...new Set(l.map((e) => e.usuario).filter(Boolean))].sort();
    ddUsuario.actualizar({ opciones: [{ valor: '', texto: t('bitacora.todos') }, ...usuarios.map((u) => ({ valor: u, texto: u }))] });
    pintar();
  });
  pintar();
  return { el, destruir() { vivo = false; } };
}
