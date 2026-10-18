"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { atributosControl, Campo, CLASES_CONTROL } from "@/components/Campo";
import { enlaceContrato, ID_CONTRATO } from "@/lib/config";
import { calcularTotales, leerLotes, type LoteRegistrado } from "@/lib/contrato";
import { CATEGORIAS, etiquetaCategoria, formatearFecha } from "@/lib/dominio";
import { abreviarDireccion } from "@/lib/freighter";

/** Estado de la lectura de lotes desde el contrato. */
type Consulta =
  | { tipo: "cargando" }
  | { tipo: "lista"; lotes: LoteRegistrado[]; leidoEn: Date }
  | { tipo: "error" };

/** Formatea unidades con separador de miles colombiano. */
const unidades = (valor: number): string => valor.toLocaleString("es-CO");

/** Tarjeta de un total del tablero. */
function Indicador({ titulo, descripcion, valor }: { titulo: string; descripcion: string; valor: number | null }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-4">
      <dt className="text-sm text-stone-600">
        {titulo}
        <span className="block text-xs text-stone-500">{descripcion}</span>
      </dt>
      <dd className="mt-1 text-3xl font-semibold text-stone-900">
        {valor === null ? (
          <>
            <span aria-hidden="true" className="text-stone-400">—</span>
            <span className="sr-only">Sin datos</span>
          </>
        ) : (
          unidades(valor)
        )}
      </dd>
    </div>
  );
}

/** Fila de la lista de lotes, con su estado de entrega. */
function FilaLote({ lote }: { lote: LoteRegistrado }) {
  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-stone-900">
            Lote #{lote.id} · {etiquetaCategoria(lote.categoria)}
          </p>
          <p className="text-sm text-stone-600">
            {unidades(lote.cantidad)} unidades · recibido el {formatearFecha(lote.fechaEntrada)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            lote.salida ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          {lote.salida ? "Entregado" : "Pendiente"}
        </span>
      </div>
      {lote.salida && (
        <p className="mt-2 text-sm text-stone-700">
          Entregado en <span className="font-medium">{lote.salida.destino}</span> el{" "}
          {formatearFecha(lote.salida.fecha)}
        </p>
      )}
    </li>
  );
}

/**
 * Totales, desglose por categoría y lista de lotes, leídos del contrato.
 *
 * Todo sale de la red: se consulta el contrato por Stellar RPC sin wallet ni
 * firma. Si la red no responde se dice, nunca se muestran cifras de ejemplo.
 */
export function TableroLotes() {
  const [consulta, setConsulta] = useState<Consulta>({ tipo: "cargando" });
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setConsulta((previa) => (previa.tipo === "lista" ? previa : { tipo: "cargando" }));
    try {
      const lotes = await leerLotes();
      setConsulta({ tipo: "lista", lotes, leidoEn: new Date() });
    } catch (error) {
      console.error("Error leyendo los lotes del contrato:", error);
      setConsulta({ tipo: "error" });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const lotes = useMemo(() => (consulta.tipo === "lista" ? consulta.lotes : []), [consulta]);
  const totales = consulta.tipo === "lista" ? calcularTotales(lotes) : null;

  /** Totales por categoría, solo de las categorías que tienen lotes. */
  const porCategoria = useMemo(
    () =>
      CATEGORIAS.map((categoria) => ({
        ...categoria,
        ...calcularTotales(lotes.filter((lote) => lote.categoria === categoria.valor)),
      })).filter((fila) => fila.entradas > 0),
    [lotes],
  );

  // La búsqueda acepta "7" o "#7". Solo números: nada de lo escrito se interpreta como HTML.
  const numeroBuscado = Number(busqueda.replace("#", "").trim());
  const filtrando = busqueda.trim() !== "" && Number.isSafeInteger(numeroBuscado);
  const lotesVisibles = filtrando
    ? lotes.filter((lote) => lote.id === numeroBuscado)
    : [...lotes].reverse();

  return (
    <>
      <section className="rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
        <h2 className="font-semibold text-stone-900">Contrato en Stellar testnet</h2>
        <p className="mt-1">
          Los datos se leen directamente del contrato{" "}
          <a
            href={enlaceContrato()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-emerald-800 underline"
            title={ID_CONTRATO}
          >
            {abreviarDireccion(ID_CONTRATO)}
          </a>
          . Ábrelo en el explorador para ver cada registro.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3" aria-live="polite">
          <span className="text-xs text-stone-500">
            {consulta.tipo === "cargando" && "Leyendo el contrato…"}
            {consulta.tipo === "lista" &&
              `Actualizado a las ${consulta.leidoEn.toLocaleTimeString("es-CO")}`}
          </span>
          <button
            type="button"
            onClick={cargar}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
          >
            Actualizar
          </button>
        </div>
      </section>

      {consulta.tipo === "error" && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          No se pudo leer el contrato en testnet. Revisa tu conexión y toca Actualizar.
        </p>
      )}

      <section aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className="text-sm font-semibold text-stone-900">
          Totales
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Indicador titulo="Entradas" descripcion="Unidades recibidas" valor={totales?.entradas ?? null} />
          <Indicador titulo="Salidas" descripcion="Unidades entregadas" valor={totales?.salidas ?? null} />
          <Indicador titulo="Pendientes" descripcion="Entradas menos salidas" valor={totales?.pendientes ?? null} />
        </dl>
      </section>

      {porCategoria.length > 0 && (
        <section aria-labelledby="titulo-categorias">
          <h2 id="titulo-categorias" className="text-sm font-semibold text-stone-900">
            Por categoría
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Categoría</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Entró</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Salió</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {porCategoria.map((fila) => (
                  <tr key={fila.valor}>
                    <th scope="row" className="px-4 py-2 text-left font-medium text-stone-900">
                      {fila.etiqueta}
                    </th>
                    <td className="px-4 py-2 text-right text-stone-700">{unidades(fila.entradas)}</td>
                    <td className="px-4 py-2 text-right text-stone-700">{unidades(fila.salidas)}</td>
                    <td className="px-4 py-2 text-right text-stone-700">{unidades(fila.pendientes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-lotes" className="flex flex-col gap-3">
        <h2 id="titulo-lotes" className="text-sm font-semibold text-stone-900">
          Lotes
        </h2>
        <Campo
          id="buscar-lote"
          etiqueta="¿Donaste? Busca tu lote"
          ayuda="Escribe el número de lote que te dio el centro de acopio."
        >
          <input
            {...atributosControl("buscar-lote", true)}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            placeholder="Ej. 3"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            className={CLASES_CONTROL}
          />
        </Campo>

        {consulta.tipo === "lista" && lotesVisibles.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-600">
            {filtrando
              ? `No hay ningún lote #${numeroBuscado} registrado en el contrato.`
              : "Todavía no hay lotes registrados en el contrato."}
          </p>
        )}
        {lotesVisibles.length > 0 && (
          <ul className="flex flex-col gap-3">
            {lotesVisibles.map((lote) => (
              <FilaLote key={lote.id} lote={lote} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
