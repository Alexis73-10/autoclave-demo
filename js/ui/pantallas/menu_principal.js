// Menú principal (Pantallas/MenuPrincipal.qml): 4 tarjetas de acción y 4 de resumen del sistema, con sus
// ventanas flotantes de Último ciclo, Mantenimiento, Ciclos hoy e Historial (leen js/sim/historial.js).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import { haySesion } from '../../core/sesion.js';
import * as router from '../../core/router.js';
import { sim } from '../../sim/motor.js';
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
import { pos, texto, ciclosTodos, ciclosTotales, filaDeRegistro, mantenimiento, sufijoFecha, numeroPrograma,
  textoResultado, colorResultado, dos, avisoNoDisponible, verTirilla } from '../componentes/menu_util.js';
import { rango, desplazar, esActual, rotuloHistorial, enRango, inicioDia, mismoDia } from '../componentes/reporte_calculo.js';

let panelEquipo = null;
try { panelEquipo = await import('../componentes/panel_equipo.js'); } catch { panelEquipo = null; }

const fechaMant = (ms) => { const f = sufijoFecha(ms); return f.fecha; };

export function crear() {
  const el = h('div', { class: 'mp-raiz' });
  const enc = crearEncabezadoMenu();
  const quitar = [];
  el.append(crearFondoApp(), enc.el);

  // Icono de casa dibujado con trazos blancos y título
  const casa = pos(h('div', { class: 'mp-casa' }), 567, 262, 57, 57);
  casa.innerHTML = '<svg width="57" height="57" viewBox="0 0 57 57" fill="none" stroke="var(--c-texto-sobre-accion)" stroke-width="3.3" '
    + 'stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,28 28.5,1.5 55.5,28"/>'
    + '<polyline points="9,20 9,55.5 22,55.5 22,37 35,37 35,55.5 48,55.5 48,20"/></svg>';
  const titulo = (txt, cx, bl) => texto(txt, { cx, bl, tam: 39, peso: 600, color: 'var(--c-texto-sobre-accion)' });
  el.append(casa, titulo(t('menu.titulo'), 596.5, 390));

  // Tarjetas de acción
  const fila2 = { tamTitulo: 25, tamDescripcion: 21 };
  el.append(
    crearTarjetaMenu({ x: 54, y: 499, ancho: 716, titulo: t('acciones.iniciar_sesion'), descripcion: t('menu.iniciar_sesion_desc'),
      icono: 'usuario', tamIcono: 87, colorAcento: 'var(--c-menu-verde)', colorTitulo: 'var(--c-menu-verde-texto)', aroAcento: true, conBorde: true,
      alPulsar: () => abrirConfiguracion() }).el,
    crearTarjetaMenu({ x: 789, y: 499, ancho: 350, titulo: t('modulos.historial'), descripcion: t('menu.historial_desc'),
      icono: 'historial', carpeta: 'color', incluyeAro: true, alPulsar: () => abrirHistorial() }).el,
    crearTarjetaMenu({ x: 54, y: 843, ancho: 533, titulo: t('modulos.reportes'), descripcion: t('menu.reportes_desc'),
      icono: 'reportes', tamIcono: 85, colorAcento: 'var(--c-menu-naranja)', ...fila2, alPulsar: () => router.push('reportes') }).el,
    crearTarjetaMenu({ x: 606, y: 843, ancho: 533, titulo: t('modulos.informacion'), descripcion: t('menu.informacion_desc'),
      icono: 'informacion', incluyeAro: true, colorAcento: 'var(--c-menu-azul)', aroAcento: true, ...fila2,
      alPulsar: () => { if (panelEquipo?.abrirPanelEquipo) panelEquipo.abrirPanelEquipo(); else avisoNoDisponible(); } }).el,
  );

  // Resumen del sistema
  el.append(titulo(t('menu.resumen'), 598, 1244));
  const mant = mantenimiento();
  const ultimo = ciclosTodos()[0] ?? null;
  const hoy = new Date();
  const cHoy = ciclosTodos().filter((c) => mismoDia(new Date(c.inicio), hoy));
  const tCiclosTotales = crearTarjetaResumen({ x: 54, y: 1295, ancho: 230, icono: 'ciclos_totales', tamIcono: 79, colorAcento: 'var(--c-menu-azul)',
    rotulo: t('menu.ciclos_totales'), valor: String(ciclosTotales() || '—'), subrotulo: t('menu.realizados'), interactiva: false });
  const tMant = crearTarjetaResumen({ x: 300, y: 1295, ancho: 293, icono: 'mantenimiento', tamIcono: 73, colorAcento: 'var(--c-menu-naranja)',
    rotulo: t('menu.proximo_mantenimiento'), valor: mant.vencido ? t('menu.vencido') : (mant.vence ? fechaMant(mant.vence) : '—'),
    alPulsar: () => abrirMantenimiento() });
  const tHoy = crearTarjetaResumen({ x: 609, y: 1295, ancho: 206, icono: 'reloj', incluyeAro: true, colorAcento: 'var(--c-menu-morado)',
    rotulo: t('menu.ciclos_hoy'), valor: String(cHoy.length), subrotulo: t('menu.realizados'), alPulsar: () => abrirCiclosHoy() });
  const tUlt = crearTarjetaResumen({ x: 831, y: 1295, ancho: 308, icono: 'reproducir', incluyeAro: true, colorAcento: 'var(--c-menu-azul)',
    rotulo: t('menu.ultimo_ciclo'), alPulsar: () => abrirUltimoCiclo() });
  if (ultimo) {
    const f = sufijoFecha(ultimo.inicio);
    const lin = (bl, rot, val, color) => {
      const fila = h('div', { class: 'mp-ult-linea' }, h('span', { text: rot }), h('b', { text: val, style: { color } }));
      pos(fila, 0, bl - 17 * 0.86, 308);
      return fila;
    };
    tUlt.contenido.append(
      texto(`${f.fecha}  ${f.hora}`, { cx: 154, w: 292, bl: 231, tam: 19, peso: 700, color: 'var(--c-texto-primario)' }),
      lin(280, t('menu.programa'), numeroPrograma(ultimo.numeroPrograma), 'var(--c-menu-naranja-texto)'),
      lin(303, t('menu.resultado'), textoResultado(ultimo.resultado), colorResultado(ultimo.resultado)));
  } else {
    tUlt.contenido.append(texto('—', { cx: 154, bl: 258, tam: 46, peso: 700, color: 'var(--c-texto-primario)' }));
  }
  el.append(tCiclosTotales.el, tMant.el, tHoy.el, tUlt.el);

  const barra = crearBarraInferiorMenu({ x: 54, y: 1920 - 171, ancho: 1085, inicioActivo: true,
    alAtras: () => router.pop(), alInicio: () => irAPrincipal() });
  el.append(barra.el);

  // ── ventanas ──────────────────────────────────────────────────────────
  function abrirUltimoCiclo() {
    const r = ciclosTodos()[0];
    abrirVentanaMenu({ titulo: t('menu.ventana_ultimo_ciclo'), altoTarjeta: 1500, contenido: (zona, w) => {
      if (!r) return h('div', { class: 'mn-vacio', text: t('menu.sin_ciclos') });
      return crearDetalleCiclo({ ancho: w.ancho, alto: w.alto, registro: r, alVerTirilla: verTirilla }).el;
    } });
  }

  function abrirMantenimiento() {
    const m = mantenimiento();
    abrirVentanaMenu({ titulo: t('menu.ventana_mantenimiento'), altoTarjeta: 520, contenido: () => {
      const campo = (rot, val, color) => h('div', { class: 'mn-campo' }, h('div', { class: 'mn-campo-rot', text: rot }),
        h('div', { class: 'mn-campo-val', text: val, style: color ? { color } : {} }));
      return h('div', { class: 'mn-col-campos' },
        campo(t('menu.proximo_vencimiento'), m.vencido ? t('menu.vencido') : (m.vence ? fechaMant(m.vence) : '—'), m.vencido ? 'var(--c-peligro-texto)' : null),
        campo(t('menu.ultimo_mantenimiento'), fechaMant(m.ultimoFecha)),
        campo(t('menu.ciclos_restantes'), m.restantes != null ? String(m.restantes) : '—'));
    } });
  }

  function abrirCiclosHoy() {
    let sel = null;
    abrirVentanaMenu({ titulo: t('menu.ventana_ciclos_hoy'), altoTarjeta: 1500, contenido: (zona, w) => {
      const lista = crearListaCiclos({ ancho: w.ancho, alto: w.alto, seleccionable: true, alElegir: (f) => mostrarDetalle(f) });
      const filas = ciclosTodos().filter((c) => mismoDia(new Date(c.inicio), new Date())).map(filaDeRegistro);
      lista.fijar(filas);
      lista.vacia(filas.length ? '' : t('menu.sin_ciclos'));
      const vista = h('div', { class: 'mn-vista' }, lista.el);
      function mostrarDetalle(f) {
        sel = f;
        vista.replaceChildren(volver(() => { sel = null; vista.replaceChildren(lista.el); }),
          crearDetalleCiclo({ ancho: w.ancho, alto: w.alto - 80, registro: f.registro, alVerTirilla: verTirilla }).el);
        void sel;
      }
      return vista;
    } });
  }

  function volver(alPulsar) {
    const b = crearBotonPildora({ texto: `‹  ${t('menu.volver')}`, alPulsar });
    b.el.style.position = 'relative';
    b.el.style.marginBottom = '16px';
    return b.el;
  }

  function abrirHistorial() {
    let periodo = 'dia';
    let fecha = new Date();
    abrirVentanaMenu({ titulo: t('menu.ventana_historial'), altoTarjeta: 1500, contenido: (zona, w) => {
      const sel = crearSelectorPeriodo({ ancho: w.ancho, periodo, rotulo: '', esActual: true,
        alElegir: (p) => { periodo = p; fecha = new Date(); pintar(); },
        alMover: (n) => { fecha = desplazar(periodo, fecha, n); pintar(); } });
      const alturaSel = 60 + 20 + 72;
      const lista = crearListaCiclos({ ancho: w.ancho, alto: w.alto - alturaSel - 16 - 64 - 16, seleccionable: true, marcable: true,
        alElegir: (f) => detalle(f), alMarcar: () => pintarAcciones() });
      pos(lista.el, 0, alturaSel + 16);
      const cuenta = h('div', { class: 'mn-cuenta' });
      const bEnviar = crearBotonPildora({ texto: t('menu.enviar_correo'), alPulsar: avisoNoDisponible });
      const bImprimir = crearBotonPildora({ texto: t('menu.imprimir'), primario: true, alPulsar: avisoNoDisponible });
      const acciones = pos(h('div', { class: 'mn-acciones' }, cuenta, h('div', { class: 'mn-acciones-botones' }, bEnviar.el, bImprimir.el)), 0, w.alto - 64, w.ancho, 64);
      const lienzo = h('div', { class: 'mn-vista' }, sel.el, lista.el, acciones);
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
      function detalle(f) {
        lienzo.classList.add('oculto');
        const d = h('div', { class: 'mn-vista' },
          volver(() => { d.remove(); lienzo.classList.remove('oculto'); }),
          crearDetalleCiclo({ ancho: w.ancho, alto: w.alto - 80, registro: f.registro, alVerTirilla: verTirilla }).el);
        zona.append(d);
      }
      pintar();
      return lienzo;
    } });
  }

  void haySesion; void inicioDia; void dos; void sim; void on;
  return { el, destruir() { enc.destruir(); quitar.forEach((q) => q?.()); } };
}
