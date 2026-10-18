/* eslint-disable */
// ARCHIVO GENERADO: no editar a mano.
// Cliente TypeScript del contrato, generado con `stellar contract bindings typescript`.
// Para regenerarlo después de cambiar o redesplegar el contrato: contrato/generar-cliente.sh
// Se desactiva eslint porque el generador usa @ts-ignore y estilos propios.

import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBVTVCEEHRCWCRI3AO3ELDAJJ6W6AY7IUZ57QG37SHOHFZDYN2TUCIFU",
  }
} as const


/**
 * Un lote de donaciones tal como queda guardado en la red.
 */
export interface Lote {
  /**
 * Unidades recibidas (cajas, bolsas, paquetes).
 */
cantidad: u32;
  categoria: Categoria;
  /**
 * `Pendiente` hasta que se registre la salida.
 */
entrega: Entrega;
  /**
 * Fecha de recepción declarada, en formato AAAAMMDD.
 */
fecha_entrada: u32;
  /**
 * Identificador consecutivo, empieza en 1.
 */
id: u32;
  /**
 * Momento real en que la red aceptó la entrada (segundos Unix, UTC).
 */
registrada_en: u64;
}

/**
 * Errores que devuelve el contrato. El número es el que ve el front.
 */
export const Errors = {
  /**
   * No existe un lote con ese identificador.
   */
  1: {message:"LoteNoExiste"},
  /**
   * El lote ya tiene una salida registrada.
   */
  2: {message:"LoteYaEntregado"},
  /**
   * La cantidad es 0 o supera `CANTIDAD_MAXIMA`.
   */
  3: {message:"CantidadInvalida"},
  /**
   * La fecha no existe en el calendario o no tiene formato AAAAMMDD.
   */
  4: {message:"FechaInvalida"},
  /**
   * La fecha es posterior a la fecha actual de la red.
   */
  5: {message:"FechaFutura"},
  /**
   * El destino está vacío, es muy largo, tiene símbolos no permitidos
   * o parece contener una cédula o un teléfono.
   */
  6: {message:"DestinoInvalido"},
  /**
   * La fecha de salida es anterior a la fecha de entrada del lote.
   */
  7: {message:"SalidaAntesDeEntrada"}
}


/**
 * Datos de la entrega de un lote.
 */
export interface Salida {
  /**
 * Destino general: barrio, vereda o albergue. Nunca una persona.
 */
destino: string;
  /**
 * Fecha de entrega declarada, en formato AAAAMMDD (por ejemplo 20261017).
 */
fecha: u32;
  /**
 * Momento real en que la red aceptó el registro (segundos Unix, UTC).
 */
registrada_en: u64;
}

/**
 * Estado de entrega de un lote.
 */
export type Entrega = {tag: "Pendiente", values: void} | {tag: "Entregada", values: readonly [Salida]};

/**
 * Categorías de donación que maneja un centro de acopio.
 * 
 * Es la misma lista del front (`frontend/src/lib/dominio.ts`). Al ser un
 * enum, la red rechaza cualquier categoría que no esté aquí.
 */
export type Categoria = {tag: "Alimentos", values: void} | {tag: "Agua", values: void} | {tag: "Ropa", values: void} | {tag: "Cobijas", values: void} | {tag: "Higiene", values: void} | {tag: "Medicamentos", values: void} | {tag: "Otros", values: void};



export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Devuelve la cuenta administradora del centro de acopio.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a total_lotes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Devuelve cuántos lotes se han registrado (también es el último id).
   */
  total_lotes: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a listar_lotes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Lista lotes por páginas, en orden de id, para armar el tablero público.
   * 
   * # Argumentos
   * * `desde` - primer id a incluir (los ids empiezan en 1; 0 se trata como 1).
   * * `limite` - cuántos lotes devolver; se recorta a `LIMITE_PAGINA`.
   */
  listar_lotes: ({desde, limite}: {desde: u32, limite: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Lote>>>

  /**
   * Construct and simulate a obtener_lote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Devuelve un lote por su identificador.
   * 
   * # Errores
   * `LoteNoExiste`.
   */
  obtener_lote: ({id_lote}: {id_lote: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Lote>>>

  /**
   * Construct and simulate a registrar_salida transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registra la entrega de un lote existente, enlazada a su entrada por `id_lote`.
   * 
   * Exige la firma del administrador. Un lote solo se puede entregar una vez.
   * 
   * # Argumentos
   * * `id_lote` - identificador que devolvió `registrar_entrada`.
   * * `destino` - barrio, vereda o albergue. Nunca el nombre ni la cédula de una persona.
   * * `fecha` - fecha de entrega en formato AAAAMMDD, no futura ni anterior a la entrada.
   * 
   * # Errores
   * `LoteNoExiste`, `LoteYaEntregado`, `DestinoInvalido`, `FechaInvalida`,
   * `FechaFutura`, `SalidaAntesDeEntrada`.
   */
  registrar_salida: ({id_lote, destino, fecha}: {id_lote: u32, destino: string, fecha: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a registrar_entrada transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registra la entrada de un lote nuevo y devuelve su identificador.
   * 
   * Exige la firma del administrador.
   * 
   * # Argumentos
   * * `categoria` - tipo de donación.
   * * `cantidad` - unidades recibidas, entre 1 y `CANTIDAD_MAXIMA`.
   * * `fecha` - fecha de recepción en formato AAAAMMDD, no futura.
   * 
   * # Errores
   * `CantidadInvalida`, `FechaInvalida`, `FechaFutura`.
   */
  registrar_entrada: ({categoria, cantidad, fecha}: {categoria: Categoria, cantidad: u32, fecha: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAADhVbiBsb3RlIGRlIGRvbmFjaW9uZXMgdGFsIGNvbW8gcXVlZGEgZ3VhcmRhZG8gZW4gbGEgcmVkLgAAAAAAAAAETG90ZQAAAAYAAAAtVW5pZGFkZXMgcmVjaWJpZGFzIChjYWphcywgYm9sc2FzLCBwYXF1ZXRlcykuAAAAAAAACGNhbnRpZGFkAAAABAAAAAAAAAAJY2F0ZWdvcmlhAAAAAAAH0AAAAAlDYXRlZ29yaWEAAAAAAAAsYFBlbmRpZW50ZWAgaGFzdGEgcXVlIHNlIHJlZ2lzdHJlIGxhIHNhbGlkYS4AAAAHZW50cmVnYQAAAAfQAAAAB0VudHJlZ2EAAAAAM0ZlY2hhIGRlIHJlY2VwY2nDs24gZGVjbGFyYWRhLCBlbiBmb3JtYXRvIEFBQUFNTURELgAAAAANZmVjaGFfZW50cmFkYQAAAAAAAAQAAAAoSWRlbnRpZmljYWRvciBjb25zZWN1dGl2bywgZW1waWV6YSBlbiAxLgAAAAJpZAAAAAAABAAAAENNb21lbnRvIHJlYWwgZW4gcXVlIGxhIHJlZCBhY2VwdMOzIGxhIGVudHJhZGEgKHNlZ3VuZG9zIFVuaXgsIFVUQykuAAAAAA1yZWdpc3RyYWRhX2VuAAAAAAAABg==",
        "AAAABAAAAENFcnJvcmVzIHF1ZSBkZXZ1ZWx2ZSBlbCBjb250cmF0by4gRWwgbsO6bWVybyBlcyBlbCBxdWUgdmUgZWwgZnJvbnQuAAAAAAAAAAAFRXJyb3IAAAAAAAAHAAAAKE5vIGV4aXN0ZSB1biBsb3RlIGNvbiBlc2UgaWRlbnRpZmljYWRvci4AAAAMTG90ZU5vRXhpc3RlAAAAAQAAACdFbCBsb3RlIHlhIHRpZW5lIHVuYSBzYWxpZGEgcmVnaXN0cmFkYS4AAAAAD0xvdGVZYUVudHJlZ2FkbwAAAAACAAAALExhIGNhbnRpZGFkIGVzIDAgbyBzdXBlcmEgYENBTlRJREFEX01BWElNQWAuAAAAEENhbnRpZGFkSW52YWxpZGEAAAADAAAAQExhIGZlY2hhIG5vIGV4aXN0ZSBlbiBlbCBjYWxlbmRhcmlvIG8gbm8gdGllbmUgZm9ybWF0byBBQUFBTU1ERC4AAAANRmVjaGFJbnZhbGlkYQAAAAAAAAQAAAAyTGEgZmVjaGEgZXMgcG9zdGVyaW9yIGEgbGEgZmVjaGEgYWN0dWFsIGRlIGxhIHJlZC4AAAAAAAtGZWNoYUZ1dHVyYQAAAAAFAAAAckVsIGRlc3Rpbm8gZXN0w6EgdmFjw61vLCBlcyBtdXkgbGFyZ28sIHRpZW5lIHPDrW1ib2xvcyBubyBwZXJtaXRpZG9zCm8gcGFyZWNlIGNvbnRlbmVyIHVuYSBjw6lkdWxhIG8gdW4gdGVsw6lmb25vLgAAAAAAD0Rlc3Rpbm9JbnZhbGlkbwAAAAAGAAAAPkxhIGZlY2hhIGRlIHNhbGlkYSBlcyBhbnRlcmlvciBhIGxhIGZlY2hhIGRlIGVudHJhZGEgZGVsIGxvdGUuAAAAAAAUU2FsaWRhQW50ZXNEZUVudHJhZGEAAAAH",
        "AAAAAQAAAB9EYXRvcyBkZSBsYSBlbnRyZWdhIGRlIHVuIGxvdGUuAAAAAAAAAAAGU2FsaWRhAAAAAAADAAAAPkRlc3Rpbm8gZ2VuZXJhbDogYmFycmlvLCB2ZXJlZGEgbyBhbGJlcmd1ZS4gTnVuY2EgdW5hIHBlcnNvbmEuAAAAAAAHZGVzdGlubwAAAAAQAAAAR0ZlY2hhIGRlIGVudHJlZ2EgZGVjbGFyYWRhLCBlbiBmb3JtYXRvIEFBQUFNTUREIChwb3IgZWplbXBsbyAyMDI2MTAxNykuAAAAAAVmZWNoYQAAAAAAAAQAAABETW9tZW50byByZWFsIGVuIHF1ZSBsYSByZWQgYWNlcHTDsyBlbCByZWdpc3RybyAoc2VndW5kb3MgVW5peCwgVVRDKS4AAAANcmVnaXN0cmFkYV9lbgAAAAAAAAY=",
        "AAAAAgAAAB1Fc3RhZG8gZGUgZW50cmVnYSBkZSB1biBsb3RlLgAAAAAAAAAAAAAHRW50cmVnYQAAAAACAAAAAAAAACVFbCBsb3RlIHNpZ3VlIGVuIGVsIGNlbnRybyBkZSBhY29waW8uAAAAAAAACVBlbmRpZW50ZQAAAAAAAAEAAAAvRWwgbG90ZSB5YSBzYWxpw7M7IHRyYWUgbG9zIGRhdG9zIGRlIGxhIHNhbGlkYS4AAAAACUVudHJlZ2FkYQAAAAAAAAEAAAfQAAAABlNhbGlkYQAA",
        "AAAAAgAAAL5DYXRlZ29yw61hcyBkZSBkb25hY2nDs24gcXVlIG1hbmVqYSB1biBjZW50cm8gZGUgYWNvcGlvLgoKRXMgbGEgbWlzbWEgbGlzdGEgZGVsIGZyb250IChgZnJvbnRlbmQvc3JjL2xpYi9kb21pbmlvLnRzYCkuIEFsIHNlciB1bgplbnVtLCBsYSByZWQgcmVjaGF6YSBjdWFscXVpZXIgY2F0ZWdvcsOtYSBxdWUgbm8gZXN0w6kgYXF1w60uAAAAAAAAAAAACUNhdGVnb3JpYQAAAAAAAAcAAAAAAAAAAAAAAAlBbGltZW50b3MAAAAAAAAAAAAAAAAAAARBZ3VhAAAAAAAAAAAAAAAEUm9wYQAAAAAAAAAAAAAAB0NvYmlqYXMAAAAAAAAAAAAAAAAHSGlnaWVuZQAAAAAAAAAAAAAAAAxNZWRpY2FtZW50b3MAAAAAAAAAAAAAAAVPdHJvcwAAAA==",
        "AAAABQAAAC5FdmVudG8gcXVlIHNlIHB1YmxpY2EgYWwgcmVnaXN0cmFyIHVuYSBzYWxpZGEuAAAAAAAAAAAAEFNhbGlkYVJlZ2lzdHJhZGEAAAABAAAAEXNhbGlkYV9yZWdpc3RyYWRhAAAAAAAAAwAAAAAAAAAHaWRfbG90ZQAAAAAEAAAAAQAAAAAAAAAHZGVzdGlubwAAAAAQAAAAAAAAAAAAAAAFZmVjaGEAAAAAAAAEAAAAAAAAAAI=",
        "AAAABQAAAFJFdmVudG8gcXVlIHNlIHB1YmxpY2EgYWwgcmVnaXN0cmFyIHVuYSBlbnRyYWRhLiBMbyB2ZSBjdWFscXVpZXJhIGVuIGVsIGV4cGxvcmFkb3IuAAAAAAAAAAAAEUVudHJhZGFSZWdpc3RyYWRhAAAAAAAAAQAAABJlbnRyYWRhX3JlZ2lzdHJhZGEAAAAAAAQAAAAAAAAAB2lkX2xvdGUAAAAABAAAAAEAAAAAAAAACWNhdGVnb3JpYQAAAAAAB9AAAAAJQ2F0ZWdvcmlhAAAAAAAAAAAAAAAAAAAIY2FudGlkYWQAAAAEAAAAAAAAAAAAAAAFZmVjaGEAAAAAAAAEAAAAAAAAAAI=",
        "AAAAAAAAADdEZXZ1ZWx2ZSBsYSBjdWVudGEgYWRtaW5pc3RyYWRvcmEgZGVsIGNlbnRybyBkZSBhY29waW8uAAAAAAVhZG1pbgAAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAEZEZXZ1ZWx2ZSBjdcOhbnRvcyBsb3RlcyBzZSBoYW4gcmVnaXN0cmFkbyAodGFtYmnDqW4gZXMgZWwgw7psdGltbyBpZCkuAAAAAAALdG90YWxfbG90ZXMAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAOdMaXN0YSBsb3RlcyBwb3IgcMOhZ2luYXMsIGVuIG9yZGVuIGRlIGlkLCBwYXJhIGFybWFyIGVsIHRhYmxlcm8gcMO6YmxpY28uCgojIEFyZ3VtZW50b3MKKiBgZGVzZGVgIC0gcHJpbWVyIGlkIGEgaW5jbHVpciAobG9zIGlkcyBlbXBpZXphbiBlbiAxOyAwIHNlIHRyYXRhIGNvbW8gMSkuCiogYGxpbWl0ZWAgLSBjdcOhbnRvcyBsb3RlcyBkZXZvbHZlcjsgc2UgcmVjb3J0YSBhIGBMSU1JVEVfUEFHSU5BYC4AAAAADGxpc3Rhcl9sb3RlcwAAAAIAAAAAAAAABWRlc2RlAAAAAAAABAAAAAAAAAAGbGltaXRlAAAAAAAEAAAAAQAAA+oAAAfQAAAABExvdGU=",
        "AAAAAAAAAEFEZXZ1ZWx2ZSB1biBsb3RlIHBvciBzdSBpZGVudGlmaWNhZG9yLgoKIyBFcnJvcmVzCmBMb3RlTm9FeGlzdGVgLgAAAAAAAAxvYnRlbmVyX2xvdGUAAAABAAAAAAAAAAdpZF9sb3RlAAAAAAQAAAABAAAD6QAAB9AAAAAETG90ZQAAAAM=",
        "AAAAAAAAAIlTZSBlamVjdXRhIHVuYSBzb2xhIHZleiwgYWwgZGVzcGxlZ2FyIGVsIGNvbnRyYXRvLgoKIyBBcmd1bWVudG9zCiogYGFkbWluYCAtIGN1ZW50YSBkZWwgY2VudHJvIGRlIGFjb3BpbywgbGEgw7puaWNhIHF1ZSBwb2Ryw6EgcmVnaXN0cmFyLgAAAAAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAgxSZWdpc3RyYSBsYSBlbnRyZWdhIGRlIHVuIGxvdGUgZXhpc3RlbnRlLCBlbmxhemFkYSBhIHN1IGVudHJhZGEgcG9yIGBpZF9sb3RlYC4KCkV4aWdlIGxhIGZpcm1hIGRlbCBhZG1pbmlzdHJhZG9yLiBVbiBsb3RlIHNvbG8gc2UgcHVlZGUgZW50cmVnYXIgdW5hIHZlei4KCiMgQXJndW1lbnRvcwoqIGBpZF9sb3RlYCAtIGlkZW50aWZpY2Fkb3IgcXVlIGRldm9sdmnDsyBgcmVnaXN0cmFyX2VudHJhZGFgLgoqIGBkZXN0aW5vYCAtIGJhcnJpbywgdmVyZWRhIG8gYWxiZXJndWUuIE51bmNhIGVsIG5vbWJyZSBuaSBsYSBjw6lkdWxhIGRlIHVuYSBwZXJzb25hLgoqIGBmZWNoYWAgLSBmZWNoYSBkZSBlbnRyZWdhIGVuIGZvcm1hdG8gQUFBQU1NREQsIG5vIGZ1dHVyYSBuaSBhbnRlcmlvciBhIGxhIGVudHJhZGEuCgojIEVycm9yZXMKYExvdGVOb0V4aXN0ZWAsIGBMb3RlWWFFbnRyZWdhZG9gLCBgRGVzdGlub0ludmFsaWRvYCwgYEZlY2hhSW52YWxpZGFgLApgRmVjaGFGdXR1cmFgLCBgU2FsaWRhQW50ZXNEZUVudHJhZGFgLgAAABByZWdpc3RyYXJfc2FsaWRhAAAAAwAAAAAAAAAHaWRfbG90ZQAAAAAEAAAAAAAAAAdkZXN0aW5vAAAAABAAAAAAAAAABWZlY2hhAAAAAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAVRSZWdpc3RyYSBsYSBlbnRyYWRhIGRlIHVuIGxvdGUgbnVldm8geSBkZXZ1ZWx2ZSBzdSBpZGVudGlmaWNhZG9yLgoKRXhpZ2UgbGEgZmlybWEgZGVsIGFkbWluaXN0cmFkb3IuCgojIEFyZ3VtZW50b3MKKiBgY2F0ZWdvcmlhYCAtIHRpcG8gZGUgZG9uYWNpw7NuLgoqIGBjYW50aWRhZGAgLSB1bmlkYWRlcyByZWNpYmlkYXMsIGVudHJlIDEgeSBgQ0FOVElEQURfTUFYSU1BYC4KKiBgZmVjaGFgIC0gZmVjaGEgZGUgcmVjZXBjacOzbiBlbiBmb3JtYXRvIEFBQUFNTURELCBubyBmdXR1cmEuCgojIEVycm9yZXMKYENhbnRpZGFkSW52YWxpZGFgLCBgRmVjaGFJbnZhbGlkYWAsIGBGZWNoYUZ1dHVyYWAuAAAAEXJlZ2lzdHJhcl9lbnRyYWRhAAAAAAAAAwAAAAAAAAAJY2F0ZWdvcmlhAAAAAAAH0AAAAAlDYXRlZ29yaWEAAAAAAAAAAAAACGNhbnRpZGFkAAAABAAAAAAAAAAFZmVjaGEAAAAAAAAEAAAAAQAAA+kAAAAEAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        total_lotes: this.txFromJSON<u32>,
        listar_lotes: this.txFromJSON<Array<Lote>>,
        obtener_lote: this.txFromJSON<Result<Lote>>,
        registrar_salida: this.txFromJSON<Result<void>>,
        registrar_entrada: this.txFromJSON<Result<u32>>
  }
}