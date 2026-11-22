// Opciones › Entradas / Salidas (OpcionesEntradasSalidas.qml + OpcionesCalibracionSensor.qml).
// Segmentos Entradas / Salidas / Temperatura / Presión con los valores EN VIVO del simulador
// (sim.estado.entradas / salidas / sensores). El modo prueba es SIMULADO: las salidas «encendidas» solo
// se muestran aquí y no afectan al ciclo; no se puede habilitar durante un ciclo.
import { h } from '../../../core/dom.js';
import { t, num } from '../../../core/i18n.js';
import { on } from '../../../core/eventos.js';
import { leer, guardar } from '../../../core/almacen.js';
import { abrirModal } from '../../../core/capas.js';
import { abrirNumerico } from '../../../core/teclado.js';
import { sim } from '../../../sim/motor.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { ESTADOS_EDICION, pad2, fechaHoraIso, L } from './_comun.js';

const DI = ['aire_comprimido', 'presion_agua', 'puerta_1_cerrada', 'puerta_1_abierta', 'puerta_2_cerrada', 'puerta_2_abierta', 'atrapamiento_puerta_1',
  'atrapamiento_puerta_2', 'agua_bomba', 'agua_generador', 'paro_emergencia', 'agua_camara', 'vapor_suministro', 'suministro_electrico'];
const DO = [['vapor_generador', 1], ['vapor_caldera', 2], ['vapor_chaqueta', 3], ['vapor_camara', 4], ['descompresion_rapida', 5], ['descompresion_lenta', 6],
  ['descompresion_chaqueta', 7], ['vacio_camara', 8], ['desbloqueo_puerta_1', 9], ['desbloqueo_puerta_2', 10], ['bloqueo_puerta_1', 11], ['bloqueo_puerta_2', 12],
  ['aire_comprimido_camara', 14], ['aire_atmosferico_camara', 15], ['agua_chaqueta', 16], ['agua_intercambiador', 17], ['agua_bomba', 18], ['bomba_vacio', 19],
  ['abrir_puerta_1', 20], ['abrir_puerta_2', 21], ['cerrar_puerta_1', 22], ['cerrar_puerta_2', 23], ['buzer_alarma', 25]];
// [clave del simulador, clave de texto io.ai.*, puerto]
const TEMP = [['temp_camara', 'temp_camara', 'RTD 01'], ['temp_ref', 'temp_referencia', 'RTD 03'], ['temp_drenaje', 'temp_drenaje', 'RTD 04']];
const PRES = [['pres_camara', 'pres_camara', 'AI 01'], ['pres_chaqueta', 'pres_chaqueta', 'AI 02']];
const PRES_UNIDAD = { kPa: [1, 1], bar: [0.01, 3], mbar: [10, 0], psi: [0.145038, 2] };

export function crear(ctx) {
  const p = ctx.permiso();
  let segmento = 'entradas';
  let prueba = false;
  const forzadas = {};       // salida -> bool (simulado)
  let vistaCal = null;       // sensor en calibración
  let inactividad = null;
  const cuerpo = h('div', { class: 'op-es' });
  let refrescar = () => {};

  const unidades = () => leer('op_equipo', {}) ?? {};
  const tempTxt = (v) => { if (v == null) return null; const u = unidades().unidadTemp === 'F'; return `${num(u ? v * 1.8 + 32 : v, 1)} ${u ? '°F' : '°C'}`; };
  const presTxt = (v) => { if (v == null) return null; const [f, d] = PRES_UNIDAD[unidades().unidadPres ?? 'kPa']; return `${num(v * f, d)} ${unidades().unidadPres ?? 'kPa'}`; };

  const puedeProbar = () => p.editar && ESTADOS_EDICION.includes(ctx.maquina());
  function salirPrueba() { prueba = false; for (const k of Object.keys(forzadas)) delete forzadas[k]; clearTimeout(inactividad); pintar(); }
  function actividad() { clearTimeout(inactividad); if (prueba) inactividad = setTimeout(salirPrueba, 5 * 60000); }

  // valores
  function di(clave) {
    const e = sim.estado;
    if (e.entradas && clave in e.entradas) return !!e.entradas[clave];
    const m = /^puerta_(\d)_(cerrada|abierta)$/.exec(clave);
    if (m) { const s = e.puertas?.[m[1]]; return m[2] === 'cerrada' ? s === 'CERRADA' : s === 'ABIERTA'; }
    if (clave === 'paro_emergencia' || clave.startsWith('atrapamiento')) return false;
    return true;
  }
  const doReal = (clave) => !!sim.estado.salidas?.[clave];
  const doValor = (clave) => (clave in forzadas ? forzadas[clave] : doReal(clave));

  function avisoSalida(clave) {
    const e = sim.estado;
    const abierta = Object.values(e.puertas ?? {}).some((s) => s !== 'CERRADA');
    if (clave === 'vapor_camara' && abierta) return t('io.err_vapor_puerta_abierta');
    if (/^(abrir|desbloqueo)_puerta|^desbloqueo_puerta/.test(clave) && (e.sensores?.pres_camara ?? 75) > 85) return t('io.err_puerta_camara_presurizada');
    if (clave === 'aire_atmosferico_camara' && (e.sensores?.pres_camara ?? 75) > 85) return t('io.err_aire_con_presion');
    return '';
  }

  function conmutar(clave, aviso) {
    actividad();
    const nuevo = !doValor(clave);
    if (nuevo) {
      const m = avisoSalida(clave);
      if (m) { aviso.textContent = m; return; }
      const op = /^(abrir|cerrar)_puerta_(\d)$/.exec(clave);
      if (op) forzadas[`${op[1] === 'abrir' ? 'cerrar' : 'abrir'}_puerta_${op[2]}`] = false;
    }
    aviso.textContent = '';
    forzadas[clave] = nuevo;
    ctx.bitacora('salida_prueba', { entidad: t(`io.do.${clave}`), nuevo: nuevo ? 'ON' : 'OFF' });
    refrescar();
  }

  // ---------------- listas vivas ----------------
  function pintarEntradas() {
    const refs = DI.map((k, i) => {
      const estado = h('span', { class: 'op-es-estado' });
      const el = h('div', { class: 'op-es-tarjeta' }, h('div', { class: 'op-es-nombre' }, h('div', { text: t(`io.di.${k}`) }), h('div', { class: 'op-es-puerto', text: `DI ${pad2(i + 1)}` })), estado);
      return { el, k, estado };
    });
    refrescar = () => refs.forEach((r) => { const v = di(r.k); r.estado.textContent = t(v ? 'io.ui.activo' : 'io.ui.inactivo'); r.estado.classList.toggle('on', v); });
    return h('div', { class: 'op-es-rejilla desplazable' }, refs.map((r) => r.el));
  }

  function pintarSalidas() {
    const aviso = h('div', { class: 'op-nota error' });
    const refs = DO.map(([k, n]) => {
      const estado = h('span', { class: 'op-es-estado' });
      const btn = crearBotonFormulario({ texto: t('io.ui.activar'), primario: true, habilitado: prueba, alPulsar: () => conmutar(k, aviso) });
      btn.el.classList.add('chico');
      const el = h('div', { class: 'op-es-tarjeta salida' }, h('div', { class: 'op-es-nombre' }, h('div', { text: t(`io.do.${k}`) }), h('div', { class: 'op-es-puerto', text: `DO ${pad2(n)}` })),
        h('div', { class: 'op-es-der' }, estado, btn.el));
      return { el, k, estado, btn };
    });
    refrescar = () => refs.forEach((r) => { const v = doValor(r.k); r.estado.textContent = t(v ? 'io.ui.on' : 'io.ui.off'); r.estado.classList.toggle('on', v);
      r.btn.actualizar({ texto: t(v ? 'io.ui.apagar' : 'io.ui.activar'), habilitado: prueba, primario: !v }); });
    const cabecera = prueba
      ? h('div', { class: 'op-es-banner' }, h('b', { text: t('io.ui.banner_prueba') }), h('span', { text: t('io.ui.banner_regla') }),
        h('span', { text: `${t('io.ui.presion_camara')}: ${presTxt(sim.estado.sensores?.pres_camara) ?? '—'}` }))
      : null;
    const boton = crearBotonFormulario({ texto: prueba ? t('io.ui.salir_prueba') : t('io.ui.habilitar_prueba'), primario: !prueba, habilitado: prueba || puedeProbar(), alPulsar: () => {
      if (prueba) { salirPrueba(); return; }
      abrirDialogoConfirmacion({ mensaje: `${t('io.ui.dialogo_titulo')}\n\n${t('io.ui.dialogo_texto')}`, textoConfirmar: t('io.ui.continuar'), alConfirmar: () => { prueba = true; actividad(); ctx.bitacora('modo_prueba_entra', {}); pintar(); } });
    } });
    return h('div', { class: 'op-es-salidas' }, cabecera, boton.el, !prueba && !puedeProbar() ? h('div', { class: 'op-nota', text: t('io.ui.sin_permiso_prueba') }) : null, aviso,
      h('div', { class: 'op-es-rejilla desplazable' }, refs.map((r) => r.el)));
  }

  function pintarSensores(lista, fmt) {
    const cal = leer('op_cal', {});
    const refs = lista.map(([k, texto, puerto]) => {
      const valor = h('div', { class: 'op-es-valor' });
      const sinLectura = h('div', { class: 'op-nota error' });
      const c = cal[k];
      const btn = crearBotonFormulario({ texto: t('io.ui.calibrar'), habilitado: p.editar || ctx.rol === 'ingeniero', alPulsar: () => { vistaCal = { k, texto, puerto, fmt }; pintar(); } });
      btn.el.classList.add('chico');
      const el = h('div', { class: 'op-es-sensor' },
        h('div', { class: 'op-es-sensor-cab' }, h('div', { class: 'op-es-nombre' }, h('div', { text: t(`io.ai.${texto}`) }), h('div', { class: 'op-es-puerto', text: puerto })), valor),
        h('div', { class: 'op-es-sensor-det' }, h('span', { text: `${t('io.ui.adc')}: ${Math.round(2048 + (sim.estado.sensores?.[k] ?? 0) * 6)}` }),
          h('span', { text: `${t('io.ui.ganancia')}: ${num(c?.gan ?? 1, 4)}` }), h('span', { text: `${t('io.ui.offset')}: ${num(c?.off ?? 0, 2)}` }),
          h('span', { text: c ? `${t('io.ui.ultima_calibracion')}: ${fechaHoraIso(c.ms)}` : t('io.ui.de_fabrica') })), sinLectura, btn.el);
      return { el, k, valor, sinLectura };
    });
    refrescar = () => refs.forEach((r) => { const v = sim.estado.sensores?.[r.k]; r.valor.textContent = fmt(v) ?? '—'; r.sinLectura.textContent = v == null ? t('io.ui.sin_lectura') : ''; });
    return h('div', { class: 'op-es-sensores desplazable' }, refs.map((r) => r.el));
  }

  // ---------------- calibración de un sensor ----------------
  function pintarCalibracion() {
    const { k, texto, puerto, fmt } = vistaCal;
    const cal = leer('op_cal', {});
    const actual = cal[k] ?? { gan: 1, off: 0 };
    const puntos = [null, null];             // {real, equipo}
    const reales = [null, null];
    const vivo = h('div', { class: 'op-es-valor grande' });
    const resultado = h('div', { class: 'op-es-resultado' });
    const msg = h('div', { class: 'op-nota error' });
    const aplicar = crearBotonFormulario({ texto: t('io.ui.cal_aplicar'), primario: true, habilitado: false, alPulsar: () => confirmarAplicar() });
    const unidad = k.startsWith('temp') ? (unidades().unidadTemp === 'F' ? 1 : 0) : 0;
    void unidad;
    function calc() {
      if (!puntos[0] || !puntos[1] || puntos[1].equipo === puntos[0].equipo) { aplicar.actualizar({ habilitado: false }); return null; }
      const gan = (puntos[1].real - puntos[0].real) / (puntos[1].equipo - puntos[0].equipo);
      const off = puntos[0].real - gan * puntos[0].equipo;
      resultado.textContent = `${t('io.ui.cal_resultado')}: ${t('io.ui.ganancia')} ${num(gan, 4)} · ${t('io.ui.offset')} ${num(off, 2)}`;
      aplicar.actualizar({ habilitado: p.editar || ctx.rol === 'ingeniero' });
      return { gan, off };
    }
    function guardarCal(gan, off) { const c = leer('op_cal', {}); c[k] = { gan, off, ms: Date.now(), previa: c[k] ?? null }; guardar('op_cal', c); ctx.bitacora('calibracion_atm_ok', { entidad: t(`io.ai.${texto}`) }); ctx.avisar(t('io.ui.cal_aplicar')); vistaCal = null; pintar(); }
    function confirmarAplicar() {
      const r = calc(); if (!r) return;
      if (Math.abs(r.gan - 1) > 0.05 || Math.abs(r.off) > 5) abrirDialogoConfirmacion({ mensaje: t('io.ui.cal_confirmar_titulo'), alConfirmar: () => guardarCal(r.gan, r.off) });
      else guardarCal(r.gan, r.off);
    }
    function puntoUI(i, rotulo) {
      const realTxt = h('span', { class: 'op-cal-v', text: '—' });
      const equipoTxt = h('span', { class: 'op-cal-v', text: '—' });
      const campo = h('button', { class: 'op-aj-campo', type: 'button', onclick: () => abrirNumerico({ titulo: t('io.ui.cal_real'), valor: reales[i] ?? 0, decimales: 1, min: -50, max: 1000, alConfirmar: (v) => { reales[i] = v; realTxt.textContent = num(v, 1); } }) },
        h('span', { class: 'op-aj-campo-rotulo', text: t('io.ui.cal_real') }), realTxt);
      const cap = crearBotonFormulario({ texto: t('io.ui.cal_capturar'), alPulsar: () => {
        const v = sim.estado.sensores?.[k];
        if (v == null) { msg.textContent = t('io.ui.sin_lectura'); return; }
        if (reales[i] == null) { msg.textContent = t('io.ui.cal_real'); return; }
        msg.textContent = ''; puntos[i] = { real: reales[i], equipo: v }; equipoTxt.textContent = num(v, 2); calc();
      } });
      return h('div', { class: 'op-cal-punto' }, h('div', { class: 'op-es-nombre' }, h('div', { text: rotulo })), campo, h('div', { class: 'op-cal-equipo' }, h('span', { class: 'op-aj-rotulo', text: t('io.ui.cal_equipo') }), equipoTxt), cap.el);
    }
    refrescar = () => { vivo.textContent = fmt(sim.estado.sensores?.[k]) ?? '—'; };
    const volver = () => { vistaCal = null; pintar(); };
    cuerpo.replaceChildren(h('div', { class: 'op-sub' }, h('button', { class: 'op-sub-volver', type: 'button', onclick: volver }, h('span', { class: 'op-chev-izq' })),
      h('div', { class: 'op-sub-textos' }, h('div', { class: 'op-sub-titulo', text: t('io.ui.cal_titulo', { sensor: t(`io.ai.${texto}`) }) }), h('div', { class: 'op-sub-sub', text: puerto }))),
    h('div', { class: 'op-lista desplazable' },
      h('div', { class: 'op-aj-celdas' }, h('div', { class: 'op-aj-celda' }, h('div', { class: 'op-aj-rotulo', text: t('io.ui.cal_lectura') }), vivo),
        h('div', { class: 'op-aj-celda' }, h('div', { class: 'op-aj-rotulo', text: t('io.ui.cal_actual') }), h('div', { class: 'op-aj-valor', text: `${num(actual.gan, 4)} / ${num(actual.off, 2)}` })),
        h('div', { class: 'op-aj-celda' }, h('div', { class: 'op-aj-rotulo', text: t('io.ui.cal_defecto') }), h('div', { class: 'op-aj-valor', text: '1,0000 / 0,00' }))),
      puntoUI(0, t('io.ui.cal_punto_bajo')), puntoUI(1, t('io.ui.cal_punto_alto')), resultado, msg,
      h('div', { class: 'op-aj-botones' },
        crearBotonFormulario({ texto: t('io.ui.cal_restaurar_ultimo'), habilitado: !!cal[k]?.previa, alPulsar: () => { const c = leer('op_cal', {}); c[k] = c[k].previa ?? undefined; guardar('op_cal', c); vistaCal = null; pintar(); } }).el,
        crearBotonFormulario({ texto: t('io.ui.cal_restaurar_defecto'), alPulsar: () => abrirDialogoConfirmacion({ mensaje: t('io.ui.cal_confirmar_restaurar'), alConfirmar: () => { const c = leer('op_cal', {}); delete c[k]; guardar('op_cal', c); vistaCal = null; pintar(); } }) }).el,
        aplicar.el),
      h('div', { class: 'op-nota aviso', text: L({ es: 'Simulado: la calibración solo se guarda en este navegador.', en: 'Simulated: the calibration is only saved in this browser.' }) })));
    refrescar();
  }

  const tabs = crearSelectorSegmentos({ valor: 'entradas', opciones: ['entradas', 'salidas', 'temperatura', 'presion'].map((v) => ({ valor: v, etiqueta: t(`io.ui.seg_${v}`) })),
    alElegir: (v) => { segmento = v; pintar(); } });
  const enlace = h('div', { class: 'op-nota', text: t('io.ui.enlace_ok') });
  const contenido = h('div', { class: 'op-es-contenido' });

  function pintar() {
    if (vistaCal) { cuerpo.className = 'op-es'; pintarCalibracion(); return; }
    tabs.actualizar({ valor: segmento });
    contenido.replaceChildren(segmento === 'entradas' ? pintarEntradas() : segmento === 'salidas' ? pintarSalidas()
      : segmento === 'temperatura' ? pintarSensores(TEMP, tempTxt) : pintarSensores(PRES, presTxt));
    cuerpo.replaceChildren(tabs.el, contenido, enlace);
    refrescar();
  }
  pintar();

  let ultimo = 0;
  const quitar = on('sim', () => {
    const ahora = Date.now(); if (ahora - ultimo < 400) return; ultimo = ahora;
    if (prueba && !puedeProbar()) salirPrueba();
    refrescar();
  });
  return {
    el: cuerpo,
    atras() { if (vistaCal) { vistaCal = null; pintar(); return true; } return false; },
    destruir() { quitar(); clearTimeout(inactividad); },
  };
}
void abrirModal;
