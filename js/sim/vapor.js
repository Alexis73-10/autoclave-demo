// Vapor saturado IAPWS-IF97 región 4 y letalidad F0, transcritos del software real:
//   src/autoclave/core/runtime/steam.py  (ec. 30 Psat(T) y ec. 31 Tsat(P), tabla 34)
//   src/autoclave/core/runtime/letalidad.py  (F0, z = 10 °C, T_ref = 121,1 °C)
// T en °C y P en kPa absolutos. Puntos de control: Psat(121) = 205,04 y Psat(134) = 304,20 kPa.
// A diferencia del real (que lanza ValueError), fuera de rango devuelven null: la demo nunca
// debe romperse por un valor de la simulación.

const N = [
  0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5,
  -0.32325550322333e7, 0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6,
  -0.23855557567849, 0.65017534844798e3,
];
const T_MIN = 0.01, T_MAX = 373.946;          // °C
const P_MIN = 0.611657, P_MAX = 22064;         // kPa

/** Presión de saturación (kPa abs) para una temperatura en °C; null fuera de 0,01–373,946 °C. */
export function psat(tC) {
  if (!Number.isFinite(tC) || tC < T_MIN || tC > T_MAX) return null;
  const t = tC + 273.15;
  const v = t + N[8] / (t - N[9]);
  const A = v * v + N[0] * v + N[1];
  const B = N[2] * v * v + N[3] * v + N[4];
  const C = N[5] * v * v + N[6] * v + N[7];
  const pMPa = Math.pow((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C)), 4);
  return pMPa * 1000;
}

/** Temperatura de saturación (°C) para una presión en kPa abs; null fuera de rango o P <= 0. */
export function tsat(pkPa) {
  if (!Number.isFinite(pkPa) || pkPa < P_MIN || pkPa > P_MAX) return null;
  const b = Math.pow(pkPa / 1000, 0.25);
  const E = b * b + N[2] * b + N[5];
  const F = N[0] * b * b + N[3] * b + N[6];
  const G = N[1] * b * b + N[4] * b + N[7];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  const ts = (N[9] + D - Math.sqrt((N[9] + D) ** 2 - 4 * (N[8] + N[9] * D))) / 2;
  return ts - 273.15;
}

export const Z_F0 = 10.0;
export const T_REF_F0 = 121.1;

/** Incremento de F0 (min) para la temperatura tC sostenida dtMin minutos (letalidad.py). */
export function incrementoF0(tC, dtMin) {
  if (!Number.isFinite(tC) || !Number.isFinite(dtMin) || dtMin <= 0) return 0;
  return Math.pow(10, (tC - T_REF_F0) / Z_F0) * dtMin;
}
