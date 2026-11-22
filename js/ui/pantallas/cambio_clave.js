// Cambio de contraseña (Pantallas/CambioClave.qml): contraseña actual, nueva y confirmación. En la demo
// acepta y vuelve con un aviso: no guarda ninguna contraseña.
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import { abrirAlfanumerico, cerrarTeclado } from '../../core/teclado.js';
import { aviso } from '../../core/capas.js';
import * as router from '../../core/router.js';
import { irAPrincipal } from '../../app.js';
import { crearMarcoSesion, bloqueIdentidad, campoEntrada, botonPrincipal } from '../componentes/sesion_ui.js';

// Textos propios de la demo (no existen en el software real).
const TX = {
  es: { vacios: 'Complete los tres campos', distintas: 'La confirmación no coincide con la contraseña nueva',
    listo: 'Demo: contraseña aceptada, no se guardó' },
  en: { vacios: 'Fill in the three fields', distintas: 'The confirmation does not match the new password',
    listo: 'Demo: password accepted, not saved' },
};
const tx = (k) => (TX[idioma()] ?? TX.es)[k];

/** params: {voluntario=false} */
export function crear(params = {}) {
  const marco = crearMarcoSesion({ alAtras: () => router.pop(), alInicio: () => irAPrincipal() });
  const estado = { clave_actual: '', clave_nueva: '', confirmar: '' };
  let activo = '';
  const CAMPOS = [
    { nombre: 'clave_actual', etiqueta: 'sesion.clave_actual' },
    { nombre: 'clave_nueva', etiqueta: 'sesion.clave_nueva' },
    { nombre: 'confirmar', etiqueta: 'sesion.confirmar_clave_nueva' },
  ];
  const campos = CAMPOS.map((c) => ({ ...c, ui: campoEntrada({ icono: 'candado', colorIcono: 'var(--c-icono-campo)', marcador: t(c.etiqueta),
    secreto: true, alTocar: () => editar(c.nombre) }) }));
  const mensaje = h('div', { class: 'ss-mensaje oculto' });
  const boton = botonPrincipal(t('sesion.boton_cambiar_clave'), () => cambiar());
  const formulario = h('div', { class: 'ss-formulario' }, ...campos.map((c) => c.ui.el), boton, mensaje);
  const aviso1 = params.voluntario ? t('usuarios_cuenta.aviso_voluntario') : t('sesion.aviso_cambio_obligatorio');
  marco.tarjeta.contenido.append(h('div', { class: 'ss-grilla' }, bloqueIdentidad(t('sesion.titulo_cambio_clave'), aviso1), formulario));

  function pintar() {
    for (const c of campos) { c.ui.fijar(estado[c.nombre]); c.ui.activar(activo === c.nombre); }
  }
  const mostrar = (txt) => { mensaje.textContent = txt ?? ''; mensaje.classList.toggle('oculto', !txt); };
  function editar(nombre) {
    const i = campos.findIndex((c) => c.nombre === nombre);
    const sig = campos[i + 1]?.nombre;
    abrirAlfanumerico({ titulo: t(campos[i].etiqueta), valor: estado[nombre], maxLargo: 64, oculto: true,
      alEntregar: (texto) => { estado[nombre] = texto; pintar(); },
      alSiguiente: sig ? () => editar(sig) : null,
      alCerrar: () => { if (activo === nombre) { activo = ''; pintar(); } } });
    activo = nombre;
    pintar();
  }
  function cambiar() {
    cerrarTeclado();
    if (!estado.clave_actual || !estado.clave_nueva || !estado.confirmar) return mostrar(tx('vacios'));
    if (estado.clave_nueva !== estado.confirmar) return mostrar(tx('distintas'));
    mostrar('');
    aviso(tx('listo'));
    router.pop();
    return null;
  }
  pintar();
  return { el: marco.el, destruir() { cerrarTeclado(); marco.destruir(); } };
}
