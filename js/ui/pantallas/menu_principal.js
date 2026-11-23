// Menú principal (Pantallas/MenuPrincipal.qml): 4 tarjetas de acción y 4 de resumen del sistema, con sus
// ventanas flotantes de Último ciclo, Mantenimiento, Ciclos hoy e Historial (leen js/sim/historial.js).
// Vertical: réplica del QML (tarjetas 2 + 2 y el resumen en una fila de 4). Horizontal: las 4 tarjetas en
// una fila y el resumen del sistema como panel lateral con filas compactas (solo CSS, sin recrear nodos).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import * as router from '../../core/router.js';
import { irAPrincipal, abrirConfiguracion } from '../../app.js';
import { crearFondoApp } from '../componentes/fondo_app.js';
import { crearEncabezadoMenu } from '../componentes/encabezado_menu.js';
import { crearBarraInferiorMenu } from '../componentes/barra_inferior_menu.js';
import { crearTarjetaMenu } from '../componentes/tarjeta_menu.js';
import { crearTarjetaResumen } from '../componentes/tarjeta_resumen.js';
import { abrirVentanaMenu } from '../componentes/ventana_menu.js';
import { crearListaCiclos } from '../componentes/lista_ciclos.js';
import { crearDetalleCiclo } from '../componentes/detalle_ciclo.js';
import { crearSelectorPeriodo } from '../componentes/selector_periodo.js';
import { crearBotonPildora } from '../componentes/boton_pildora.js';
import { ciclosTodos, ciclosTotales, filaDeRegistro, mantenimiento, sufijoFecha, numeroPrograma,
  textoResultado, colorResultado, avisoNoDisponible, verTirilla } from '../componentes/menu_util.js';
import { desplazar, esActual, rotuloHistorial, enRango, mismoDia, rango } from '../componentes/reporte_calculo.js';

let panelEquipo = null;
try { panelEquipo = await import('../componentes/panel_equipo.js'); } catch { panelEquipo = null; }

const fechaMant = (ms) => sufijoFecha(ms).fecha;
const SVG_CASA = '<svg viewBox="0 0 57 57" fill="none" stroke="var(--c-texto-sobre-accion)" stroke-width="3.3" '
  + 'stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,28 28.5,1.5 55.5,28"/>'
  + '<polyline points="9,20 9,55.5 22,55.5 22,37 35,37 35,55.5 48,55.5 48,20"/></svg>';

export function crear() {
  const enc = crearEncabezadoMenu();
  const limpiar = [];

  // Tarjetas de acción
  const casa = h('span', { class: 'mp-casa', html: SVG_CASA });
  const tituloMenu = h('div', { class: 'mp-titulo con-casa' }, casa, h('span', { text: t('menu.titulo') }));
  const tms = [
    crearTarjetaMenu({ titulo: t('acciones.iniciar_sesion'), descripcion: t('menu.iniciar_sesion_desc'),
      icono: 'usuario', colorAcento: 'var(--c-menu-verde)', colorTitulo: 'var(--c-menu-verde-texto)', aroAcento: true, conBorde: true,
      alPulsar: () => abrirConfiguracion() }),
    crearTarjetaMenu({ titulo: t('modulos.historial'), descripcion: t('menu.historial_desc'),
      icono: 'historial', carpeta: 'color', incluyeAro: true, alPulsar: () => abrirHistorial() }),
    crearTarjetaMenu({ titulo: t('modulos.reportes'), descripcion: t('menu.reportes_desc'),
      icono: 'reportes', colorAcento: 'var(--c-menu-naranja)', alPulsar: () => router.push('reportes') }),
    crearTarjetaMenu({ titulo: t('modulos.informacion'), descripcion: t('menu.informacion_desc'),
      icono: 'informacion', incluyeAro: true, colorAcento: 'var(--c-menu-azul)', aroAcento: true,
      alPulsar: () => { if (panelEquipo?.abrirPanelEquipo) panelEquipo.abrirPanelEquipo(); else avisoNoDisponible(); } })];
  limpiar.push(...tms.map((x) => x.destruir));
  const tarjetas = h('div', { class: 'mp-tarjetas' }, tms.map((x) => x.el));
  tarjetas.children[0].classList.add('mp-t-sesion');
  tarjetas.children[1].classList.add('mp-t-historial');

  // Resumen del sistema
  const mant = mantenimiento();
  const todos = ciclosTodos();
  const ultimo = todos[0] ?? null;
  const cHoy = todos.filter((c) => mismoDia(new Date(c.inicio), new Date()));
  const tCiclosTotales = crearTarjetaResumen({ icono: 'ciclos_totales', colorAcento: 'var(--c-menu-azul)',
    rotulo: t('menu.ciclos_totales'), valor: String(ciclosTotales() || '—'), subrotulo: t('menu.realizados'), interactiva: false });
  const tMant = crearTarjetaResumen({ icono: 'mantenimiento', colorAcento: 'var(--c-menu-naranja)',
    rotulo: t('menu.proximo_mantenimiento'), valor: mant.vencido ? t('menu.vencido') : (mant.vence ? fechaMant(mant.vence) : '—'),
    alPulsar: () => abrirMantenimiento() });
  const tHoy = crearTarjetaResumen({ icono: 'reloj', incluyeAro: true, colorAcento: 'var(--c-menu-morado)',
    rotulo: t('menu.ciclos_hoy'), valor: String(cHoy.length), subrotulo: t('menu.realizados'), alPulsar: () => abrirCiclosHoy() });
  const tUlt = crearTarjetaResumen({ icono: 'reproducir', incluyeAro: true, colorAcento: 'var(--c-menu-azul)',
    rotulo: t('menu.ultimo_ciclo'), alPulsar: () => abrirUltimoCiclo() });
  tUlt.el.classList.add('mp-ultimo');
  if (ultimo) {
    const f = sufijoFecha(ultimo.inicio);
    const lin = (rot, val, color) => h('span', { class: 'mp-ult-linea' }, h('span', { text: rot }), ' ', h('b', { text: val, style: { color } }));
    tUlt.contenido.append(
      h('span', { class: 'mp-ult-fecha', text: `${f.fecha}  ${f.hora}` }),
      lin(t('menu.programa'), numeroPrograma(ultimo.numeroPrograma), 'var(--c-menu-naranja-texto)'),
      lin(t('menu.resultado'), textoResultado(ultimo.resultado), colorResultado(ultimo.resultado)));
  } else {
    tUlt.contenido.append(h('span', { class: 'mp-ult-vacio', text: '—' }));
  }
  const resumenes = [tCiclosTotales, tMant, tHoy, tUlt];
  limpiar.push(...resumenes.map((r) => r.destruir));
  const resumen = h('div', { class: 'mp-resumen' }, resumenes.map((r) => r.el));

  const barra = crearBarraInferiorMenu({ inicioActivo: true, alAtras: () => router.pop(), alInicio: () => irAPrincipal() });
  const el = h('div', { class: 'mp-raiz' }, crearFondoApp(), enc.el,
    h('div', { class: 'mp-cuerpo desplazable' },
      h('section', { class: 'mp-zona mp-zona-menu' }, tituloMenu, tarjetas),
      h('section', { class: 'mp-zona mp-zona-resumen' }, h('div', { class: 'mp-titulo', text: t('menu.resumen') }), resumen)),
    h('div', { class: 'mn-pie' }, barra.el));

  // ── ventanas ──────────────────────────────────────────────────────────
  /** Vista de detalle con «Volver» dentro de una ventana (las gráficas se limpian al cerrar). */
  function vistaDetalle(registro, alVolver) {
    const d = crearDetalleCiclo({ registro, alVerTirilla: verTirilla });
    const nodo = h('div', { class: 'mn-vista mn-vista-detalle desplazable' }, alVolver ? volver(alVolver) : null, d.el);
    nodo._destruir = d.destruir;
    return nodo;
  }

  function abrirUltimoCiclo() {
    const r = ciclosTodos()[0];
    let vista = null;
    abrirVentanaMenu({ titulo: t('menu.ventana_ultimo_ciclo'), altoTarjeta: 1500, alCerrar: () => vista?._destruir?.(),
      contenido: () => {
        if (!r) return h('div', { class: 'mn-vacio', text: t('menu.sin_ciclos') });
        vista = vistaDetalle(r, null);
        return vista;
      } });
  }

  function abrirMantenimiento() {
    const m = mantenimiento();
    abrirVentanaMenu({ titulo: t('menu.ventana_mantenimiento'), altoTarjeta: 520, contenido: () => {
      const campo = (rot, val, color) => h('div', { class: 'mn-campo' }, h('div', { class: 'mn-campo-rot', text: rot }),
        h('div', { class: 'mn-campo-val', text: val, style: color ? { color } : {} }));
      return h('div', { class: 'mn-col-campos desplazable' },
        campo(t('menu.proximo_vencimiento'), m.vencido ? t('menu.vencido') : (m.vence ? fechaMant(m.vence) : '—'), m.vencido ? 'var(--c-peligro-texto)' : null),
        campo(t('menu.ultimo_mantenimiento'), fechaMant(m.ultimoFecha)),
        campo(t('menu.ciclos_restantes'), m.restantes != null ? String(m.restantes) : '—'));
    } });
  }

  function abrirCiclosHoy() {
    let detalle = null;
    abrirVentanaMenu({ titulo: t('menu.ventana_ciclos_hoy'), altoTarjeta: 1500, alCerrar: () => detalle?._destruir?.(),
      contenido: (zona) => {
        const lista = crearListaCiclos({ seleccionable: true, alElegir: (f) => mostrar(f) });
        const filas = ciclosTodos().filter((c) => mismoDia(new Date(c.inicio), new Date())).map(filaDeRegistro);
        lista.fijar(filas);
        lista.vacia(filas.length ? '' : t('menu.sin_ciclos'));
        const vistaLista = h('div', { class: 'mn-vista' }, lista.el);
        function mostrar(f) {
          vistaLista.classList.add('oculto');
          detalle = vistaDetalle(f.registro, () => { detalle._destruir?.(); detalle.remove(); detalle = null; vistaLista.classList.remove('oculto'); });
          zona.append(detalle);
        }
        return vistaLista;
      } });
  }

  function volver(alPulsar) {
    const b = crearBotonPildora({ texto: `‹  ${t('menu.volver')}`, alPulsar });
    b.el.classList.add('mn-volver');
    return b.el;
  }

  function abrirHistorial() {
    let periodo = 'dia';
    let fecha = new Date();
    let detalle = null;
    abrirVentanaMenu({ titulo: t('menu.ventana_historial'), altoTarjeta: 1500, alCerrar: () => detalle?._destruir?.(),
      contenido: (zona) => {
        const sel = crearSelectorPeriodo({ periodo, rotulo: '', esActual: true,
          alElegir: (p) => { periodo = p; fecha = new Date(); pintar(); },
          alMover: (n) => { fecha = desplazar(periodo, fecha, n); pintar(); } });
        const lista = crearListaCiclos({ seleccionable: true, marcable: true, alElegir: (f) => mostrar(f), alMarcar: () => pintarAcciones() });
        const cuenta = h('div', { class: 'mn-cuenta' });
        const bEnviar = crearBotonPildora({ texto: t('menu.enviar_correo'), alPulsar: avisoNoDisponible });
        const bImprimir = crearBotonPildora({ texto: t('menu.imprimir'), primario: true, alPulsar: avisoNoDisponible });
        const acciones = h('div', { class: 'mn-acciones' }, cuenta, h('div', { class: 'mn-acciones-botones' }, bEnviar.el, bImprimir.el));
        const vistaLista = h('div', { class: 'mn-vista mn-vista-historial' }, sel.el, lista.el, acciones);
        function pintarAcciones() {
          const n = lista.marcados().size;
          cuenta.textContent = n > 0 ? `${n} ${t('menu.seleccionados')}` : '';
          bEnviar.habilitar(n > 0); bImprimir.habilitar(n > 0);
        }
        function pintar() {
          const r = rango(periodo, fecha);
          sel.actualizar({ periodo, rotulo: rotuloHistorial(periodo, r.desde, r.hasta), esActual: esActual(periodo, fecha) });
          const filas = enRango(ciclosTodos(), r.desde, r.hasta).map(filaDeRegistro);
          lista.fijar(filas);
          lista.vacia(filas.length ? '' : t('menu.sin_ciclos'));
          pintarAcciones();
        }
        function mostrar(f) {
          vistaLista.classList.add('oculto');
          detalle = vistaDetalle(f.registro, () => { detalle._destruir?.(); detalle.remove(); detalle = null; vistaLista.classList.remove('oculto'); });
          zona.append(detalle);
        }
        pintar();
        return vistaLista;
      } });
  }

  return { el, destruir() { enc.destruir(); limpiar.forEach((q) => q?.()); } };
}
