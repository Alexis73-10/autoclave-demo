// Opciones › Información del sistema (OpcionesInfoSistema.qml, solo lectura): grupos clave-valor.
// Todos los valores son de demostración (serie demo, sin datos de licencia ni de enlace reales).
import { h } from '../../../core/dom.js';
import { t, idioma } from '../../../core/i18n.js';
import { leer } from '../../../core/almacen.js';
import { VERSION_DEMO } from '../../../../version.js';
import { fechaIso } from './_comun.js';

export function crear() {
  const eq = leer('op_equipo', {}) ?? {};
  const inst = Date.now() - 120 * 86400000;
  const ciclos = 184;
  const unidades = `${eq.unidadTemp === 'F' ? '°F' : '°C'} · ${eq.unidadPres ?? 'kPa'}`;
  const grupos = [
    ['info_sistema.grupo_equipo', [
      ['rotulo_modelo', 'Demo-134'], ['rotulo_clase', t('equipo.clase_piso')], ['rotulo_capacidad', '120 L'],
      ['rotulo_tipo_carga', t('info_sistema.carga_H')], ['rotulo_serie', 'SN260000 (demo)'],
      ['rotulo_fecha_instalacion', fechaIso(inst)], ['rotulo_fuente_vapor', t('info_sistema.vapor_generator')]]],
    ['info_sistema.grupo_software', [
      ['rotulo_version_software', `${VERSION_DEMO} (demo)`], ['rotulo_firmware', t('equipo.no_disponible')],
      ['rotulo_id_modulo_es', t('equipo.no_disponible')], ['rotulo_enlace_io', 'Simulado']]],
    ['info_sistema.grupo_uso', [
      ['rotulo_ciclos_realizados', String(ciclos)], ['rotulo_proximo_mantenimiento', fechaIso(Date.now() + 70 * 86400000)],
      ['rotulo_ciclos_restantes', String(Math.max(0, 500 - ciclos))]]],
    ['info_sistema.grupo_configuracion', [
      ['rotulo_idioma', t(idioma() === 'en' ? 'info_sistema.idioma_en' : 'info_sistema.idioma_es')],
      ['rotulo_unidades', unidades], ['rotulo_impresora', t('info_sistema.impresora_lista')],
      ['rotulo_red', t('info_sistema.red_conectada')]]],
  ];
  const el = h('div', { class: 'op-info desplazable' }, grupos.map(([g, filas]) =>
    h('div', { class: 'op-grupo' }, h('div', { class: 'op-grupo-titulo', text: t(g) }),
      filas.map(([k, v]) => h('div', { class: 'op-kv fila' }, h('div', { class: 'op-kv-rotulo', text: t(`info_sistema.${k}`) }), h('div', { class: 'op-kv-valor', text: v }))))));
  return { el };
}
