// Opciones › Parámetros del equipo (OpcionesParametrosEquipo.qml): submenús Puerta, Cámara segura, Impresión,
// Drenaje, Empaque, Chaqueta, Sistema y «Configuración de la máquina» (idioma, tema, unidades, serie, modelo).
// Valores de demostración editables; se guardan en el navegador (almacen.js › op_equipo).
import { h } from '../../../core/dom.js';
import { t, idioma, fijarIdioma, num } from '../../../core/i18n.js';
import { leer, guardar } from '../../../core/almacen.js';
import { tema, fijarTema } from '../../../core/tema.js';
import * as router from '../../../core/router.js';
import { crearSelectorSegmentos } from '../../componentes/selector_segmentos.js';
import { crearFilaInterruptor } from '../../componentes/fila_interruptor.js';
import { abrirDialogoConfirmacion } from '../../componentes/dialogo_confirmacion.js';
import { abrirAjuste } from './_ajuste.js';
import { cabeceraSub, filaNav, tarjetaSubmenu, nota, L } from './_comun.js';

// [clave, defecto, min, max, magnitud ('s'|'min'|'C'|'kPa'|''), decimales, soloLectura?]
const GRUPOS = {
  puerta: [['timeout_puerta', 60, 5, 600, 's', 0]],
  camara_segura: [['temp_max_apertura', 80, 40, 120, 'C', 1], ['rango_presion_atm', 5, 1, 10, 'kPa', 1], ['secado_tras_fallo_s', 60, 0, 300, 's', 0], ['secado_tras_fallo_vacio_s', 10, 1, 60, 's', 0]],
  impresion: [['intervalo_impresion', 60, 10, 3600, 's', 0], ['intervalo_impresion_esterilizacion', 30, 10, 3600, 's', 0]],
  drenaje: [['temp_segura_drenaje', 70, 40, 90, 'C', 1], ['rango_temp_drenaje', 5, 1, 20, 'dC', 1]],
  empaque: [['presion_empaque', 300, 100, 400, 'kPa', 1], ['vacio_empaque', 30, 0, 100, 'kPa', 1]],
  chaqueta: [['presion_max_chaqueta_control', 375, 300, 990, 'kPa', 1], ['timeout_aislamiento_camara', 3, 1, 10, 'min', 0], ['max_aislamientos_camara', 6, 2, 20, '', 0],
    ['ventana_aislamientos_camara', 15, 5, 60, 'min', 0], ['presion_fondo_escala', 400, 100, 1000, 'kPa', 1], ['presion_suministro_vapor', 350, 100, 1000, 'kPa', 1],
    ['presion_alivio_camara', 385, 100, 1000, 'kPa', 1], ['presion_alivio_chaqueta', 385, 100, 1000, 'kPa', 1]],
  sistema: [['tiempo_standby', 10, 0, 60, 'min', 0], ['tiempo_estable_alarma', 5, 1, 60, 's', 0], ['pausa_max_esterilizacion_s', 30, 5, 120, 's', 0],
    ['espera_sellado_sin_sonda_min', 30, 10, 240, 'min', 0], ['presion_atmosferica', 75, 50, 110, 'kPa', 1, true]],
};
const ORDEN = ['puerta', 'camara_segura', 'impresion', 'drenaje', 'empaque', 'chaqueta', 'sistema'];

const PRES = { kPa: [1, 1], bar: [0.01, 3], mbar: [10, 0], psi: [0.145038, 2] };   // factor desde kPa, decimales

export function crear(ctx) {
  const p = ctx.permiso();
  const ing = ctx.rol === 'ingeniero';
  const enCiclo = () => ctx.maquina() === 'CICLO';
  let datos = leer('op_equipo', null) ?? {};
  datos = { valores: {}, unidadTemp: 'C', unidadPres: 'kPa', impresora: true, ...datos };
  const guardarDatos = () => guardar('op_equipo', datos);
  let vista = ctx.params?.vistaEquipo ?? 'raiz';
  const cuerpo = h('div', { class: 'op-eq' });
  const set = (v) => { vista = v; if (ctx.params) ctx.params.vistaEquipo = v; pintar(); };

  // ---- unidades ----
  function conv(v, mag) {
    if (mag === 'C' && datos.unidadTemp === 'F') return v * 1.8 + 32;
    if (mag === 'dC' && datos.unidadTemp === 'F') return v * 1.8;
    if (mag === 'kPa') return v * PRES[datos.unidadPres][0];
    return v;
  }
  function inv(v, mag) {
    if (mag === 'C' && datos.unidadTemp === 'F') return (v - 32) / 1.8;
    if (mag === 'dC' && datos.unidadTemp === 'F') return v / 1.8;
    if (mag === 'kPa') return v / PRES[datos.unidadPres][0];
    return v;
  }
  const unidadTxt = (mag) => (mag === 'C' || mag === 'dC' ? (datos.unidadTemp === 'F' ? '°F' : '°C') : mag === 'kPa' ? datos.unidadPres : mag);
  const dec = (mag, d) => (mag === 'kPa' ? PRES[datos.unidadPres][1] : (mag === 'C' || mag === 'dC') ? 1 : d);
  const valorDe = ([c, def]) => datos.valores[c] ?? def;

  function abrirParametro(grupo, def) {
    const [clave, defecto, min, max, mag, d, soloLectura] = def;
    const editable = p.editar && !soloLectura && !enCiclo();
    const dd = dec(mag, d);
    abrirAjuste({
      titulo: t(`parametros_equipo.${clave}`), descripcion: t(`parametros_equipo_desc.${clave}`), unidad: unidadTxt(mag),
      actual: +conv(valorDe(def), mag).toFixed(dd), defecto: +conv(defecto, mag).toFixed(dd),
      min: +conv(min, mag).toFixed(dd), max: +conv(max, mag).toFixed(dd), decimales: dd, editable,
      motivo: soloLectura ? t('opciones.equipo_atm_ayuda') : (!editable ? t(p.motivo || (enCiclo() ? 'opciones.equipo_motivo_ciclo' : 'opciones.equipo_err_solo_lectura')) : ''),
      ultima: soloLectura ? t('opciones.equipo_atm_sin_calibrar') : '',
      alGuardar: (v) => {
        const base = +inv(v, mag).toFixed(3);
        if (base < min - 1e-6 || base > max + 1e-6) return 'opciones.equipo_err_rango';
        const anterior = valorDe(def);
        datos.valores[clave] = base; guardarDatos();
        ctx.bitacora('param_sistema_cambio', { entidad: t(`parametros_equipo.${clave}`), anterior: num(anterior, d), nuevo: num(base, d) });
        pintar();
        return null;
      },
    });
  }

  function pintarRaiz() {
    cuerpo.replaceChildren(
      nota(t('opciones.equipo_guia')),
      h('div', { class: 'op-rejilla' }, ORDEN.map((g) => tarjetaSubmenu({ titulo: t(`opciones.equipo_grupos.${g}`), descripcion: t(`opciones.equipo_grupos_desc.${g}`), alToque: () => set(g) })),
        tarjetaSubmenu({ titulo: t('opciones.equipo_grupos.maquina'), descripcion: t('opciones.equipo_grupos_desc.maquina'), ancho: true, alToque: () => set('maquina') })));
  }

  function pintarGrupo(g) {
    const lista = h('div', { class: 'op-lista desplazable' }, GRUPOS[g].map((def) => {
      const [clave, defecto, min, max, mag, d] = def;
      const dd = dec(mag, d);
      const f = (v) => num(conv(v, mag), dd);
      return filaNav({ titulo: t(`parametros_equipo.${clave}`), subtitulo: t('opciones.equipo_rango_defecto', { min: f(min), max: f(max), defecto: f(defecto) }) + (unidadTxt(mag) ? ` ${unidadTxt(mag)}` : ''),
        valor: f(valorDe(def)), unidad: unidadTxt(mag), alto: 'alta', alToque: () => abrirParametro(g, def) });
    }));
    cuerpo.replaceChildren(cabeceraSub({ titulo: t(`opciones.equipo_grupos.${g}`), sub: t(`opciones.equipo_grupos_desc.${g}`), alVolver: () => set('raiz') }), lista);
  }

  function pintarMaquina() {
    const idiomaOk = ctx.rol === 'admin' || ing;
    const confirmar = (mensaje, fn) => abrirDialogoConfirmacion({ mensaje, alConfirmar: fn, alDescartar: () => pintarMaquina() });
    const selIdioma = crearSelectorSegmentos({ valor: idioma(), habilitado: idiomaOk, opciones: [{ valor: 'es', etiqueta: 'Español' }, { valor: 'en', etiqueta: 'English' }],
      alElegir: (v) => confirmar(t('opciones.equipo_idioma_confirmar', { opcion: v === 'es' ? 'Español' : 'English' }), () => { ctx.bitacora('idioma_configurado', { nuevo: v }); fijarIdioma(v); }) });
    const selTema = crearSelectorSegmentos({ valor: tema(), habilitado: idiomaOk, opciones: [{ valor: 'claro', etiqueta: t('opciones.equipo_tema_claro') }, { valor: 'oscuro', etiqueta: t('opciones.equipo_tema_oscuro') }],
      alElegir: (v) => confirmar(t('opciones.equipo_tema_confirmar', { opcion: t(`opciones.equipo_tema_${v}`) }), () => { fijarTema(v); }) });
    const puedeUnid = ing && !enCiclo();
    const selTemp = crearSelectorSegmentos({ valor: datos.unidadTemp, habilitado: puedeUnid, opciones: [{ valor: 'C', etiqueta: '°C' }, { valor: 'F', etiqueta: '°F' }],
      alElegir: (v) => confirmar(t('opciones.equipo_unidades_confirmar', { magnitud: t('opciones.equipo_magnitud_temperatura'), opcion: v === 'F' ? '°F' : '°C' }), () => { datos.unidadTemp = v; guardarDatos(); ctx.bitacora('unidades_configuradas', { nuevo: v }); pintarMaquina(); }) });
    const selPres = crearSelectorSegmentos({ valor: datos.unidadPres, habilitado: puedeUnid, opciones: Object.keys(PRES).map((u) => ({ valor: u, etiqueta: u })),
      alElegir: (v) => confirmar(t('opciones.equipo_unidades_confirmar', { magnitud: t('opciones.equipo_magnitud_presion'), opcion: v }), () => { datos.unidadPres = v; guardarDatos(); ctx.bitacora('unidades_configuradas', { nuevo: v }); pintarMaquina(); }) });
    const impresora = crearFilaInterruptor({ etiqueta: t('opciones.equipo_impresora'), detalle: t('opciones.equipo_impresora_ayuda'), marcado: datos.impresora, bloqueado: !p.editar || enCiclo(), ultima: true,
      alAlternar: (v) => { datos.impresora = v; guardarDatos(); ctx.bitacora('impresora_configurada', { nuevo: t(v ? 'opciones.equipo_si' : 'opciones.equipo_no') }); } });
    const ro = (rotulo, v) => h('div', { class: 'op-eq-ro' }, h('span', { class: 'op-eq-ro-r', text: rotulo }), h('b', { text: v }));
    const bloque = (titulo, control, motivo) => h('div', { class: 'op-eq-bloque' }, h('div', { class: 'op-eq-bloque-t', text: titulo }), control, motivo ? h('div', { class: 'op-nota', text: motivo }) : null);
    cuerpo.replaceChildren(cabeceraSub({ titulo: t('opciones.equipo_grupos.maquina'), sub: t('opciones.equipo_grupos_desc.maquina'), alVolver: () => set('raiz') }),
      h('div', { class: 'op-lista desplazable' },
        bloque(t('opciones.equipo_idioma'), selIdioma.el, idiomaOk ? '' : t('opciones.equipo_motivo_idioma_rol')),
        bloque(t('opciones.equipo_tema'), selTema.el, idiomaOk ? '' : t('opciones.equipo_motivo_tema_rol')),
        bloque(`${t('opciones.equipo_unidad_temperatura')}`, selTemp.el, puedeUnid ? '' : t(enCiclo() ? 'opciones.equipo_motivo_unidades_ciclo' : 'opciones.equipo_motivo_unidades_rol')),
        bloque(`${t('opciones.equipo_unidad_presion')}`, selPres.el, t('opciones.equipo_presion_nota')),
        h('div', { class: 'op-eq-bloque' }, impresora.el),
        ro(t('opciones.equipo_serie'), 'SN260000 (demo)'), ro(t('opciones.equipo_modelo'), 'Demo-134'), nota(t('opciones.equipo_perfil_ayuda')),
        nota(L({ es: 'Demostración: los cambios solo se guardan en este navegador.', en: 'Demo: changes are only saved in this browser.' }), 'aviso')));
  }

  function pintar() {
    if (vista === 'raiz') pintarRaiz(); else if (vista === 'maquina') pintarMaquina(); else pintarGrupo(vista);
  }
  pintar();
  return { el: cuerpo, atras() { if (vista !== 'raiz') { set('raiz'); return true; } return false; } };
}
