import type { Metadata } from "next";
import { ID_CONTRATO } from "@/lib/config";
import { EstadoRedTestnet } from "./EstadoRedTestnet";

export const metadata: Metadata = { title: "Tablero público" };

/** Indicadores agregados que mostrará el tablero. */
const INDICADORES = [
  { titulo: "Entradas", descripcion: "Unidades recibidas" },
  { titulo: "Salidas", descripcion: "Unidades entregadas" },
  { titulo: "Pendientes", descripcion: "Entradas menos salidas" },
] as const;

/**
 * Tablero público: paso 4 del flujo. No pide wallet ni cuenta.
 *
 * Las cifras salen únicamente de la red. Mientras no haya contrato desplegado
 * no existe ningún registro que leer, y la pantalla lo dice en vez de mostrar
 * números de ejemplo.
 */
export default function PaginaTablero() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Tablero público</h1>
        <p className="mt-2 text-sm text-stone-600">
          Cualquier persona puede consultar esta página. No necesita cuenta ni wallet.
        </p>
      </div>

      <EstadoRedTestnet />

      {!ID_CONTRATO && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Todavía no hay registros: el contrato no está desplegado en testnet.
          Cuando lo esté, aquí aparecerán las cifras leídas de la red.
        </p>
      )}

      <section aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className="text-sm font-semibold text-stone-900">
          Totales
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INDICADORES.map((indicador) => (
            <div
              key={indicador.titulo}
              className="rounded-xl border border-stone-200 bg-white px-4 py-4"
            >
              <dt className="text-sm text-stone-600">
                {indicador.titulo}
                <span className="block text-xs text-stone-500">{indicador.descripcion}</span>
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-stone-400">
                <span aria-hidden="true">—</span>
                <span className="sr-only">Sin datos</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="titulo-lotes">
        <h2 id="titulo-lotes" className="text-sm font-semibold text-stone-900">
          Lotes
        </h2>
        <p className="mt-3 rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600">
          Sin lotes registrados. Aquí se listará cada lote con su categoría,
          cantidad, fecha de entrada y si ya fue entregado.
        </p>
      </section>
    </div>
  );
}
