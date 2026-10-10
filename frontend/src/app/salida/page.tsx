import type { Metadata } from "next";
import { FormularioSalida } from "./FormularioSalida";

export const metadata: Metadata = { title: "Registrar salida" };

/** Pantalla del paso 3 del flujo: el centro de acopio entrega un lote. */
export default function PaginaSalida() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Registrar salida</h1>
        <p className="mt-2 text-sm text-stone-600">
          Anota la entrega de un lote que ya tiene entrada registrada.
        </p>
      </div>
      <FormularioSalida />
    </div>
  );
}
