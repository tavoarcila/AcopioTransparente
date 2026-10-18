/**
 * Servicio del contrato Acopio Transparente.
 *
 * Es la capa que conecta la interfaz con el contrato en testnet:
 * - Lecturas: se simulan contra el Stellar RPC. No piden wallet, no firman y
 *   no cuestan nada, por eso el tablero público funciona sin cuenta.
 * - Escrituras: se arman y simulan contra el RPC, Freighter las firma con la
 *   cuenta del administrador y se envían a la red. Se espera la confirmación
 *   y se devuelve el hash, que cualquiera puede verificar en el explorador.
 *
 * Aquí se traducen también los tipos del contrato (enums con `tag`, fechas
 * AAAAMMDD, `bigint`) a los tipos que usa la interfaz.
 */
import { AssembledTransaction, type Result } from "@stellar/stellar-sdk/contract";
import { FRASE_RED_TESTNET, ID_CONTRATO, URL_RPC } from "./config";
import {
  Client,
  type Categoria as CategoriaContrato,
  type Lote as LoteContrato,
} from "./contrato/cliente-generado";
import type { Categoria, EntradaLote, SalidaLote } from "./dominio";
import { firmarTransaccion } from "./freighter";

/** Máximo de lotes por consulta; coincide con `LIMITE_PAGINA` del contrato. */
const LOTES_POR_PAGINA = 50;

/** Etiqueta del enum `Categoria` en el contrato. */
type EtiquetaCategoria = CategoriaContrato["tag"];

/** Categoría de la interfaz → variante del enum del contrato. */
const A_CONTRATO: Record<Categoria, EtiquetaCategoria> = {
  alimentos: "Alimentos",
  agua: "Agua",
  ropa: "Ropa",
  cobijas: "Cobijas",
  higiene: "Higiene",
  medicamentos: "Medicamentos",
  otros: "Otros",
};

/** Variante del enum del contrato → categoría de la interfaz. */
const DESDE_CONTRATO = Object.fromEntries(
  Object.entries(A_CONTRATO).map(([interfaz, contrato]) => [contrato, interfaz]),
) as Record<EtiquetaCategoria, Categoria>;

/** Mensajes para cada error del contrato (`Error` en `lib.rs`). */
const MENSAJES_ERROR_CONTRATO: Record<string, string> = {
  LoteNoExiste: "No existe un lote con ese número.",
  LoteYaEntregado: "Ese lote ya tiene una salida registrada. Un lote solo se entrega una vez.",
  CantidadInvalida: "La cantidad debe estar entre 1 y 1.000.000.",
  FechaInvalida: "La fecha no existe en el calendario.",
  FechaFutura: "La fecha no puede ser posterior a hoy.",
  DestinoInvalido:
    "El destino tiene símbolos no permitidos o parece una cédula o un teléfono.",
  SalidaAntesDeEntrada: "La fecha de salida no puede ser anterior a la fecha de entrada del lote.",
};

/** Salida de un lote ya entregado, con tipos de la interfaz. */
export interface SalidaRegistrada {
  destino: string;
  /** Fecha de entrega declarada, AAAA-MM-DD. */
  fecha: string;
  /** Momento real en que la red aceptó el registro. */
  registradaEn: Date;
}

/** Lote leído del contrato, con tipos de la interfaz. */
export interface LoteRegistrado {
  id: number;
  categoria: Categoria;
  cantidad: number;
  /** Fecha de recepción declarada, AAAA-MM-DD. */
  fechaEntrada: string;
  /** Momento real en que la red aceptó la entrada. */
  registradaEn: Date;
  /** `null` mientras el lote siga pendiente de entrega. */
  salida: SalidaRegistrada | null;
}

/** Resultado de enviar un registro a la red. */
export type ResultadoEnvio =
  | { ok: true; hash: string; idLote: number }
  | { ok: false; mensaje: string };

/** Momentos del envío, para que la interfaz muestre qué está pasando. */
export interface AvisosEnvio {
  /** Freighter devolvió la firma; empieza la espera de confirmación en la red. */
  alFirmar?: () => void;
}

/**
 * Convierte "AAAA-MM-DD" en el entero AAAAMMDD que espera el contrato.
 * @example fechaAContrato("2026-10-17") // 20261017
 */
export function fechaAContrato(fecha: string): number {
  return Number(fecha.replaceAll("-", ""));
}

/**
 * Convierte el entero AAAAMMDD del contrato en "AAAA-MM-DD".
 * @example fechaDesdeContrato(20261017) // "2026-10-17"
 */
export function fechaDesdeContrato(fecha: number): string {
  const texto = String(fecha).padStart(8, "0");
  return `${texto.slice(0, 4)}-${texto.slice(4, 6)}-${texto.slice(6, 8)}`;
}

/** Convierte segundos Unix (como `bigint`) en fecha de JavaScript. */
function segundosAFecha(segundos: bigint): Date {
  return new Date(Number(segundos) * 1000);
}

/** Traduce un lote del formato del contrato al de la interfaz. */
function convertirLote(lote: LoteContrato): LoteRegistrado {
  const entrega = lote.entrega;
  return {
    id: lote.id,
    categoria: DESDE_CONTRATO[lote.categoria.tag],
    cantidad: lote.cantidad,
    fechaEntrada: fechaDesdeContrato(lote.fecha_entrada),
    registradaEn: segundosAFecha(lote.registrada_en),
    salida:
      entrega.tag === "Entregada"
        ? {
            destino: entrega.values[0].destino,
            fecha: fechaDesdeContrato(entrega.values[0].fecha),
            registradaEn: segundosAFecha(entrega.values[0].registrada_en),
          }
        : null,
  };
}

/**
 * Crea el cliente del contrato.
 * @param direccion Cuenta que firmará. Sin ella, el cliente solo sirve para leer.
 */
function crearCliente(direccion?: string): Client {
  return new Client({
    contractId: ID_CONTRATO,
    networkPassphrase: FRASE_RED_TESTNET,
    rpcUrl: URL_RPC,
    publicKey: direccion,
  });
}

/**
 * Convierte cualquier error del envío en un mensaje claro para el voluntario.
 * El detalle técnico va a la consola para depurar.
 */
function mensajeDeError(error: unknown): string {
  console.error("Error en la operación con el contrato:", error);
  const Errores = AssembledTransaction.Errors;

  if (error instanceof Errores.UserRejected) {
    return "Cancelaste la firma en Freighter. No se registró nada.";
  }
  if (error instanceof Errores.NeedsMoreSignatures) {
    return "Esta cuenta no es la administradora del centro de acopio. Conecta la cuenta correcta en Freighter.";
  }
  if (error instanceof Errores.SimulationFailed) {
    return "La red rechazó el registro al simularlo. Revisa los datos e inténtalo de nuevo.";
  }
  if (error instanceof Error && /not found|404/i.test(error.message)) {
    return "La cuenta de Freighter no existe en testnet. Fondéala con Friendbot desde la extensión.";
  }
  if (error instanceof Error && /network|fetch|timeout/i.test(error.message)) {
    return "No hubo conexión con Stellar. Revisa tu internet e inténtalo de nuevo.";
  }
  return "No se pudo completar el registro. Inténtalo de nuevo en unos segundos.";
}

/** Mensaje para un error devuelto por el contrato (`Result::Err`). */
function mensajeErrorContrato(nombre: string): string {
  return MENSAJES_ERROR_CONTRATO[nombre] ?? `El contrato rechazó el registro (${nombre}).`;
}

/**
 * Simula la invocación, la firma con Freighter, la envía y espera la confirmación.
 *
 * Primero revisa el resultado simulado: si el contrato ya lo rechaza (lote
 * inexistente, fecha inválida…), no se abre Freighter ni se gasta una firma.
 *
 * @param transaccion Invocación ya simulada por el cliente del contrato.
 * @param direccion Cuenta que firma.
 * @param avisos Callbacks de progreso para la interfaz.
 * @param leerId Saca el id del lote del resultado confirmado.
 */
async function firmarYEnviar<T>(
  transaccion: AssembledTransaction<Result<T>>,
  direccion: string,
  avisos: AvisosEnvio,
  leerId: (valor: T) => number,
): Promise<ResultadoEnvio> {
  const simulado = transaccion.result;
  if (simulado.isErr()) {
    return { ok: false, mensaje: mensajeErrorContrato(simulado.unwrapErr().message) };
  }

  const enviada = await transaccion.signAndSend({
    signTransaction: async (xdr, opciones) => {
      const firmada = await firmarTransaccion(xdr, direccion, opciones?.networkPassphrase);
      if (!firmada.error) avisos.alFirmar?.();
      return firmada;
    },
  });

  const hash = enviada.sendTransactionResponse?.hash;
  const confirmado = enviada.result;
  if (confirmado.isErr()) {
    return { ok: false, mensaje: mensajeErrorContrato(confirmado.unwrapErr().message) };
  }
  if (!hash) {
    return { ok: false, mensaje: "La red no devolvió el hash de la transacción." };
  }
  return { ok: true, hash, idLote: leerId(confirmado.unwrap()) };
}

/**
 * Registra la entrada de un lote en el contrato (`registrar_entrada`).
 * @param datos Entrada ya validada por `validarEntrada`.
 * @param direccion Cuenta de Freighter que firma; debe ser la administradora.
 * @returns El hash de la transacción y el número de lote asignado, o un mensaje de error.
 */
export async function registrarEntrada(
  datos: EntradaLote,
  direccion: string,
  avisos: AvisosEnvio = {},
): Promise<ResultadoEnvio> {
  try {
    const transaccion = await crearCliente(direccion).registrar_entrada({
      categoria: { tag: A_CONTRATO[datos.categoria], values: undefined },
      cantidad: datos.cantidad,
      fecha: fechaAContrato(datos.fecha),
    });
    return await firmarYEnviar(transaccion, direccion, avisos, (id: number) => id);
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
}

/**
 * Registra la salida de un lote en el contrato (`registrar_salida`).
 * @param datos Salida ya validada por `validarSalida`.
 * @param direccion Cuenta de Freighter que firma; debe ser la administradora.
 * @returns El hash de la transacción y el número de lote entregado, o un mensaje de error.
 */
export async function registrarSalida(
  datos: SalidaLote,
  direccion: string,
  avisos: AvisosEnvio = {},
): Promise<ResultadoEnvio> {
  try {
    const transaccion = await crearCliente(direccion).registrar_salida({
      id_lote: datos.idLote,
      destino: datos.destino,
      fecha: fechaAContrato(datos.fecha),
    });
    return await firmarYEnviar(transaccion, direccion, avisos, () => datos.idLote);
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
}

/** Lee la cuenta administradora del contrato (solo lectura, sin wallet). */
export async function leerAdmin(): Promise<string> {
  const transaccion = await crearCliente().admin();
  return transaccion.result;
}

/**
 * Lee todos los lotes del contrato, página por página (solo lectura, sin wallet).
 * @throws Error si el RPC no responde.
 */
export async function leerLotes(): Promise<LoteRegistrado[]> {
  const cliente = crearCliente();
  const total = (await cliente.total_lotes()).result;

  const lotes: LoteRegistrado[] = [];
  for (let desde = 1; desde <= total; desde += LOTES_POR_PAGINA) {
    const pagina = (await cliente.listar_lotes({ desde, limite: LOTES_POR_PAGINA })).result;
    lotes.push(...pagina.map(convertirLote));
  }
  return lotes;
}

/** Totales que muestra el tablero, en unidades. */
export interface Totales {
  entradas: number;
  salidas: number;
  pendientes: number;
}

/**
 * Suma unidades recibidas, entregadas y pendientes de una lista de lotes.
 * Como cada salida entrega el lote completo, pendientes = entradas − salidas.
 */
export function calcularTotales(lotes: readonly LoteRegistrado[]): Totales {
  const entradas = lotes.reduce((suma, lote) => suma + lote.cantidad, 0);
  const salidas = lotes.reduce((suma, lote) => suma + (lote.salida ? lote.cantidad : 0), 0);
  return { entradas, salidas, pendientes: entradas - salidas };
}
