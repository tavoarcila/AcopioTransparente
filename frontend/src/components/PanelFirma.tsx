"use client";

import { ID_CONTRATO, RED_ESPERADA } from "@/lib/config";
import { abreviarDireccion } from "@/lib/freighter";
import { useBilletera } from "./ProveedorBilletera";

/** Una línea del resumen: nombre del dato y su valor ya formateado. */
export interface FilaResumen {
  etiqueta: string;
  valor: string;
}

interface PropiedadesPanelFirma {
  /** Función del contrato que recibirá el registro. */
  funcionContrato: "registrar_entrada" | "registrar_salida";
  /** Datos validados que se enviarían al contrato. */
  filas: FilaResumen[];
  /** Vuelve al formulario para corregir. */
  alEditar: () => void;
}

/** Bloque que muestra el estado de la wallet antes de firmar. */
function EstadoFirma() {
  const { estado, conectar } = useBilletera();

  if (estado.tipo === "verificando") {
    return <p className="text-sm text-stone-600">Verificando Freighter…</p>;
  }
  if (estado.tipo === "sin_extension") {
    return (
      <p className="text-sm text-stone-700">
        No se detectó Freighter en este navegador.{" "}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-800 underline"
        >
          Instalar Freighter
        </a>
      </p>
    );
  }
  if (estado.tipo === "desconectada") {
    return (
      <div className="flex flex-col gap-2">
        {estado.error && <p className="text-sm text-red-700">{estado.error}</p>}
        <button
          type="button"
          onClick={conectar}
          className="rounded-lg border border-emerald-700 px-4 py-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
        >
          Conectar Freighter
        </button>
      </div>
    );
  }
  if (estado.red !== RED_ESPERADA) {
    return (
      <p className="text-sm text-red-700">
        Freighter está en la red {estado.red}. Cámbiala a Testnet en la extensión
        y recarga la página.
      </p>
    );
  }
  return (
    <p className="text-sm text-stone-700">
      Firmará la cuenta{" "}
      <span className="font-mono" title={estado.direccion}>
        {abreviarDireccion(estado.direccion)}
      </span>{" "}
      en Testnet.
    </p>
  );
}

/**
 * Paso de confirmación de un registro.
 *
 * Muestra exactamente qué se enviará al contrato y con qué cuenta se firmará.
 * Mientras no exista contrato desplegado, el botón de firma queda deshabilitado
 * y se avisa que el registro no se guarda: la interfaz no simula escrituras.
 */
export function PanelFirma({ funcionContrato, filas, alEditar }: PropiedadesPanelFirma) {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="titulo-resumen">
      <div>
        <h2 id="titulo-resumen" className="text-lg font-semibold text-stone-900">
          Revisa antes de firmar
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Esto es lo que quedará escrito en Stellar. Después de firmar no se puede
          editar ni borrar.
        </p>
      </div>

      <dl className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-stone-600">{fila.etiqueta}</dt>
            <dd className="text-right text-sm font-medium text-stone-900">{fila.valor}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-stone-600">Función del contrato</dt>
          <dd className="font-mono text-sm text-stone-900">{funcionContrato}</dd>
        </div>
      </dl>

      <EstadoFirma />

      {!ID_CONTRATO && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El contrato todavía no está desplegado en testnet. Este registro no se
          envía ni se guarda en ninguna parte.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        {/* La firma y el envío se conectan cuando el contrato esté desplegado. */}
        <button
          type="button"
          disabled
          className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
        >
          Firmar y registrar
        </button>
        <button
          type="button"
          onClick={alEditar}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-base font-medium text-stone-800 hover:bg-stone-50"
        >
          Corregir datos
        </button>
      </div>
    </section>
  );
}
