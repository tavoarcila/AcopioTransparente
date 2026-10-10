import type { Metadata } from "next";
import { FormularioEntrada } from "./FormularioEntrada";

export const metadata: Metadata = { title: "Registrar entrada" };

/** Pantalla del paso 1 del flujo: el centro de acopio recibe una donación. */
export default function PaginaEntrada() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Registrar entrada</h1>
        <p className="mt-2 text-sm text-stone-600">
          Anota el lote que acaba de llegar al centro de acopio.
        </p>
      </div>
      <FormularioEntrada />
    </div>
  );
}
