/**
 * Configuración de red del proyecto.
 *
 * Acopio Transparente trabaja únicamente contra Stellar testnet.
 * Aquí no va ninguna llave privada: solo direcciones y valores públicos.
 */

/** URL base de Horizon en testnet (API pública de solo lectura). */
export const URL_HORIZON = "https://horizon-testnet.stellar.org";

/** Nombre de red que reporta Freighter cuando está en testnet. */
export const RED_ESPERADA = "TESTNET";

/** Frase de red de testnet. Sirve para confirmar que Horizon responde por la red correcta. */
export const FRASE_RED_TESTNET = "Test SDF Network ; September 2015";

/**
 * Identificador del contrato Soroban desplegado en testnet.
 *
 * Se lee de la variable pública `NEXT_PUBLIC_CONTRACT_ID`. Mientras el contrato
 * no esté desplegado (semana 4 del bootcamp) queda en `null` y la interfaz
 * lo informa en vez de mostrar datos inventados.
 */
export const ID_CONTRATO: string | null =
  process.env.NEXT_PUBLIC_CONTRACT_ID?.trim() || null;
