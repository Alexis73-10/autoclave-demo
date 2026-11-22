// Reportes (Pantallas/Reportes.qml): dashboard de solo lectura, visible sin sesión. Selector de periodo,
// indicadores con periodo anterior, resultado (dona), ciclos por día, por programa, calendario de ejecución
// por programa, causas de fallo, mantenimiento, alarmas, operadores y acciones. Los datos se calculan del
// historial de la demo con la lógica de services/domain/reportes/dashboard.py.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { haySesion } from '../../core/sesion.js';
import * as router from '../../core/router.js';
import { on } from '../../core/eventos.js';
import { sim } from '../../sim/motor.js';
import { irAPrincipal } from '../../app.js';
import { crearFondoApp } from '../componentes/fondo_app.js';
import { crearEncabezadoMenu } from '../componentes/encabezado_menu.js';
import { crearBarraInferiorMenu } from '../componentes/barra_inferior_menu.js';
import { crearSelectorPeriodo } from '../componentes/selector_periodo.js';
import { crearBotonPildora } from '../componentes/boton_pildora.js';
import { crearListaCiclos } from '../componentes/lista_ciclos.js';
import { crearDetalleCiclo } from '../componentes/detalle_ciclo.js';
import { abrirVentanaMenu } from '../componentes/ventana_menu.js';
import { texto, pos, ciclosTodos, filaDeRegistro, mantenimiento, sufijoFecha, avisoNoDisponible, verTirilla } from '../componentes/menu_util.js';
import { mascara } from '../componentes/menu_iconos.js';
import { dashboard, calendario, panelDia, rango, desplazar, esActual, iso } from '../componentes/reporte_calculo.js';
import { seccion, tarjetaIndicador, graficaDona, graficaArea, listaProgramas, anilloProgreso, listaAlarmas, listaOperadores,
  calendarioEjecucion, panelDiaCalendario } from '../componentes/reportes_widgets.js';
import { abrirDetalleAlarma } from '../componentes/ventana_detalle_alarma.js';

const ANCHO = 1085;          // ancho del desplazable
const ANCHO_SEC = ANCHO - 48; // contenido de una sección
const POR_PAGINA = 8;

export function crear() {
  const el = h('div', { class: 'rp-pantalla' });
  const enc = crearEncabezadoMenu({ alCampana: null });
  const barra = crearBarraInferiorMenu({ x: 54, y: 1920 - 171, ancho: ANCHO, personalizada: true });
  const estado = { periodo: 'mes', fecha: new Date(), programa: null, dia: null, causa: null, pagina: 0, mesAnio: null };

  // Barra inferior con Inicio y Salir
  const celda = (x, w, icono, color, rotulo, op) => {
    const c = pos(h('div', { class: 'mn-celda' }), x, 0, w, 139);
    c.append(pos(mascara(`assets/iconos/color/${icono}.svg`, 60, color), w / 2 - 30, 18), texto(rotulo, { cx: w / 2, w: w - 24, y: 88, tam: 26, peso: 600, color: 'var(--c-texto-primario)' }));
    c.addEventListener('click', op);
    return c;
  };
  const fx = barra.fx;
  barra.contenido.append(
    celda(0, 313 * fx, 'home_icon', 'var(--c-icono-barra-menu)', t('reportes.boton_inicio'), () => router.pop()),
    celda(800 * fx, 328 * fx, 'logout_icon', 'var(--c-texto-negro)', t('reportes.boton_salir'), () => irAPrincipal()));

  const tituloEl = texto(t('reportes.titulo_pantalla'), { cx: 600, w: 1000, bl: 226, tam: 39, peso: 600, color: 'var(--c-texto-sobre-accion)' });
  const desplazable = pos(h('div', { class: 'rp-desplazable desplazable' }), 54, 262, ANCHO, 1749 - 262 - 16);
  const columna = h('div', { class: 'rp-columna' });
  desplazable.append(columna);
  const capaFallo = pos(h('div', { class: 'rp-capa-fallo oculto' }), 54, 262, ANCHO, 1749 - 262 - 16);
  el.append(crearFondoApp(), enc.el, tituloEl, desplazable, capaFallo, barra.el);

  // ── selector ──────────────────────────────────────────────────────────
  const selector = crearSelectorPeriodo({ ancho: ANCHO_SEC, conAnio: true, periodo: estado.periodo,
    alElegir: (p) => { estado.periodo = p; estado.fecha = new Date(); estado.dia = null; estado.mesAnio = null; pintar(); },
    alMover: (n) => { estado.fecha = desplazar(estado.periodo, estado.fecha, n); estado.dia = null; estado.mesAnio = null; pintar(); } });
  const subtitulo = h('div', { class: 'rp-subtitulo' });
  const secPeriodo = seccion(null, selector.el, subtitulo);

  function abrirCiclo(registro) {
    abrirVentanaMenu({ titulo: `${t('menu.ciclo_titulo')} ${registro.numero}`, altoTarjeta: 1500, contenido: (zona, w) =>
      crearDetalleCiclo({ ancho: w.ancho, alto: w.alto, registro, alVerTirilla: verTirilla }).el });
  }

  // ── cuerpo ────────────────────────────────────────────────────────────
  function pintar() {
    const topPrevio = desplazable.scrollTop;
    const todos = ciclosTodos();
    const d = dashboard(todos, estado.periodo, estado.fecha);
    selector.actualizar({ periodo: estado.periodo, rotulo: d.encabezado.titulo, esActual: esActual(estado.periodo, estado.fecha) });
    subtitulo.textContent = [d.encabezado.rango, d.encabezado.comparado].filter(Boolean).join('  ·  ');

    const secInd = seccion(t('reportes.seccion_indicadores'), h('div', { class: 'rp-ind-grid' }, d.indicadores.map(tarjetaIndicador)));
    const secDona = seccion(t('reportes.seccion_resultado'), graficaDona(d.dona, ANCHO_SEC));
    const secArea = seccion(t('reportes.seccion_ciclos_dia'), graficaArea(d.serie, ANCHO_SEC));
    const secProg = seccion(t('reportes.seccion_programas'), listaProgramas(d.programas));

    // calendario
    const cal = calendario(todos, estado.periodo, estado.fecha, estado.programa, safeProgramas(), new Date(), estado.mesAnio);
    estado.programa = cal.programa;
    const panel = estado.dia && cal.vista === 'mes' && !cal.sinProgramas ? panelDia(todos, new Date(estado.dia), cal.programa) : null;
    const secCal = seccion(null, calendarioEjecucion(cal, ANCHO_SEC, {
      diaElegido: estado.dia ? (() => { const x = new Date(estado.dia); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; })() : null,
      alDia: (f) => { estado.dia = f.getTime(); pintar(); },
      alMes: (mes) => { estado.mesAnio = mes; estado.dia = null; pintar(); },
      alPrograma: (n) => { estado.programa = n; estado.dia = null; pintar(); },
      alVerAnio: () => { estado.mesAnio = null; estado.dia = null; pintar(); } }));
    if (cal.vista === 'mes' && !cal.sinProgramas) secCal.append(panelDiaCalendario(panel, cal.textoToqueDia, abrirCiclo));

    // causas
    const secCausas = seccion(t('reportes.seccion_causas'));
    if (!d.causas.length) secCausas.append(h('div', { class: 'rp-vacio', text: t('reportes.sin_fallos') }));
    else secCausas.append(h('div', { class: 'rp-causas' }, d.causas.map((c) => h('div', { class: 'rp-causa', onclick: () => { estado.causa = c.causa; estado.pagina = 0; pintarFallo(); } },
      h('span', { class: 'cau', text: c.causa }), h('b', { text: String(c.cantidad) }), h('i', { text: '›' })))));

    // mantenimiento / alarmas / operadores
    const m = mantenimiento();
    const color = m.estado === 'vencido' ? 'var(--c-peligro-texto)' : m.estado === 'proximo' ? 'var(--c-menu-naranja)' : 'var(--c-menu-verde)';
    const proximo = m.restantes == null ? '—' : m.restantes >= 0 ? t('reportes.mant_proximo', { n: m.restantes }) : t('reportes.mant_vencido_por', { n: -m.restantes });
    const sf = sufijoFecha(m.ultimoFecha);
    const reg = haySesion() ? '0' : '—';
    const secMant = seccion(t('reportes.seccion_mantenimiento'), h('div', { class: 'rp-mant' },
      anilloProgreso({ fraccion: m.intervaloCiclos ? Math.min(m.ciclosDesde / m.intervaloCiclos, 1) : 0, color, texto: `${m.ciclosDesde} / ${m.intervaloCiclos}`, titulo: t('reportes.mant_anillo') }),
      h('div', { class: 'principal', text: proximo }),
      h('div', { text: t('reportes.mant_ultimo', { fecha: sf.fecha, tecnico: m.ultimoUsuario }) }),
      h('div', { text: `${t('reportes.mant_correctivos')}: ${reg}` }),
      h('div', { text: `${t('reportes.mant_repuestos')}: ${reg}` })));
    const elegirAlarma = (g) => abrirDetalleAlarma({ id: g.codigo, codigo: g.codigo, codigoVisible: g.codigoVisible, nivel: g.alarma?.nivel ?? 'baja',
      titulo: g.titulo, descripcion: g.alarma?.descripcion ?? '', accion: g.alarma?.accion ?? '', aparecida: g.alarma?.aparecida ?? Date.now(), reconocida: true });
    const secAlarmas = seccion(t('reportes.seccion_alarmas'), listaAlarmas(d.alarmas, elegirAlarma));
    const secOper = seccion(t('reportes.seccion_operadores'), listaOperadores(d.operadores, (ANCHO - 32) / 3 - 48 - 72 - 70));
    const tres = h('div', { class: 'rp-tres' }, secMant, secAlarmas, secOper);

    // acciones
    const bI = crearBotonPildora({ texto: t('reportes.accion_imprimir_resumen'), primario: true, alPulsar: avisoNoDisponible });
    const bR = crearBotonPildora({ texto: t('reportes.accion_enviar_resumen'), alPulsar: avisoNoDisponible });
    const bC = crearBotonPildora({ texto: t('reportes.accion_enviar_consolidado'), alPulsar: avisoNoDisponible });
    const secAcc = seccion(t('reportes.seccion_acciones'), h('div', { class: 'rp-acciones' }, bI.el, bR.el, bC.el));

    const izq = h('div', { class: 'rp-col' }, secInd, secDona, secArea, secProg);
    const der = h('div', { class: 'rp-col' }, secCal, secCausas);
    columna.replaceChildren(secPeriodo, izq, der, tres, secAcc);
    desplazable.scrollTop = topPrevio;
    if (estado.causa) pintarFallo();
  }

  function safeProgramas() { try { return sim.programas() ?? []; } catch { return []; } }

  // ── listado de ciclos con un fallo ────────────────────────────────────
  function pintarFallo() {
    if (!estado.causa) { capaFallo.classList.add('oculto'); return; }
    const r = rango(estado.periodo, estado.fecha);
    const todos = ciclosTodos().filter((c) => c.resultado === 'fallo' && String(c.motivo || c.codigo || 'FALLO') === estado.causa
      && c.inicio >= r.desde.getTime() && c.inicio < r.hasta.getTime() + 86400000);
    const total = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
    estado.pagina = Math.min(estado.pagina, total - 1);
    const filas = todos.slice(estado.pagina * POR_PAGINA, (estado.pagina + 1) * POR_PAGINA).map(filaDeRegistro);
    const lista = crearListaCiclos({ ancho: ANCHO - 32, alto: POR_PAGINA * 76 + 56, seleccionable: true, alElegir: (f) => abrirCiclo(f.registro) });
    lista.fijar(filas);
    lista.vacia(filas.length ? '' : t('reportes.sin_ciclos_fallo'));
    const volver = crearBotonPildora({ texto: `‹  ${t('reportes.volver_resumen')}`, alPulsar: () => { estado.causa = null; pintarFallo(); } });
    const ant = crearBotonPildora({ texto: t('reportes.pagina_anterior'), habilitado: estado.pagina > 0, alPulsar: () => { estado.pagina--; pintarFallo(); } });
    const sig = crearBotonPildora({ texto: t('reportes.pagina_siguiente'), habilitado: estado.pagina < total - 1, alPulsar: () => { estado.pagina++; pintarFallo(); } });
    capaFallo.replaceChildren(
      pos(volver.el, 16, 16),
      h('div', { class: 'rp-fallo-tit', text: t('reportes.ciclos_con_fallo', { causa: estado.causa, n: todos.length }) }),
      pos(lista.el, 16, 150),
      h('div', { class: 'rp-fallo-pag' }, ant.el, h('span', { text: t('reportes.pagina', { n: estado.pagina + 1, total }) }), sig.el));
    capaFallo.classList.remove('oculto');
  }

  pintar();
  const quitar = [on('historial', () => pintar())];
  return { el, destruir() { enc.destruir(); quitar.forEach((q) => q?.()); } };
}

void iso;
