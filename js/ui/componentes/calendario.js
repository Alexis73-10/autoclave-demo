// Calendario.qml: modal con mes, días (lunes primero) y botones Hoy / Sin fecha / Cancelar.
// abrirCalendario({titulo, valor ('AAAA-MM-DD' o ''), permiteSinFecha=true, alElegir('AAAA-MM-DD' | ''), alCancelar})
//   -> cerrar()
import { h, iconoMono } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { abrirModal } from '../../core/capas.js';

const dos = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const partes = (f) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(f || '')); return m ? [+m[1], +m[2] - 1, +m[3]] : null; };

export function abrirCalendario({ titulo = '', valor = '', permiteSinFecha = true, alElegir, alCancelar } = {}) {
  const hoy = iso(new Date());
  const seleccion = partes(valor) ? valor : '';
  const p = partes(seleccion) || partes(hoy);
  let anio = p[0], mes = p[1];
  let cerrar = null, elegido = false;

  const nombre = h('div', { class: 'cal-mes' });
  const rejilla = h('div', { class: 'cal-rejilla' });
  const flecha = (icono, d) => h('button', { class: 'cal-flecha', type: 'button',
    onclick: () => { mes += d; if (mes < 0) { mes = 11; anio--; } if (mes > 11) { mes = 0; anio++; } pintar(); } },
    iconoMono(icono, { tam: null, clase: 'cal-flecha-ico', color: 'var(--c-texto-primario)' }));
  const elegir = (f) => { elegido = true; cerrar(); alElegir?.(f); };

  function pintar() {
    nombre.textContent = `${t(`fecha.meses_largos.${mes}`)} ${anio}`;
    const desp = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const dias = new Date(anio, mes + 1, 0).getDate();
    rejilla.replaceChildren();
    for (let i = 0; i < 42; i++) {
      const d = i - desp + 1;
      if (d < 1 || d > dias) { rejilla.append(h('div', { class: 'cal-celda vacia' })); continue; }
      const f = `${anio}-${dos(mes + 1)}-${dos(d)}`;
      rejilla.append(h('button', { class: `cal-celda cal-dia${f === seleccion ? ' sel' : ''}${f === hoy ? ' hoy' : ''}`, type: 'button',
        onclick: () => elegir(f) }, h('span', { text: String(d) })));
    }
  }
  const boton = (txt, primario, fn) => h('button', { class: `cal-boton${primario ? ' primario' : ''}`, type: 'button', text: txt, onclick: fn });
  const tarjeta = h('div', { class: 'cal-tarjeta desplazable' },
    titulo ? h('div', { class: 'cal-titulo', text: titulo }) : null,
    h('div', { class: 'cal-cabecera' }, flecha('chevron_izquierda', -1), nombre, flecha('chevron_derecha', 1)),
    h('div', { class: 'cal-semana' }, [0, 1, 2, 3, 4, 5, 6].map((i) => h('span', { text: t(`calendario.dias_cortos.${i}`) }))),
    rejilla,
    h('div', { class: 'cal-botones' },
      boton(t('calendario.hoy'), true, () => elegir(hoy)),
      permiteSinFecha ? boton(t('calendario.sin_fecha'), false, () => elegir('')) : null,
      boton(t('calendario.cancelar'), false, () => cerrar())));
  pintar();
  cerrar = abrirModal(tarjeta, { cerrarAlTocarVelo: true, alCerrar: () => { if (!elegido) alCancelar?.(); } });
  return cerrar;
}
