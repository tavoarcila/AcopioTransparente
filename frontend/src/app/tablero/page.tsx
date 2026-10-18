import type { Metadata } from "next";
import { EstadoRedTestnet } from "./EstadoRedTestnet";
import { TableroLotes } from "./TableroLotes";

export const metadata: Metadata = { title: "Tablero público" };

/**
 * Tablero público: paso 4 del flujo. No pide wallet ni cuenta.
 *
 * Las cifras salen únicamente del contrato en testnet. Si la red no
 * responde, la pantalla lo dice en vez de mostrar números de ejemplo.
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
      <TableroLotes />
    </div>
  );
}
