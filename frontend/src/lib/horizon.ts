/**
 * Lectura de Horizon (testnet). Solo consulta, nunca escribe en la red.
 */
import { FRASE_RED_TESTNET, URL_HORIZON } from "./config";

/** Estado real de la red, leído de la raíz de Horizon. */
export interface EstadoRed {
  /** Número del último ledger cerrado. */
  ultimoLedger: number;
  /** Indica si Horizon respondió por la red de testnet. */
  esTestnet: boolean;
}

/** Confirma que un valor desconocido es un objeto con claves de texto. */
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

/**
 * Consulta el estado actual de Stellar testnet en Horizon.
 *
 * La respuesta se valida campo por campo antes de usarla: viene de la red
 * y no se asume su forma.
 * @param senal Permite cancelar la petición si el componente se desmonta.
 * @throws Error si Horizon no responde o la respuesta no tiene la forma esperada.
 */
export async function consultarEstadoRed(senal?: AbortSignal): Promise<EstadoRed> {
  const respuesta = await fetch(URL_HORIZON, {
    signal: senal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!respuesta.ok) {
    throw new Error(`Horizon respondió con estado ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();
  if (
    !esObjeto(cuerpo) ||
    typeof cuerpo.history_latest_ledger !== "number" ||
    typeof cuerpo.network_passphrase !== "string"
  ) {
    throw new Error("Horizon devolvió una respuesta con forma inesperada");
  }

  return {
    ultimoLedger: cuerpo.history_latest_ledger,
    esTestnet: cuerpo.network_passphrase === FRASE_RED_TESTNET,
  };
}
