/**
 * Configuración de red del proyecto.
 *
 * Acopio Transparente trabaja únicamente contra Stellar testnet.
 * Aquí no va ninguna llave privada: solo direcciones y valores públicos.
 */
import { networks } from "./contrato/cliente-generado";

/** URL base de Horizon en testnet (API pública de solo lectura). */
export const URL_HORIZON = "https://horizon-testnet.stellar.org";

/**
 * URL del Stellar RPC público de testnet.
 *
 * Es el servicio que simula, envía y lee las invocaciones del contrato.
 * Horizon no puede leer el almacenamiento de un contrato Soroban; el RPC sí.
 */
export const URL_RPC = "https://soroban-testnet.stellar.org";

/** Nombre de red que reporta Freighter cuando está en testnet. */
export const RED_ESPERADA = "TESTNET";

/** Frase de red de testnet. Sirve para confirmar que Horizon responde por la red correcta. */
export const FRASE_RED_TESTNET = "Test SDF Network ; September 2015";

/**
 * Identificador del contrato Soroban desplegado en testnet.
 *
 * Por defecto es el que quedó grabado en el cliente generado al desplegar.
 * La variable pública `NEXT_PUBLIC_CONTRACT_ID` permite apuntar a otro
 * despliegue (por ejemplo, si la testnet se reinicia) sin tocar el código.
 */
export const ID_CONTRATO: string =
  process.env.NEXT_PUBLIC_CONTRACT_ID?.trim() || networks.testnet.contractId;

/** Explorador público de testnet donde cualquiera puede verificar el contrato. */
export const URL_EXPLORADOR = "https://stellar.expert/explorer/testnet";

/** Enlace al contrato en el explorador. */
export const enlaceContrato = (): string => `${URL_EXPLORADOR}/contract/${ID_CONTRATO}`;

/** Enlace a una transacción en el explorador. */
export const enlaceTransaccion = (hash: string): string => `${URL_EXPLORADOR}/tx/${hash}`;
