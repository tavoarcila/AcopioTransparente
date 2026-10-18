/**
 * Acceso a la wallet Freighter.
 *
 * Envuelve la API de la extensión para que el resto de la interfaz trabaje
 * con un único tipo de estado. Freighter solo entrega la dirección pública:
 * la llave privada nunca sale de la extensión ni pasa por esta aplicación.
 */
import {
  getAddress,
  getNetwork,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { FRASE_RED_TESTNET } from "./config";

/** Respuesta de firma en el formato que espera el cliente del contrato. */
export interface TransaccionFirmada {
  signedTxXdr: string;
  signerAddress?: string;
  error?: { message: string; code: number };
}

/**
 * Pide a Freighter que firme una transacción.
 *
 * Freighter muestra al usuario qué función del contrato se invoca y con qué
 * datos antes de firmar. La llave privada nunca sale de la extensión: aquí
 * solo entra la transacción y sale firmada.
 *
 * @param xdr Transacción ya simulada, en XDR base64.
 * @param direccion Cuenta que debe firmar.
 * @param fraseRed Red de la transacción; por defecto testnet.
 */
export async function firmarTransaccion(
  xdr: string,
  direccion: string,
  fraseRed: string = FRASE_RED_TESTNET,
): Promise<TransaccionFirmada> {
  const respuesta = await signTransaction(xdr, {
    networkPassphrase: fraseRed,
    address: direccion,
  });
  if (respuesta.error) {
    return {
      signedTxXdr: "",
      error: {
        message: respuesta.error.message ?? "Freighter no firmó la transacción.",
        // -4 es el código con el que Freighter indica que el usuario rechazó.
        code: respuesta.error.code ?? -1,
      },
    };
  }
  return { signedTxXdr: respuesta.signedTxXdr, signerAddress: respuesta.signerAddress };
}

/** Estado de la wallet tal como lo necesita la interfaz. */
export type EstadoBilletera =
  | { tipo: "verificando" }
  | { tipo: "sin_extension" }
  | { tipo: "desconectada"; error?: string }
  | { tipo: "conectada"; direccion: string; red: string };

/**
 * Lee la red activa en Freighter y arma el estado "conectada".
 * @param direccion Dirección pública ya autorizada por el usuario.
 */
async function armarEstadoConectado(direccion: string): Promise<EstadoBilletera> {
  const red = await getNetwork();
  if (red.error) {
    return { tipo: "desconectada", error: "No se pudo leer la red de Freighter." };
  }
  return { tipo: "conectada", direccion, red: red.network };
}

/**
 * Consulta el estado actual sin abrir ninguna ventana de Freighter.
 * Se usa al cargar la página para recuperar una conexión ya autorizada.
 */
export async function consultarBilletera(): Promise<EstadoBilletera> {
  try {
    const extension = await isConnected();
    if (extension.error || !extension.isConnected) return { tipo: "sin_extension" };

    const permiso = await isAllowed();
    if (permiso.error || !permiso.isAllowed) return { tipo: "desconectada" };

    const cuenta = await getAddress();
    if (cuenta.error || !cuenta.address) return { tipo: "desconectada" };

    return await armarEstadoConectado(cuenta.address);
  } catch (error) {
    console.error("Error consultando Freighter:", error);
    return { tipo: "desconectada", error: "No se pudo consultar Freighter." };
  }
}

/**
 * Pide al usuario autorizar la aplicación en Freighter.
 * Abre la ventana de la extensión, por eso solo se llama desde un clic.
 */
export async function conectarBilletera(): Promise<EstadoBilletera> {
  try {
    const extension = await isConnected();
    if (extension.error || !extension.isConnected) return { tipo: "sin_extension" };

    const acceso = await requestAccess();
    if (acceso.error || !acceso.address) {
      return {
        tipo: "desconectada",
        error: "Freighter no autorizó la conexión. Inténtalo de nuevo.",
      };
    }
    return await armarEstadoConectado(acceso.address);
  } catch (error) {
    console.error("Error conectando Freighter:", error);
    return { tipo: "desconectada", error: "No se pudo conectar con Freighter." };
  }
}

/**
 * Acorta una dirección pública para mostrarla en pantallas pequeñas.
 * @example abreviarDireccion("GABC...WXYZ") // "GABC…WXYZ"
 */
export function abreviarDireccion(direccion: string): string {
  if (direccion.length <= 12) return direccion;
  return `${direccion.slice(0, 4)}…${direccion.slice(-4)}`;
}
