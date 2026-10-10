"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { abreviarDireccion } from "@/lib/freighter";
import { useBilletera } from "./ProveedorBilletera";

/** Secciones del flujo principal del MVP. */
const SECCIONES = [
  { ruta: "/", etiqueta: "Inicio" },
  { ruta: "/entrada", etiqueta: "Entrada" },
  { ruta: "/salida", etiqueta: "Salida" },
  { ruta: "/tablero", etiqueta: "Tablero" },
] as const;

/** Indicador compacto de la wallet para el encabezado. */
function ChipBilletera() {
  const { estado, conectar } = useBilletera();

  if (estado.tipo === "conectada") {
    return (
      <span
        className="rounded-full bg-emerald-50 px-3 py-1.5 font-mono text-xs text-emerald-800"
        title={estado.direccion}
      >
        {abreviarDireccion(estado.direccion)}
      </span>
    );
  }
  if (estado.tipo === "verificando") {
    return <span className="px-3 py-1.5 text-xs text-stone-500">Verificando…</span>;
  }
  if (estado.tipo === "sin_extension") {
    return <span className="px-3 py-1.5 text-xs text-stone-500">Sin Freighter</span>;
  }
  return (
    <button
      type="button"
      onClick={conectar}
      className="rounded-full border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
    >
      Conectar wallet
    </button>
  );
}

/**
 * Encabezado y navegación.
 * En celular la navegación va abajo, al alcance del pulgar; en pantallas
 * anchas sube al encabezado.
 */
export function Encabezado() {
  const rutaActual = usePathname();

  const enlaces = SECCIONES.map((seccion) => {
    const activa = rutaActual === seccion.ruta;
    return (
      <Link
        key={seccion.ruta}
        href={seccion.ruta}
        aria-current={activa ? "page" : undefined}
        className={`flex-1 px-3 py-3 text-center text-sm sm:flex-none sm:rounded-md sm:py-1.5 ${
          activa
            ? "font-semibold text-emerald-800 sm:bg-emerald-50"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        {seccion.etiqueta}
      </Link>
    );
  });

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-base font-semibold text-stone-900">
            Acopio Transparente
          </Link>
          <nav aria-label="Secciones" className="hidden gap-1 sm:flex">
            {enlaces}
          </nav>
          <ChipBilletera />
        </div>
      </header>
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-stone-200 bg-white sm:hidden"
      >
        {enlaces}
      </nav>
    </>
  );
}
