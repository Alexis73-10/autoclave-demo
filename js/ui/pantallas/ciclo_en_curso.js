// Ciclo en curso (Pantallas/PantallaCicloEnCurso.qml, vertical): encabezado,
// tarjeta de ciclo (EN EJECUCIÓN con IconoEjecucion; al terminar el resultado),
// barra de fases con llenado líquido y vapor, tarjeta de parámetros (+151), gráfica
// P/T con cursor y zoom (o PanelFinCiclo en un ciclo no exitoso), transcurrido,
// progreso de la fase activa, barra de progreso global y barra inferior con el
// deslizador rojo CANCELAR CICLO (sin modal, CAN-01..03), el indicador de espera de
// la entrega o CONFIRMAR con su modal (ENT-09, FC-09). Coordenadas del mockup 1196x1917.
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { on } from '../../core/eventos.js';
import * as router from '../../core/router.js';
import { hayModalAbierto, cerrarModales } from '../../core/capas.js';
import { usuarioActual } from '../../core/sesion.js';
import { sim } from '../../sim/motor.js';
import { abrirConfiguracion } from '../../app.js';
import { caja, txt, fijarTexto, mascara, medir, fReloj, fMmSs, dos, loc } from '../componentes/_ciclo_util.js';
import { crearFondo, crearEncabezado, crearTarjetaCiclo, crearTarjetaParametros, crearBarraInferior,
  instalarSonidos } from '../componentes/_comun_pantalla_ciclo.js';
import { abrirPanelNotificaciones } from '../componentes/panel_notificaciones.js';
import { abrirPanelEquipo } from '../componentes/panel_equipo.js';
import { crearSeccionEstadoSeguro } from '../componentes/seccion_estado_seguro.js';
import { crearBarraFases } from '../componentes/barra_fases.js';
import { crearGraficaCiclo } from '../componentes/grafica_ciclo.js';
import { crearPanelFinCiclo, armarFin } from '../componentes/panel_fin_ciclo.js';
import { crearDeslizador } from '../componentes/deslizador.js';
import { abrirModalConfirmacion } from '../componentes/modal_confirmacion.js';
import { abrirPanelModal } from '../componentes/_panel_modal.js';

const REGRESO_PANEL_S = 30;

/** Texto de progreso de la fase activa (ui_qml/domain/ciclo_en_curso.texto_progreso). */
export function textoProgreso(d) {
  const sin = t('sistema.sin_lectura');
  if (!d || typeof d !== 'object') return sin;
  const n = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const g = (a, b) => n(d[a] ?? d[b]);
  const tipo = d.tipo;
  if (tipo === 'presion' || tipo === 'temperatura') {
    const a = g('actual'), o = g('objetivo');
    if (a == null || o == null) return sin;
    return t('progreso_fase.valor_objetivo', { actual: a.toFixed(1), objetivo: o.toFixed(1),
      unidad: tipo === 'presion' ? t('unidades.presion') : t('unidades.temperatura') });
  }
  if (tipo === 'prevacio') {
    const p = g('pulso'), tot = g('total');
    if (p == null || tot == null || !['bajo', 'alto'].includes(d.nivel)) return sin;
    return t('progreso_fase.prevacio', { pulso: Math.trunc(p), total: Math.trunc(tot), nivel: t(`progreso_fase.nivel_${d.nivel}`) });
  }
  if (!['estabilizando', 'exposicion', 'tiempo'].includes(tipo)) return sin;
  const a = fMmSs(g('transcurrido_s', 'transcurridoS')), o = fMmSs(g('total_s', 'totalS'));
  if (a == null || o == null) return sin;
  if (tipo === 'estabilizando') return t('progreso_fase.estabilizando', { actual: a, total: o });
  let s = t('progreso_fase.tiempo', { actual: a, total: o, unidad: t('unidades.tiempo') });
  const f0 = g('f0'), f0o = g('f0_objetivo', 'f0Objetivo');
  if (tipo === 'exposicion' && f0 != null && f0o != null)
    s += `  ${t('progreso_fase.f0', { actual: f0.toFixed(1), objetivo: f0o.toFixed(1), unidad: t('unidades.tiempo') })}`;
  return s;
}

export function crear() {
  instalarSonidos();
  const quitar = [];
  const raiz = h('div', { class: 'fc-pantalla' });
  const m = h('div', { class: 'fc-mockup' });
  raiz.append(crearFondo(), m);

  const enc = crearEncabezado({ alCampana: () => abrirPanelNotificaciones(), alEngranaje: () => router.push('menu') });
  m.append(enc.el, caja('div', 19, 177, 1159, 1746 - 10 - 177, 'fc-tarjeta-principal'));
  const tCiclo = crearTarjetaCiclo();
  const fases = crearBarraFases();
  const tParam = crearTarjetaParametros({ dy: 151 });
  m.append(tCiclo.el, fases.el, tParam.el);

  // ---- gráfica / panel de fin ----
  const GX = 33, GY = 804, GW = 1129, GH = 1598 - 804;
  const grafica = crearGraficaCiclo({ ancho: GW, alto: GH, alPantallaCompleta: () => abrirPantallaCompleta() });
  Object.assign(grafica.el.style, { left: `${GX}px`, top: `${GY}px` });
  let vistaGrafica = false, verObservaciones = false;
  const panelFin = crearPanelFinCiclo({ ancho: GW, alto: GH, alVerGrafica: () => {
    if (cargaNoEsteril) { vistaGrafica = true; regreso.reiniciar(); } else verObservaciones = false;
    pintar(sim.estado);
  } });
  Object.assign(panelFin.el.style, { left: `${GX}px`, top: `${GY}px` });
  panelFin.el.classList.add('oculto');
  m.append(grafica.el, panelFin.el);

  // tarjeta de seguridad superpuesta (paro y confirmación: grupo emergencia)
  const seguridad = crearSeccionEstadoSeguro({ grupo: 'emergencia' });
  const tarjetaSeg = caja('div', GX + (GW - 960) / 2, GY + 170, 960, null, 'fc-tarjeta-seguridad oculto');
  tarjetaSeg.append(seguridad.el);
  m.append(tarjetaSeg);

  // píldora de fin de ciclo
  const pildora = h('button', { class: 'fc-pildora oculto' }, h('i'), h('span'));
  pildora.style.top = `${GY + 58 - 29}px`;
  pildora.addEventListener('click', () => {
    if (cargaNoEsteril) vistaGrafica = false; else verObservaciones = true;
    panelFin.volverAlPanel();
    pintar(sim.estado);
  });
  m.append(pildora);

  // relojes y progreso
  const reloj = txt('', { cx: 426.5, bl: 1656, tam: 48, peso: 700, familia: 'num', color: 'var(--c-texto-reloj)' });
  const rotReloj = txt(t('ciclo.tiempo_transcurrido'), { cx: 426.5, bl: 1681, tam: 19, color: 'var(--c-rotulo-reloj)' });
  const progreso = txt('', { cx: 960, bl: 1656, tam: 40, peso: 700, familia: 'num', color: 'var(--c-texto-reloj)', ancho: 440 });
  const rotProg = txt(t('progreso_fase.rotulo'), { cx: 960, bl: 1681, tam: 19, color: 'var(--c-rotulo-reloj)' });
  const pista = caja('div', 39, 1691, 1157 - 39, 32, 'fc-pista-progreso');
  const relleno = h('div', { class: 'fc-relleno-progreso' });
  pista.append(relleno);
  m.append(reloj, rotReloj, progreso, rotProg, pista);

  // ---- barra inferior ----
  const barra = crearBarraInferior({ avatarEn: 'centro', alEquipo: () => abrirPanelEquipo({ permiteApagar: false }),
    alAvatar: () => abrirConfiguracion() });
  m.append(barra.el);
  const xDer = barra.mx(800), anchoDer = 1159 - xDer;
  // botón de la tirilla (agregado de la demo)
  const bTirilla = h('button', { class: 'fc-boton-tirilla' }, mascara('assets/iconos/mono/impresion.svg', 34, 'currentColor'),
    h('span', { text: loc({ es: 'Tirilla', en: 'Ticket' }) }));
  bTirilla.addEventListener('click', () => { const c = sim.estado.ciclo; router.push('tirilla', { cicloId: c?.id ?? null }); });
  barra.celdaCentro.append(bTirilla);

  const desl = crearDeslizador({ variante: 'cancelar', ancho: 235, alto: 88, texto: t('ciclo.cancelar'),
    textoCompletado: t('ciclo.cancelando'), dosLineas: true,
    manija: h('img', { src: 'assets/iconos/color/detener.svg', alt: '', draggable: 'false', style: { width: `${88 / 60 * 54 * 0.82}px` } }),
    alCompletar: () => {
      if (terminado) return;
      const r = sim.cancelarCiclo(usuarioActual()?.nombre ?? null);
      if (r) avisoComando(t('ciclo.cancelar_error'));
    } });
  Object.assign(desl.el.style, { position: 'absolute', left: `${barra.mx(846 - 34) - xDer}px`, top: '22px' });
  const bConfirmar = caja('button', barra.mx(846 - 34) - xDer, 22, 235, 88, 'fc-boton-confirmar oculto');
  const aro = caja('span', 894 - 846 - 32.5, 1812 - 1768 - 32.5, 65, 65, 'fc-bc-aro');
  aro.append(mascara('assets/iconos/mono/confirmar.svg', 48, 'var(--c-texto-sobre-accion)'));
  bConfirmar.append(aro, txt(t('ciclo.confirmar'), { lx: 941 - 846, bl: 1816 - 1768, tam: 13, peso: 500, color: 'var(--c-texto-sobre-accion)' }));
  bConfirmar.addEventListener('click', () => abrirConfirmar());
  const indicador = caja('div', 12, 14, anchoDer - 24, 100, 'fc-indicador-entrega oculto');
  const txtIndicador = h('span');
  indicador.append(txtIndicador);
  barra.celdaDerecha.append(desl.el, bConfirmar, indicador);

  // ---- pantalla completa de la gráfica ----
  let capaCompleta = null, graficaCompleta = null;
  function abrirPantallaCompleta() {
    if (capaCompleta) return;
    graficaCompleta = crearGraficaCiclo({ ancho: 1129, alto: 1917 - 80, pantallaCompleta: true, alCerrar: cerrarPantallaCompleta });
    Object.assign(graficaCompleta.el.style, { left: '33px', top: '40px' });
    const mm = h('div', { class: 'fc-mockup' }, graficaCompleta.el);
    capaCompleta = h('div', { class: 'fc-capa-completa' }, crearFondo(), mm);
    raiz.append(capaCompleta);
    pintar(sim.estado);
  }
  function cerrarPantallaCompleta() {
    graficaCompleta?.destruir(); capaCompleta?.remove(); capaCompleta = null; graficaCompleta = null;
  }

  // ---- avisos y modales ----
  function avisoComando(texto) {
    abrirPanelModal({ titulo: t('ciclo.aviso_titulo'), altoTarjeta: 560, ajustarAlto: true,
      contenido: h('div', { class: 'fc-aviso-comando', text: texto }) });
  }
  let modalConfirmar = null;
  function abrirConfirmar() {
    const c = sim.estado.ciclo;
    if (!c?.resultado) return;
    const exitoso = c.resultado === 'exitoso';
    const n = dos(c.numero ?? '');
    modalConfirmar = abrirModalConfirmacion({
      titulo: exitoso ? t('ciclo.modal_confirmar_titulo') : t('ciclo.modal_confirmar_resultado_titulo'),
      cuerpo: t(exitoso ? 'ciclo.modal_confirmar_cuerpo_exitoso' : c.resultado === 'cancelado'
        ? 'ciclo.modal_confirmar_cuerpo_cancelado' : 'ciclo.modal_confirmar_cuerpo_fallo', { n }),
      nota: exitoso ? armarFin(c).notaObservaciones : '',
      textoAccion: t('ciclo.modal_confirmar_accion'),
      colorAccion: exitoso ? 'var(--c-menu-verde)' : 'var(--c-accion-primario)',
      alAceptar: () => {
        modalConfirmar = null;
        const r = sim.confirmarCiclo({});
        if (r) avisoComando(r === 'sesion.camara_no_entregada' || r.endsWith('camara_no_entregada') ? t(r) : t('ciclo.confirmar_error'));
      },
      alCancelar: () => { modalConfirmar = null; },
    });
  }

  // ---- regreso automático al panel (FC-05) ----
  const regreso = {
    restante: REGRESO_PANEL_S, timer: 0,
    reiniciar() { this.restante = REGRESO_PANEL_S; },
    arrancar() {
      if (this.timer) return;
      this.timer = setInterval(() => {
        if (!(cargaNoEsteril && vistaGrafica) || hayModalAbierto()) { this.reiniciar(); return; }
        this.restante = Math.max(0, this.restante - 1);
        if (this.restante === 0) { cerrarPantallaCompleta(); vistaGrafica = false; panelFin.volverAlPanel(); }
        pintar(sim.estado);
      }, 1000);
    },
    detener() { clearInterval(this.timer); this.timer = 0; },
  };
  raiz.addEventListener('pointerdown', () => regreso.reiniciar(), true);
  regreso.arrancar();

  // ---- actualización ----
  let terminado = false, cargaNoEsteril = false, resultadoPrevio = null, cicloPrevio = null, ultimoPintado = 0;
  function pintar(e) {
    if (!e) return;
    const c = e.ciclo;
    const vigente = e.datosVigentes !== false;
    enc.actualizar(e);
    if (!c) return;
    if (c.id !== cicloPrevio) { cicloPrevio = c.id; vistaGrafica = false; verObservaciones = false; }
    const resultado = c.resultado || '';
    if (resultado !== resultadoPrevio) {
      resultadoPrevio = resultado; vistaGrafica = false; verObservaciones = false;
      modalConfirmar?.cerrar(); modalConfirmar = null;
    }
    terminado = resultado !== '';
    cargaNoEsteril = terminado && resultado !== 'exitoso';
    const fin = terminado ? armarFin(c) : { modo: '' };
    const modoFin = cargaNoEsteril ? (['fallo', 'cancelado', 'emergencia'].includes(fin.modo) ? fin.modo : 'fallo')
      : (resultado === 'exitoso' && fin.modo === 'observaciones' ? 'observaciones' : '');
    const hayObs = modoFin === 'observaciones';
    const panelVisible = (cargaNoEsteril && !vistaGrafica) || (hayObs && verObservaciones);

    const prog = sim.programa(c.programaId);
    tCiclo.fijar({ numero: dos(c.numero ?? ''), programa: c.programaNombre || prog?.nombre || '', modo: 'ciclo', vigente,
      estado: !terminado ? { tipo: 'ejecutando', texto: t('estados.ejecutando') }
        : { tipo: resultado === 'exitoso' ? 'exitoso' : 'fallo', texto: t(`estados.${resultado}`) } });
    fases.fijar(c.fases || [], { vigente, cicloId: c.id });
    tParam.fijar(prog, e.sensores, vigente);

    // gráfica (a lo sumo 4 veces por segundo) o panel
    grafica.el.classList.toggle('oculto', panelVisible);
    panelFin.el.classList.toggle('oculto', !panelVisible);
    const ahora = performance.now();
    if (ahora - ultimoPintado > 250) {
      ultimoPintado = ahora;
      const datos = { serie: c.serie || [], tiempos: c.fases || [], tiempoActualS: c.transcurridoS };
      if (!panelVisible) grafica.fijar(datos);
      graficaCompleta?.fijar(datos);
    }
    if (panelVisible) {
      const claves = { fallo: 'ciclo.fin_subtitulo_fallo', cancelado: 'ciclo.fin_subtitulo_cancelado',
        emergencia: 'ciclo.fin_subtitulo_emergencia', observaciones: 'ciclo.fin_subtitulo_observaciones' };
      panelFin.fijar({ ...fin, modo: modoFin }, t(claves[modoFin] || claves.fallo,
        { n: dos(c.numero ?? ''), hora: fin.horaFin || t('sistema.sin_lectura') }));
    }
    // aviso crítico: cierra la pantalla completa
    seguridad.actualizar(e);
    tarjetaSeg.classList.toggle('oculto', seguridad.conteo() === 0);
    if (capaCompleta && (seguridad.conteo() > 0 || panelVisible)) cerrarPantallaCompleta();

    // píldora
    const verPildora = !panelVisible && (cargaNoEsteril || hayObs);
    pildora.classList.toggle('oculto', !verPildora);
    if (verPildora) {
      pildora.classList.toggle('obs', !cargaNoEsteril);
      const txtP = cargaNoEsteril ? t('ciclo.pildora_alarmas', { n: Math.max(1, fin.cantidad || 1), s: dos(regreso.restante) })
        : t('ciclo.pildora_observaciones', { n: fin.cantidad || 0 });
      const sp = pildora.lastChild;
      if (sp.textContent !== txtP) sp.textContent = txtP;
      const w = medir(txtP, 22, 600) + 14 + 12 + 48;
      pildora.style.width = `${w}px`;
      pildora.style.left = `${GX + 856 - 16 - w}px`;
    }

    // relojes y progreso
    fijarTexto(reloj, vigente ? fReloj(c.transcurridoS) : t('sistema.sin_lectura'));
    fijarTexto(progreso, vigente && !terminado ? textoProgreso(c.detalleFase) : t('sistema.sin_lectura'));
    const tt = c.transcurridoS, rr = c.restanteS;
    const frac = tt != null && rr != null && tt + rr > 0 ? Math.max(0, Math.min(1, tt / (tt + rr))) : (resultado === 'exitoso' ? 1 : 0);
    relleno.style.width = frac > 0 ? `${Math.max(32, 1118 * frac)}px` : '0';

    // cancelar / indicador / confirmar
    const entrega = c.entrega || {};
    const puede = terminado && !!entrega.entregada;
    const esperando = terminado && !puede;
    desl.el.classList.toggle('oculto', terminado);
    desl.habilitar(!terminado && vigente && !hayModalAbierto());
    bConfirmar.classList.toggle('oculto', !puede);
    bConfirmar.disabled = !vigente;
    indicador.classList.toggle('oculto', !esperando);
    if (esperando) {
      // Como PantallaCicloEnCurso.qml vigente (textoEntrega): «Terminando»; el motivo con valor y
      // límite lo da la fila NO ABRIR de la tarjeta de alarmas (tanda 34, ajuste 12-nov).
      const txtI = t('ciclo.terminando');
      if (txtIndicador.textContent !== txtI) txtIndicador.textContent = txtI;
    }
    if (!puede && modalConfirmar) { modalConfirmar.cerrar(); modalConfirmar = null; }
  }
  pintar(sim.estado);
  quitar.push(on('sim', pintar));

  return {
    el: raiz,
    alMostrar() { fases.fijarVisible(true); pintar(sim.estado); },
    alOcultar() { fases.fijarVisible(false); },
    destruir() {
      quitar.forEach((q) => q()); enc.destruir(); fases.destruir(); grafica.destruir(); desl.destruir();
      cerrarPantallaCompleta(); regreso.detener();
      if (modalConfirmar) cerrarModales();
    },
  };
}
