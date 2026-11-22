// Desplegable.qml: botón con el valor vigente y chevron; al tocarlo abre una lista modal.
// crearDesplegable({opciones:[{valor, texto, aviso?}], valor, tituloLista, rotulo, textoSinValor, habilitado=true, alElegir(valor)})
//   -> { el, actualizar(datos), abrir(), cerrar() }
import { h, iconoMono } from '../../core/dom.js';
import { abrirModal } from '../../core/capas.js';

export function crearDesplegable(op = {}) {
  const o = { opciones: [], valor: undefined, tituloLista: '', rotulo: '', textoSinValor: '', habilitado: true, ...op };
  let cierra = null;
  const rotulo = h('div', { class: 'dd-rotulo' });
  const texto = h('div', { class: 'dd-texto' });
  const chev = h('span', { class: 'dd-chev' });
  const el = h('div', { class: 'dd', onpointerup: () => abrir() }, h('div', { class: 'dd-col' }, rotulo, texto), chev);

  function vigente() { return o.opciones.find((x) => x.valor === o.valor) ?? null; }
  function pintar() {
    const v = vigente();
    rotulo.textContent = o.rotulo; rotulo.style.display = o.rotulo ? '' : 'none';
    texto.textContent = v ? v.texto + (v.aviso ? ` ${v.aviso}` : '') : o.textoSinValor;
    chev.replaceChildren(iconoMono(cierra ? 'chevron_arriba' : 'chevron_abajo', { tam: 36, color: 'var(--c-texto-negro)' }));
    el.classList.toggle('inactivo', !o.habilitado);
    el.classList.toggle('abierto', !!cierra);
    el.classList.toggle('alto', !!o.rotulo);
  }
  function abrir() {
    if (!o.habilitado || !o.opciones.length || cierra) return;
    const lista = h('div', { class: 'dd-lista desplazable' }, o.opciones.map((x) =>
      h('button', { class: `dd-fila${x.valor === o.valor ? ' vigente' : ''}`, type: 'button',
        onclick: () => { cerrar(); o.alElegir?.(x.valor); } },
        h('span', { text: x.texto + (x.aviso ? ` ${x.aviso}` : '') }))));
    const tarjeta = h('div', { class: 'dd-tarjeta' }, o.tituloLista ? h('div', { class: 'dd-titulo', text: o.tituloLista }) : null, lista);
    cierra = abrirModal(tarjeta, { cerrarAlTocarVelo: true, alCerrar: () => { cierra = null; pintar(); } });
    pintar();
  }
  function cerrar() { cierra?.(); }
  pintar();
  return { el, actualizar(datos) { Object.assign(o, datos); pintar(); }, abrir, cerrar };
}
