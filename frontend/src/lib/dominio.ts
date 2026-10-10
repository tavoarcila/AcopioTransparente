/**
 * Reglas del dominio: tipos y validaciones de los registros de entrada y salida.
 *
 * Todo lo que pase estas validaciones es lo que después viajará al contrato,
 * así que aquí se aplica la regla de datos del proyecto: a la cadena solo va
 * información agregada y pública, nunca datos personales.
 */

/** Categorías de donación que maneja un centro de acopio. */
export const CATEGORIAS = [
  { valor: "alimentos", etiqueta: "Alimentos" },
  { valor: "agua", etiqueta: "Agua" },
  { valor: "ropa", etiqueta: "Ropa" },
  { valor: "cobijas", etiqueta: "Cobijas y colchonetas" },
  { valor: "higiene", etiqueta: "Aseo e higiene" },
  { valor: "medicamentos", etiqueta: "Medicamentos" },
  { valor: "otros", etiqueta: "Otros" },
] as const;

/** Valor interno de una categoría (el que se enviará al contrato). */
export type Categoria = (typeof CATEGORIAS)[number]["valor"];

/** Datos de la entrada de un lote, ya validados. */
export interface EntradaLote {
  categoria: Categoria;
  /** Cantidad de unidades recibidas. Entero positivo. */
  cantidad: number;
  /** Fecha de recepción en formato AAAA-MM-DD. */
  fecha: string;
}

/** Datos de la salida de un lote, ya validados. */
export interface SalidaLote {
  /** Identificador del lote de entrada al que se enlaza la salida. */
  idLote: number;
  /** Destino agregado (barrio, vereda, albergue). Nunca una persona. */
  destino: string;
  /** Fecha de entrega en formato AAAA-MM-DD. */
  fecha: string;
}

/** Valores crudos de un formulario: cada campo llega como texto. */
export type CamposTexto<T> = Record<keyof T, string>;

/** Mensajes de error por campo. */
export type Errores<T> = Partial<Record<keyof T, string>>;

/** Resultado de validar un formulario: datos limpios o errores por campo. */
export type ResultadoValidacion<T> =
  | { ok: true; datos: T }
  | { ok: false; errores: Errores<T> };

/** Tope de unidades por lote, para atajar errores de digitación. */
export const CANTIDAD_MAXIMA = 1_000_000;

/** Longitud permitida para el texto de destino. */
export const DESTINO_MIN = 3;
export const DESTINO_MAX = 60;

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_ENTERO = /^\d+$/;
/** Letras (con tildes), números, espacios y puntuación básica. Bloquea etiquetas y símbolos raros. */
const PATRON_DESTINO = /^[\p{L}\p{N} .,#-]+$/u;
/** Seis o más dígitos seguidos parecen una cédula o un teléfono. */
const PATRON_DATO_PERSONAL = /\d{6,}/;

/**
 * Devuelve la fecha de hoy en hora local con formato AAAA-MM-DD.
 * Se usa hora local porque el voluntario registra con la fecha de su celular.
 */
export function fechaHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Convierte una fecha AAAA-MM-DD en texto legible, por ejemplo "8 de octubre de 2026".
 * Se formatea en UTC para que el día no cambie según la zona horaria del celular.
 */
export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

/** Indica si un valor es una de las categorías permitidas. */
function esCategoria(valor: string): valor is Categoria {
  return CATEGORIAS.some((categoria) => categoria.valor === valor);
}

/**
 * Valida una fecha de formulario: formato correcto, fecha real y no futura.
 * @returns Mensaje de error, o `null` si la fecha es válida.
 */
function validarFecha(fecha: string): string | null {
  if (!PATRON_FECHA.test(fecha)) return "Elige una fecha.";
  // Se compara ida y vuelta para descartar fechas imposibles como 2026-02-31.
  const fechaReal = new Date(`${fecha}T00:00:00Z`);
  if (
    Number.isNaN(fechaReal.getTime()) ||
    fechaReal.toISOString().slice(0, 10) !== fecha
  ) {
    return "La fecha no existe.";
  }
  if (fecha > fechaHoy()) return "La fecha no puede ser futura.";
  return null;
}

/**
 * Valida un entero positivo escrito como texto.
 * @returns El número, o `null` si no es un entero positivo dentro del tope.
 */
function leerEnteroPositivo(texto: string, maximo: number): number | null {
  const limpio = texto.trim();
  if (!PATRON_ENTERO.test(limpio)) return null;
  const numero = Number(limpio);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > maximo) return null;
  return numero;
}

/** Etiqueta legible de una categoría, para mostrarla en pantalla. */
export function etiquetaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((item) => item.valor === categoria)?.etiqueta ?? categoria;
}

/**
 * Valida el formulario de entrada de un lote.
 * @param campos Valores tal como salen del formulario.
 */
export function validarEntrada(
  campos: CamposTexto<EntradaLote>,
): ResultadoValidacion<EntradaLote> {
  const errores: Errores<EntradaLote> = {};

  if (!esCategoria(campos.categoria)) errores.categoria = "Elige una categoría.";

  const cantidad = leerEnteroPositivo(campos.cantidad, CANTIDAD_MAXIMA);
  if (cantidad === null) {
    errores.cantidad = `Escribe un número entero entre 1 y ${CANTIDAD_MAXIMA.toLocaleString("es-CO")}.`;
  }

  const errorFecha = validarFecha(campos.fecha);
  if (errorFecha) errores.fecha = errorFecha;

  if (!esCategoria(campos.categoria) || cantidad === null || errorFecha) {
    return { ok: false, errores };
  }
  return {
    ok: true,
    datos: { categoria: campos.categoria, cantidad, fecha: campos.fecha },
  };
}

/**
 * Valida el formulario de salida de un lote.
 *
 * El destino se limita a texto simple y se rechaza si parece contener una
 * cédula o un teléfono: lo que se escribe en la red es público y no se borra.
 * @param campos Valores tal como salen del formulario.
 */
export function validarSalida(
  campos: CamposTexto<SalidaLote>,
): ResultadoValidacion<SalidaLote> {
  const errores: Errores<SalidaLote> = {};

  const idLote = leerEnteroPositivo(campos.idLote, Number.MAX_SAFE_INTEGER);
  if (idLote === null) errores.idLote = "Escribe el número del lote de entrada.";

  // Se colapsan espacios repetidos para que el mismo destino no quede escrito de dos formas.
  const destino = campos.destino.trim().replace(/\s+/g, " ");
  if (destino.length < DESTINO_MIN || destino.length > DESTINO_MAX) {
    errores.destino = `Escribe entre ${DESTINO_MIN} y ${DESTINO_MAX} caracteres.`;
  } else if (!PATRON_DESTINO.test(destino)) {
    errores.destino = "Usa solo letras, números y espacios.";
  } else if (PATRON_DATO_PERSONAL.test(destino)) {
    errores.destino =
      "Parece una cédula o un teléfono. Escribe solo el barrio, vereda o albergue.";
  }

  const errorFecha = validarFecha(campos.fecha);
  if (errorFecha) errores.fecha = errorFecha;

  if (idLote === null || errores.destino || errorFecha) {
    return { ok: false, errores };
  }
  return { ok: true, datos: { idLote, destino, fecha: campos.fecha } };
}
