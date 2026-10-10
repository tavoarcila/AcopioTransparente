"use client";

import { useEffect, useState } from "react";
import { consultarEstadoRed, type EstadoRed } from "@/lib/horizon";

/** Cada cuánto se vuelve a consultar Horizon, en milisegundos. */
const INTERVALO_CONSULTA_MS = 10_000;

type Consulta =
  | { tipo: "cargando" }
  | { tipo: "lista"; red: EstadoRed }
  | { tipo: "error" };

/**
 * Muestra el estado real de Stellar testnet leído de Horizon.
 * Es la prueba visible de que el tablero lee de la red y no de datos locales.
 */
export function EstadoRedTestnet() {
  const [consulta, setConsulta] = useState<Consulta>({ tipo: "cargando" });

  useEffect(() => {
    const control = new AbortController();

    const actualizar = async () => {
      try {
        const red = await consultarEstadoRed(control.signal);
        setConsulta({ tipo: "lista", red });
      } catch (error) {
        // Al desmontar se cancela la petición; eso no es un fallo de la red.
        if (control.signal.aborted) return;
        console.error("Error consultando Horizon:", error);
        setConsulta({ tipo: "error" });
      }
    };

    actualizar();
    const temporizador = setInterval(actualizar, INTERVALO_CONSULTA_MS);
    return () => {
      control.abort();
      clearInterval(temporizador);
    };
  }, []);

  return (
    <section
      aria-labelledby="titulo-red"
      className="rounded-xl border border-stone-200 bg-white px-4 py-4"
    >
      <h2 id="titulo-red" className="text-sm font-semibold text-stone-900">
        Conexión con Stellar
      </h2>
      <div className="mt-2 text-sm text-stone-700" aria-live="polite">
        {consulta.tipo === "cargando" && <p>Consultando Horizon…</p>}
        {consulta.tipo === "error" && (
          <p className="text-red-700">
            No se pudo consultar Horizon. Revisa tu conexión; se reintenta solo.
          </p>
        )}
        {consulta.tipo === "lista" && (
          <p>
            {consulta.red.esTestnet ? "Testnet" : "Red desconocida"} · último ledger{" "}
            <span className="font-mono font-medium text-stone-900">
              #{consulta.red.ultimoLedger.toLocaleString("es-CO")}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
