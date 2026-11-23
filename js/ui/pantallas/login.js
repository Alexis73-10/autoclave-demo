// Login (Pantallas/Login.qml): usuario y contraseña con el teclado en pantalla. En la demo muestra, de forma
// discreta, qué usuarios existen y el PIN. Al entrar va a Opciones. En horizontal, identidad a la izquierda
// y formulario a la derecha (CSS de sesion_ui). El campo en edición se pasa al teclado (campo) para que
// nunca quede tapado.
import { h } from '../../core/dom.js';
import { t, idioma } from '../../core/i18n.js';
import { leer, guardar } from '../../core/almacen.js';
import { iniciarSesion, PIN_DEMO } from '../../core/sesion.js';
import { abrirAlfanumerico, cerrarTeclado } from '../../core/teclado.js';
import * as router from '../../core/router.js';
import { irAPrincipal } from '../../app.js';
import { crearMarcoSesion, bloqueIdentidad, campoEntrada, botonPrincipal } from '../componentes/sesion_ui.js';

const TX_DEMO = {
  es: `Demo: admin, ingeniero o tecnico · PIN ${PIN_DEMO}`,
  en: `Demo: admin, ingeniero or tecnico · PIN ${PIN_DEMO}`,
};

export function crear() {
  const marco = crearMarcoSesion({ alAtras: () => router.pop(), alInicio: () => irAPrincipal() });
  const estado = { usuario: '', clave: '' };
  const recordado = leer('login_recordar', null);
  let recordar = recordado?.recordar === true;
  if (recordar) estado.usuario = recordado.usuario ?? '';
  let activo = '';
  let ocupado = false;

  const campoUsuario = campoEntrada({ icono: 'usuario', colorIcono: 'var(--c-texto-guia)', marcador: t('formulario.nombre_usuario'),
    alTocar: () => editar('usuario') });
  const campoClave = campoEntrada({ icono: 'candado', colorIcono: 'var(--c-icono-campo)', marcador: t('formulario.contrasena'), secreto: true,
    alTocar: () => editar('clave') });
  const casilla = h('button', { class: 'ss-recordar' },
    h('span', { class: 'ss-caja' }), h('span', { class: 'ss-caja-txt', text: t('formulario.recordar_usuario') }));
  const pintarRecordar = () => {
    const caja = casilla.querySelector('.ss-caja');
    caja.replaceChildren();
    if (recordar) caja.append(h('img', { src: 'assets/iconos/color/casilla_marcada.svg', alt: '', draggable: 'false' }));
  };
  casilla.addEventListener('click', () => { recordar = !recordar; pintarRecordar(); });
  const mensaje = h('div', { class: 'ss-mensaje oculto' });
  const ayuda = h('div', { class: 'ss-ayuda oculto', text: t('sesion.ayuda_olvido_clave') });
  const enlace = h('button', { class: 'ss-enlace', text: t('formulario.olvido_contrasena'), onclick: () => ayuda.classList.toggle('oculto') });
  const boton = botonPrincipal(t('acciones.iniciar_sesion'), () => iniciar(), 'usuario');

  const formulario = h('div', { class: 'ss-formulario' }, campoUsuario.el, campoClave.el, casilla, boton, mensaje, enlace, ayuda);
  const grilla = h('div', { class: 'ss-grilla' }, bloqueIdentidad(t('sesion.titulo_login'), t('sesion.subtitulo_login')), formulario);
  const demo = h('div', { class: 'ss-demo', text: TX_DEMO[idioma()] ?? TX_DEMO.es });
  marco.tarjeta.contenido.append(grilla, demo);

  function pintar() {
    campoUsuario.fijar(estado.usuario);
    campoClave.fijar(estado.clave);
    campoUsuario.activar(activo === 'usuario');
    campoClave.activar(activo === 'clave');
  }
  function mostrarMensaje(txt) { mensaje.textContent = txt ?? ''; mensaje.classList.toggle('oculto', !txt); }

  const CAMPOS = [{ nombre: 'usuario', clave: 'formulario.nombre_usuario', ocultar: false, max: 30, ui: campoUsuario },
    { nombre: 'clave', clave: 'formulario.contrasena', ocultar: true, max: 64, ui: campoClave }];
  function editar(nombre) {
    const i = CAMPOS.findIndex((c) => c.nombre === nombre);
    const c = CAMPOS[i];
    const siguiente = CAMPOS[i + 1]?.nombre;
    abrirAlfanumerico({ titulo: t(c.clave), valor: estado[nombre], maxLargo: c.max, oculto: c.ocultar, campo: c.ui.el,
      alEntregar: (texto) => { estado[nombre] = texto; pintar(); },
      alSiguiente: siguiente ? () => editar(siguiente) : null,
      alTerminar: () => iniciar(),
      alCerrar: () => { if (activo === nombre) { activo = ''; pintar(); } } });
    activo = nombre;
    pintar();
  }

  function iniciar() {
    if (ocupado) return;
    cerrarTeclado();
    if (!estado.usuario.trim() || !estado.clave) { mostrarMensaje(t('sesion.campos_vacios')); return; }
    const error = iniciarSesion(estado.usuario, estado.clave);
    estado.clave = '';
    pintar();
    if (error) { mostrarMensaje(t(error)); return; }
    guardar('login_recordar', { recordar, usuario: recordar ? estado.usuario : '' });
    mostrarMensaje('');
    ocupado = true;
    router.reemplazar('opciones');
  }

  pintar();
  pintarRecordar();
  return { el: marco.el, destruir() { cerrarTeclado(); marco.destruir(); } };
}
