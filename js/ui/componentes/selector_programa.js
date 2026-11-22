// Selector de ciclo de Preciclo (VentanaFlotante «Seleccionar ciclo» de
// PantallaPreciclo.qml, B6/D8-5.1): lista de los programas habilitados, filas de 124
// (radio 16, fondoSutil; la seleccionada seleccionSutil con borde 3 azul): número 54
// Bold, nombre 30 SemiBold y «T °C · t min» 22 con «• Más usado» en los 3 más usados.
// Si hoy no se puede cambiar, la ventana se abre igual con el motivo en rojo y la
// lista inactiva (nunca deja de responder en silencio).
import { h } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { sim } from '../../sim/motor.js';
import { abrirVentanaFlotante } from './ventana_flotante.js';
import { param, fG, dos } from './_ciclo_util.js';

/** Clave i18n del motivo por el que hoy no se puede cambiar de programa ('' = se puede). */
export function motivoNoTocable(e = sim.estado) {
  const m = e?.maquina || '';
  if (m === 'CICLO') return 'selector_ciclo.motivo_ciclo_en_curso';
  if (e?.paro?.activo === true || e?.paroActivo || e?.paro === true) return 'selector_ciclo.motivo_paro';
  if (e?.modoPrueba) return 'selector_ciclo.motivo_modo_prueba';
  if (!['PREPARACION', 'PREPARADO', 'FALLA'].includes(m)) return 'selector_ciclo.motivo_estado';
  return '';
}

let masUsados = null;   // ids de los 3 programas con más ciclos en el historial
async function cargarMasUsados() {
  try {
    const hist = await import('../../sim/historial.js');
    const cuenta = {};
    for (const r of hist.listar?.() || []) cuenta[r.programaId] = (cuenta[r.programaId] || 0) + 1;
    masUsados = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  } catch { masUsados = []; }
}

/** abrirSelectorPrograma({alElegir(id)}) -> { cerrar() } */
export function abrirSelectorPrograma({ alElegir = null } = {}) {
  const motivo = motivoNoTocable();
  const aviso = h('div', { class: 'fc-sp-aviso', text: motivo ? t(motivo) : '' });
  if (!motivo) aviso.classList.add('oculto');
  const lista = h('div', { class: 'fc-sp-lista desplazable' });
  const pintar = () => {
    const sel = sim.estado?.programaId;
    const progs = (sim.programas() || []).filter((p) => p.habilitado !== false);
    lista.replaceChildren(...progs.map((p) => {
      const temp = param(p, 'esterilizacion', 'temperatura_esterilizacion');
      const tiempo = param(p, 'esterilizacion', 'tiempo_esterilizacion');
      const linea = `${fG(temp)} ${t('unidades.temperatura')} · ${fG(tiempo)} ${t('unidades.tiempo')}`
        + ((masUsados || []).includes(p.id) ? `   • ${t('selector_ciclo.mas_usado')}` : '');
      const fila = h('button', { class: `fc-sp-fila${p.id === sel ? ' sel' : ''}${motivo ? ' inactiva' : ''}` },
        h('span', { class: 'fc-sp-num', text: dos(p.numero ?? '') }),
        h('span', { class: 'fc-sp-col' },
          h('span', { class: 'fc-sp-nombre', text: p.nombre ?? '' }),
          h('span', { class: 'fc-sp-param', text: linea })));
      if (!motivo) fila.addEventListener('click', () => {
        sim.seleccionarPrograma(p.id);
        alElegir?.(p.id);
        v.cerrar();
      });
      return fila;
    }));
  };
  const v = abrirVentanaFlotante({ titulo: t('selector_ciclo.titulo'), altoTarjeta: 1100,
    contenido: h('div', { class: 'fc-sp-contenido' }, aviso, lista) });
  pintar();
  if (masUsados === null) cargarMasUsados().then(pintar);
  return { cerrar: v.cerrar };
}
