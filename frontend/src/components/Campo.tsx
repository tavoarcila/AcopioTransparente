import type { ReactNode } from "react";

interface PropiedadesCampo {
  /** Identificador del control; enlaza la etiqueta, la ayuda y el error. */
  id: string;
  etiqueta: string;
  /** Texto corto que explica qué escribir. */
  ayuda?: string;
  /** Mensaje de validación. Si existe, el campo se marca como inválido. */
  error?: string;
  /** El control del formulario (input o select). */
  children: ReactNode;
}

/** Clases compartidas por los controles, con tamaño cómodo para dedos. */
export const CLASES_CONTROL =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 aria-[invalid=true]:border-red-600";

/**
 * Devuelve los atributos de accesibilidad que debe llevar el control de un campo.
 * @param id Identificador del control.
 * @param ayuda Si el campo muestra texto de ayuda.
 * @param error Mensaje de error actual, si lo hay.
 */
export function atributosControl(id: string, ayuda: boolean, error?: string) {
  const descripciones = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": descripciones || undefined,
  };
}

/** Campo de formulario con etiqueta, ayuda y mensaje de error. */
export function Campo({ id, etiqueta, ayuda, error, children }: PropiedadesCampo) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-800">
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-xs text-stone-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
