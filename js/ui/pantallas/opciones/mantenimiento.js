// Opciones › Mantenimiento (OpcionesMantenimiento.qml + OpcionesCalibracionAtm.qml): próximo vencimiento,
// registrar mantenimiento, intervalos y calibración de presión atmosférica SIMULADA (2 min acelerados a ~24 s).
import { h } from '../../../core/dom.js';
import { t, num } from '../../../core/i18n.js';
import { leer, guardar } from '../../../core/almacen.js';
import { abrirNumerico } from '../../../core/teclado.js';
import { sim } from '../../../sim/motor.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearBotonFormulario } from '../../componentes/boton_formulario.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { fechaIso, L } from './_comun.js';
import { mantenimiento as estadoMantenimiento } from '../../componentes/menu_util.js';
import { usuarioActual } from '../../../core/sesion.js';

const DIA = 86400000;

export function crear(ctx) {
  const p = ctx.permiso();
  const base = Date.now();
  // Fuente única con Menú y Reportes: clave de almacén 'mantenimiento' (menu_util.mantenimiento()).
  const m0 = estadoMantenimiento();
  let estado = { ultimo: m0.ultimoFecha, dias: m0.intervaloDias, ciclos: m0.intervaloCiclos };
  let tipo = 'preventivo';
  let vista = 'raiz';
  let timer = null;
  const cuerpo = h('div', { class: 'op-mt' });
  const msg = h('div', { class: 'op-nota aviso' });
  const guardarEstado = (registro = null) => {
    const previo = leer('mantenimiento', null) || {};
    guardar('mantenimiento', { ...previo, ultimoFecha: estado.ultimo, intervaloDias: estado.dias, intervaloCiclos: estado.ciclos,
      ...(registro ? { ultimoTipo: registro.tipo, ultimoUsuario: registro.usuario, ciclosBase: 0 } : {}) });
  };

  function raiz() {
    vista = 'raiz';
    const vence = estado.ultimo + estado.dias * DIA;
    const vencido = estado.dias > 0 && vence < Date.now();
    const kv = (r, v, rojo) => h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: r }), h('div', { class: `op-kv-valor${rojo ? ' rojo' : ''}`, text: v }));
    const selTipo = crearSelectorSegmentos({ valor: tipo, habilitado: p.editar, opciones: [{ valor: 'preventivo', etiqueta: t('opciones.mant_tipo_preventivo') }, { valor: 'correctivo', etiqueta: t('opciones.mant_tipo_correctivo') }], alElegir: (v) => { tipo = v; } });
    const vDias = h('span', { class: 'op-aj-campo-valor', text: estado.dias ? String(estado.dias) : t('opciones.mant_no_aplica') });
    const vCiclos = h('span', { class: 'op-aj-campo-valor', text: estado.ciclos ? String(estado.ciclos) : t('opciones.mant_no_aplica') });
    const campoDias = h('button', { class: 'op-aj-campo', type: 'button', onclick: () => p.editar && abrirNumerico({ titulo: t('opciones.mant_intervalo_dias'), valor: estado.dias, campo: campoDias, unidad: t('opciones.mant_unidad_dias'), min: 0, max: 3650, decimales: 0, alConfirmar: (v) => { estado.dias = v; vDias.textContent = v ? String(v) : t('opciones.mant_no_aplica'); } }) },
      h('span', { class: 'op-aj-campo-rotulo', text: `${t('opciones.mant_intervalo_dias')} (${t('opciones.mant_unidad_dias')})` }), vDias);
    const campoCiclos = h('button', { class: 'op-aj-campo', type: 'button', onclick: () => p.editar && abrirNumerico({ titulo: t('opciones.mant_intervalo_ciclos'), valor: estado.ciclos, campo: campoCiclos, unidad: t('opciones.mant_unidad_ciclos'), min: 0, max: 100000, decimales: 0, alConfirmar: (v) => { estado.ciclos = v; vCiclos.textContent = v ? String(v) : t('opciones.mant_no_aplica'); } }) },
      h('span', { class: 'op-aj-campo-rotulo', text: `${t('opciones.mant_intervalo_ciclos')} (${t('opciones.mant_unidad_ciclos')})` }), vCiclos);
    cuerpo.replaceChildren(h('div', { class: 'op-lista desplazable' },
      crearBotonFormulario({ texto: t('calibracion_atm.boton_calibrar'), primario: true, habilitado: p.editar, alPulsar: calibracion }).el,
      h('div', { class: 'op-fila-botones' },
        crearBotonFormulario({ texto: t('calibracion_atm.boton_prueba'), habilitado: p.editar, alPulsar: () => { msg.textContent = `${t('calibracion_atm.impreso')} ${L({ es: '(simulado)', en: '(simulated)' })}`; } }).el,
        crearBotonFormulario({ texto: t('calibracion_atm.boton_ganancias'), habilitado: p.editar, alPulsar: () => { msg.textContent = `${t('calibracion_atm.impreso')} ${L({ es: '(simulado)', en: '(simulated)' })}`; } }).el),
      msg,
      kv(t('menu.proximo_vencimiento'), vencido ? t('menu.vencido') : (estado.dias > 0 ? fechaIso(vence) : t('opciones.mant_no_aplica')), vencido),
      kv(t('menu.ultimo_mantenimiento'), fechaIso(estado.ultimo)),
      kv(t('menu.ciclos_restantes'), estado.ciclos > 0 ? String(Math.max(0, estado.ciclos - estadoMantenimiento().ciclosDesde)) : t('opciones.mant_no_aplica')),
      h('div', { class: 'op-bloque-titulo', text: t('opciones.mant_tipo') }), selTipo.el,
      h('div', { class: 'op-bloque-btn' }, crearBotonFormulario({ texto: t('opciones.mant_registrar'), primario: true, habilitado: p.editar, alPulsar: () => {
        const nombre = t(`opciones.mant_tipo_${tipo}`);
        abrirDialogoConfirmacion({ mensaje: t('opciones.mant_confirmar', { tipo: nombre }), alConfirmar: () => {
          estado.ultimo = Date.now(); guardarEstado({ tipo, usuario: usuarioActual()?.nombre ?? '—' }); ctx.bitacora('mantenimiento_registrado', { nuevo: nombre }); pintarRaiz();
        } });
      } }).el),
      h('div', { class: 'op-bloque-titulo', text: t('opciones.mant_intervalos') }),
      h('div', { class: 'op-fila-botones' }, campoDias, campoCiclos),
      nota2(t('opciones.mant_intervalos_ayuda')),
      h('div', { class: 'op-bloque-btn' }, crearBotonFormulario({ texto: t('opciones.mant_guardar_intervalos'), habilitado: p.editar, alPulsar: () => { guardarEstado(); ctx.bitacora('mantenimiento_configurado', {}); msg.textContent = t('opciones.mant_guardar_intervalos'); } }).el)));
  }
  const pintarRaiz = raiz;
  const nota2 = (txt) => h('div', { class: 'op-nota', text: txt });

  // ---------------- calibración de presión atmosférica ----------------
  function calibracion() {
    vista = 'atm';
    const TOTAL = 24;
    let muestras = [];
    let corriendo = false;
    const e0 = leer('op_equipo', {}) ?? {};
    const anterior = e0.valores?.presion_atmosferica ?? 75;
    const lista = h('div', { class: 'op-lista desplazable' });
    function condiciones() {
      const s = sim.estado;
      const puerta = Object.values(s.puertas ?? {}).some((x) => x !== 'CERRADA');
      const temp = (s.sensores?.temp_camara ?? 0) < (e0.valores?.temp_max_apertura ?? 80);
      const fuera = s.maquina !== 'CICLO';
      const lect = s.sensores?.pres_camara != null && s.sensores?.temp_camara != null;
      return [[t('calibracion_atm.cond_puerta_abierta'), puerta], [t('calibracion_atm.cond_temp_baja', { temp: '80 °C' }), temp], [t('calibracion_atm.cond_fuera_de_ciclo'), fuera], [t('calibracion_atm.cond_lecturas_validas'), lect]];
    }
    function pintar(resultado) {
      const cs = condiciones(); const ok = cs.every(([, v]) => v);
      const prom = muestras.length ? muestras.reduce((a, b) => a + b, 0) / muestras.length : null;
      const disp = muestras.length ? Math.max(...muestras) - Math.min(...muestras) : null;
      const iniciar = crearBotonFormulario({ texto: t('calibracion_atm.iniciar'), primario: true, habilitado: p.editar && !corriendo && !resultado, alPulsar: () => {
        if (!condiciones().every(([, v]) => v)) { msg2.textContent = `${t('calibracion_atm.err_precondicion')} ${L({ es: 'Abra una puerta en Preciclo para cumplir la condición.', en: 'Open a door in Preciclo to meet the condition.' })}`; return; }
        msg2.textContent = ''; corriendo = true; muestras = [];
        timer = setInterval(() => {
          const v = sim.estado.sensores?.pres_camara;
          if (v == null) { clearInterval(timer); corriendo = false; pintar({ error: t('calibracion_atm.motivo_lecturas_validas') }); return; }
          muestras.push(v + (Math.random() - 0.5) * 0.3);
          if (muestras.length >= TOTAL) { clearInterval(timer); corriendo = false; const pr = muestras.reduce((a, b) => a + b, 0) / TOTAL; pintar({ promedio: pr }); return; }
          pintar();
        }, 1000);
        pintar();
      } });
      const msg2 = h('div', { class: 'op-nota error' });
      const botonesRes = resultado?.promedio != null ? [
        crearBotonFormulario({ texto: t('calibracion_atm.confirmar'), primario: true, habilitado: p.editar, alPulsar: () => {
          const e = leer('op_equipo', {}) ?? {}; e.valores = { ...(e.valores ?? {}), presion_atmosferica: +resultado.promedio.toFixed(1) }; guardar('op_equipo', e);
          ctx.bitacora('calibracion_atm_ok', { entidad: num(resultado.promedio, 1) }); ctx.avisar(t('calibracion_atm.res_ok')); raiz();
        } }).el,
        crearBotonFormulario({ texto: t('calibracion_atm.descartar'), alPulsar: () => raiz() }).el] : [];
      lista.replaceChildren(...[
        h('div', { class: 'op-nota', text: t('calibracion_atm.guia') }),
        h('div', { class: 'op-bloque-titulo', text: t('calibracion_atm.titulo') }),
        ...cs.map(([txt, v]) => h('div', { class: `op-cond ${v ? 'ok' : 'no'}` }, h('span', { class: 'op-cond-i', text: v ? '✓' : '✗' }), h('span', { text: txt }))),
        h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: t('calibracion_atm.muestras', { n: muestras.length, total: TOTAL }) }), h('div', { class: 'op-kv-valor', text: '' })),
        h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: t('calibracion_atm.promedio') }), h('div', { class: 'op-kv-valor', text: prom == null ? '—' : `${num(prom, 1)} kPa` })),
        h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: t('calibracion_atm.dispersion') }), h('div', { class: 'op-kv-valor', text: disp == null ? '—' : `${num(disp, 2)} kPa` })),
        h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: t('calibracion_atm.anterior') }), h('div', { class: 'op-kv-valor', text: `${num(anterior, 1)} kPa` })),
        h('div', { class: 'op-nota', text: t('calibracion_atm.criterios', { min: 60, max: 110, disp: 1 }) }),
        resultado?.error ? h('div', { class: 'op-nota error', text: t('calibracion_atm.res_abortada', { motivo: resultado.error }) }) : null,
        resultado?.promedio != null ? h('div', { class: 'op-nota', text: t('calibracion_atm.res_ok') }) : null,
        msg2,
        h('div', { class: 'op-aj-botones' }, ...(botonesRes.length ? botonesRes : [iniciar.el])),
        h('div', { class: 'op-nota aviso', text: L({ es: 'Simulado: 24 muestras en unos 24 s (el equipo real toma 2 min).', en: 'Simulated: 24 samples in about 24 s (the real unit takes 2 min).' }) })].filter(Boolean));
      void ok;
    }
    cuerpo.replaceChildren(h('div', { class: 'op-sub' }, h('button', { class: 'op-sub-volver', type: 'button', onclick: () => { clearInterval(timer); raiz(); } }, h('span', { class: 'op-chev-izq' })),
      h('div', { class: 'op-sub-textos' }, h('div', { class: 'op-sub-titulo', text: t('calibracion_atm.titulo') }))), lista);
    pintar();
  }

  raiz();
  return { el: cuerpo, atras() { if (vista !== 'raiz') { clearInterval(timer); raiz(); return true; } return false; }, destruir() { clearInterval(timer); } };
}
