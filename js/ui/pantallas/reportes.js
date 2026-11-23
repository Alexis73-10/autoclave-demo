// Reportes (Pantallas/Reportes.qml): dashboard de solo lectura, visible sin sesión. Selector de periodo,
// indicadores con periodo anterior, resultado (dona), ciclos por día, por programa, calendario de ejecución
// por programa, causas de fallo, mantenimiento, alarmas, operadores y acciones. Los datos se calculan del
// historial de la demo con la lógica de services/domain/reportes/dashboard.py.
//
// Composición adaptable (la pantalla se crea una vez; girar no la recrea):
//   vertical   → réplica del QML: una columna desplazable. Un ciclo elegido (panel del día o lista de un
//                fallo) se muestra en un panel de detalle que cubre el dashboard, con «Volver».
//   horizontal → a la izquierda el selector de periodo y la lista de ciclos del periodo (historial); a la
//                derecha el dashboard en rejilla según el ancho o, con un ciclo elegido, su detalle
//                (campos, gráfica y «Ver tirilla»). El selector de periodo se mueve (mismo nodo) al girar.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { haySesion } from '../../core/sesion.js';
import * as router from '../../core/router.js';
import { on } from '../../core/eventos.js';
import { horizontal } from '../../core/disposicion.js';
import { sim } from '../../sim/motor.js';
import { irAPrincipal } from '../../app.js';
import { crearFondoApp } from '../componentes/fondo_app.js';
import { crearEncabezadoMenu } from '../componentes/encabezado_menu.js';
import { crearBarraInferiorMenu, celdaBarra } from '../componentes/barra_inferior_menu.js';
import { crearSelectorPeriodo } from '../componentes/selector_periodo.js';
import { crearBotonPildora } from '../componentes/boton_pildora.js';
import { crearListaCiclos } from '../componentes/lista_ciclos.js';
import { crearDetalleCiclo } from '../componentes/detalle_ciclo.js';
import { ciclosTodos, filaDeRegistro, mantenimiento, sufijoFecha, avisoNoDisponible, verTirilla } from '../componentes/menu_util.js';
import { dashboard, calendario, panelDia, rango, desplazar, esActual, enRango } from '../componentes/reporte_calculo.js';
import { seccion, tarjetaIndicador, graficaDona, graficaArea, listaProgramas, anilloProgreso, listaAlarmas, listaOperadores,
  calendarioEjecucion, panelDiaCalendario } from '../componentes/reportes_widgets.js';
import { abrirDetalleAlarma } from '../componentes/ventana_detalle_alarma.js';

const POR_PAGINA = 8;

export function crear() {
  const enc = crearEncabezadoMenu({ alCampana: null });
  const barra = crearBarraInferiorMenu({ personalizada: true });
  const estado = { periodo: 'mes', fecha: new Date(), programa: null, dia: null, causa: null, pagina: 0, mesAnio: null, ciclo: null };
  let limpieza = [];        // observadores de las gráficas del dashboard (se limpian al repintar)
  let limpiezaDetalle = null;

  // Barra inferior con Inicio y Salir
  barra.contenido.append(
    celdaBarra({ icono: 'home_icon', rotulo: t('reportes.boton_inicio'), alPulsar: () => router.pop() }),
    celdaBarra({ vacia: true }),
    celdaBarra({ icono: 'logout_icon', color: 'var(--c-texto-negro)', rotulo: t('reportes.boton_salir'), alPulsar: () => irAPrincipal() }));

  // ── selector ──────────────────────────────────────────────────────────
  const selector = crearSelectorPeriodo({ conAnio: true, periodo: estado.periodo,
    alElegir: (p) => { estado.periodo = p; estado.fecha = new Date(); estado.dia = null; estado.mesAnio = null; estado.causa = null; pintar(); },
    alMover: (n) => { estado.fecha = desplazar(estado.periodo, estado.fecha, n); estado.dia = null; estado.mesAnio = null; estado.causa = null; pintar(); } });
  const subtitulo = h('div', { class: 'rp-subtitulo' });
  const secPeriodo = seccion(null, selector.el, subtitulo);
  secPeriodo.classList.add('rp-sec-periodo');

  // ── estructura ────────────────────────────────────────────────────────
  const dash = h('div', { class: 'rp-dash' });
  const columna = h('div', { class: 'rp-columna' }, dash);
  const desplazable = h('div', { class: 'rp-desplazable desplazable' }, columna);
  const detalle = h('div', { class: 'rp-detalle desplazable oculto' });
  const principal = h('div', { class: 'rp-principal' }, desplazable, detalle);

  const listaPeriodo = crearListaCiclos({ seleccionable: true, alElegir: (f) => abrirCiclo(f.registro) });
  const secLista = seccion(t('menu.ventana_historial'), listaPeriodo.el);
  secLista.classList.add('rp-sec-lista', 'solo-h');
  const capaFallo = h('div', { class: 'rp-capa-fallo oculto' });
  const lateral = h('div', { class: 'rp-lateral' }, secLista, capaFallo);
  const cuerpo = h('div', { class: 'rp-cuerpo' }, lateral, principal);

  const el = h('div', { class: 'rp-pantalla' }, crearFondoApp(), enc.el,
    h('div', { class: 'rp-titulo', text: t('reportes.titulo_pantalla') }), cuerpo, h('div', { class: 'mn-pie' }, barra.el));

  /** Coloca el selector de periodo (mismo nodo) según la orientación. */
  function ubicarSelector() {
    if (horizontal()) { if (secPeriodo.parentElement !== lateral) lateral.prepend(secPeriodo); }
    else if (secPeriodo.parentElement !== columna) columna.prepend(secPeriodo);
  }

  // ── detalle del ciclo elegido ─────────────────────────────────────────
  function abrirCiclo(registro) {
    estado.ciclo = registro;
    pintarDetalle();
  }
  function pintarDetalle() {
    limpiezaDetalle?.();
    limpiezaDetalle = null;
    listaPeriodo.marcarElegida(estado.ciclo?.id ?? null);
    cuerpo.classList.toggle('con-detalle', !!estado.ciclo);
    if (!estado.ciclo) { detalle.classList.add('oculto'); detalle.replaceChildren(); return; }
    const r = estado.ciclo;
    const volver = crearBotonPildora({ texto: `‹  ${t('reportes.volver_resumen')}`, alPulsar: () => { estado.ciclo = null; pintarDetalle(); } });
    volver.el.classList.add('mn-volver');
    const d = crearDetalleCiclo({ registro: r, alVerTirilla: verTirilla });
    limpiezaDetalle = d.destruir;
    detalle.replaceChildren(h('div', { class: 'rp-detalle-cab' }, volver.el,
      h('div', { class: 'rp-detalle-tit', text: `${t('menu.ciclo_titulo')} ${r.numero}` })), d.el);
    detalle.classList.remove('oculto');
    detalle.scrollTop = 0;
  }

  // ── cuerpo ────────────────────────────────────────────────────────────
  function pintar() {
    const topPrevio = desplazable.scrollTop;
    limpieza.forEach((q) => q?.());
    limpieza = [];
    const todos = ciclosTodos();
    const d = dashboard(todos, estado.periodo, estado.fecha);
    selector.actualizar({ periodo: estado.periodo, rotulo: d.encabezado.titulo, esActual: esActual(estado.periodo, estado.fecha) });
    subtitulo.textContent = [d.encabezado.rango, d.encabezado.comparado].filter(Boolean).join('  ·  ');

    // lista del periodo (columna izquierda en horizontal)
    const r = rango(estado.periodo, estado.fecha);
    const filas = enRango(todos, r.desde, r.hasta).map(filaDeRegistro);
    listaPeriodo.fijar(filas);
    listaPeriodo.vacia(filas.length ? '' : t('menu.sin_ciclos'));
    listaPeriodo.marcarElegida(estado.ciclo?.id ?? null);

    const secInd = seccion(t('reportes.seccion_indicadores'), h('div', { class: 'rp-ind-grid' }, d.indicadores.map(tarjetaIndicador)));
    const secDona = seccion(t('reportes.seccion_resultado'), graficaDona(d.dona));
    const secArea = seccion(t('reportes.seccion_ciclos_dia'), graficaArea(d.serie, { limpieza }));
    const secProg = seccion(t('reportes.seccion_programas'), listaProgramas(d.programas));

    // calendario
    const cal = calendario(todos, estado.periodo, estado.fecha, estado.programa, safeProgramas(), new Date(), estado.mesAnio);
    estado.programa = cal.programa;
    const panel = estado.dia && cal.vista === 'mes' && !cal.sinProgramas ? panelDia(todos, new Date(estado.dia), cal.programa) : null;
    const secCal = seccion(null, calendarioEjecucion(cal, {
      diaElegido: estado.dia ? (() => { const x = new Date(estado.dia); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; })() : null,
      alDia: (f) => { estado.dia = f.getTime(); pintar(); },
      alMes: (mes) => { estado.mesAnio = mes; estado.dia = null; pintar(); },
      alPrograma: (n) => { estado.programa = n; estado.dia = null; pintar(); },
      alVerAnio: () => { estado.mesAnio = null; estado.dia = null; pintar(); },
      limpieza }));
    secCal.classList.add('rp-sec-cal');
    if (cal.vista === 'mes' && !cal.sinProgramas) secCal.append(panelDiaCalendario(panel, cal.textoToqueDia, abrirCiclo));

    // causas
    const secCausas = seccion(t('reportes.seccion_causas'));
    if (!d.causas.length) secCausas.append(h('div', { class: 'rp-vacio', text: t('reportes.sin_fallos') }));
    else secCausas.append(h('div', { class: 'rp-causas' }, d.causas.map((c) => h('button', { class: 'rp-causa', onclick: () => { estado.causa = c.causa; estado.pagina = 0; pintarFallo(); } },
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
    const secOper = seccion(t('reportes.seccion_operadores'), listaOperadores(d.operadores));
    const tres = h('div', { class: 'rp-tres' }, secMant, secAlarmas, secOper);

    // acciones
    const bI = crearBotonPildora({ texto: t('reportes.accion_imprimir_resumen'), primario: true, alPulsar: avisoNoDisponible });
    const bR = crearBotonPildora({ texto: t('reportes.accion_enviar_resumen'), alPulsar: avisoNoDisponible });
    const bC = crearBotonPildora({ texto: t('reportes.accion_enviar_consolidado'), alPulsar: avisoNoDisponible });
    const secAcc = seccion(t('reportes.seccion_acciones'), h('div', { class: 'rp-acciones' }, bI.el, bR.el, bC.el));
    secAcc.classList.add('rp-sec-acciones');

    dash.replaceChildren(secInd, secDona, secArea, secProg, secCal, secCausas, tres, secAcc);
    desplazable.scrollTop = topPrevio;
    pintarFallo();
  }

  function safeProgramas() { try { return sim.programas() ?? []; } catch { return []; } }

  // ── listado de ciclos con un fallo ────────────────────────────────────
  function pintarFallo() {
    lateral.classList.toggle('con-causa', !!estado.causa);
    cuerpo.classList.toggle('con-causa', !!estado.causa);
    if (!estado.causa) { capaFallo.classList.add('oculto'); capaFallo.replaceChildren(); return; }
    const r = rango(estado.periodo, estado.fecha);
    const todos = ciclosTodos().filter((c) => c.resultado === 'fallo' && String(c.motivo || c.codigo || 'FALLO') === estado.causa
      && c.inicio >= r.desde.getTime() && c.inicio < r.hasta.getTime() + 86400000);
    const total = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
    estado.pagina = Math.min(estado.pagina, total - 1);
    const filas = todos.slice(estado.pagina * POR_PAGINA, (estado.pagina + 1) * POR_PAGINA).map(filaDeRegistro);
    const lista = crearListaCiclos({ seleccionable: true, alElegir: (f) => abrirCiclo(f.registro) });
    lista.fijar(filas);
    lista.vacia(filas.length ? '' : t('reportes.sin_ciclos_fallo'));
    lista.marcarElegida(estado.ciclo?.id ?? null);
    const volver = crearBotonPildora({ texto: `‹  ${t('reportes.volver_resumen')}`, alPulsar: () => { estado.causa = null; pintarFallo(); } });
    volver.el.classList.add('mn-volver');
    const ant = crearBotonPildora({ texto: t('reportes.pagina_anterior'), habilitado: estado.pagina > 0, alPulsar: () => { estado.pagina--; pintarFallo(); } });
    const sig = crearBotonPildora({ texto: t('reportes.pagina_siguiente'), habilitado: estado.pagina < total - 1, alPulsar: () => { estado.pagina++; pintarFallo(); } });
    capaFallo.replaceChildren(volver.el,
      h('div', { class: 'rp-fallo-tit', text: t('reportes.ciclos_con_fallo', { causa: estado.causa, n: todos.length }) }),
      lista.el,
      h('div', { class: 'rp-fallo-pag' }, ant.el, h('span', { text: t('reportes.pagina', { n: estado.pagina + 1, total }) }), sig.el));
    capaFallo.classList.remove('oculto');
  }

  ubicarSelector();
  pintar();
  const quitar = [on('historial', () => pintar()), on('disposicion', ubicarSelector)];
  return {
    el,
    destruir() { enc.destruir(); quitar.forEach((q) => q?.()); limpieza.forEach((q) => q?.()); limpiezaDetalle?.(); },
  };
}
