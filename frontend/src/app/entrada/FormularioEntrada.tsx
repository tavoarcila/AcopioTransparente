"use client";

import { useEffect, useState, type FormEvent } from "react";
import { atributosControl, Campo, CLASES_CONTROL } from "@/components/Campo";
import { PanelFirma } from "@/components/PanelFirma";
import { registrarEntrada } from "@/lib/contrato";
import {
  CANTIDAD_MAXIMA,
  CATEGORIAS,
  etiquetaCategoria,
  formatearFecha,
  validarEntrada,
  type CamposTexto,
  type EntradaLote,
  type Errores,
} from "@/lib/dominio";
import { useFechaHoy } from "@/lib/useFechaHoy";

/**
 * Formulario de entrada de un lote.
 *
 * Tiene dos pasos: llenar los datos y revisarlos antes de firmar. Los datos
 * solo pasan al segundo paso si cumplen las validaciones del dominio.
 */
export function FormularioEntrada() {
  const [campos, setCampos] = useState<CamposTexto<EntradaLote>>({
    categoria: "",
    cantidad: "",
    fecha: "",
  });
  const hoy = useFechaHoy();
  const [errores, setErrores] = useState<Errores<EntradaLote>>({});
  const [confirmado, setConfirmado] = useState<EntradaLote | null>(null);

  // La fecha arranca en hoy, pero solo si el usuario no ha elegido otra.
  useEffect(() => {
    if (hoy) setCampos((previos) => (previos.fecha ? previos : { ...previos, fecha: hoy }));
  }, [hoy]);

  /** Actualiza un campo y limpia su error para no mostrar un mensaje viejo. */
  const cambiar = (campo: keyof EntradaLote, valor: string) => {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const resultado = validarEntrada(campos);
    if (resultado.ok) {
      setErrores({});
      setConfirmado(resultado.datos);
    } else {
      setErrores(resultado.errores);
    }
  };

  /** Deja el formulario vacío (con la fecha de hoy) para registrar otro lote. */
  const reiniciar = () => {
    setCampos({ categoria: "", cantidad: "", fecha: hoy });
    setErrores({});
    setConfirmado(null);
  };

  if (confirmado) {
    return (
      <PanelFirma
        funcionContrato="registrar_entrada"
        filas={[
          { etiqueta: "Categoría", valor: etiquetaCategoria(confirmado.categoria) },
          {
            etiqueta: "Cantidad",
            valor: `${confirmado.cantidad.toLocaleString("es-CO")} unidades`,
          },
          { etiqueta: "Fecha de recepción", valor: formatearFecha(confirmado.fecha) },
        ]}
        alEditar={() => setConfirmado(null)}
        enviar={(direccion, avisos) => registrarEntrada(confirmado, direccion, avisos)}
        alTerminar={reiniciar}
      />
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
        <select
          {...atributosControl("categoria", false, errores.categoria)}
          value={campos.categoria}
          onChange={(evento) => cambiar("categoria", evento.target.value)}
          className={CLASES_CONTROL}
        >
          <option value="">Elige una categoría</option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria.valor} value={categoria.valor}>
              {categoria.etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        id="cantidad"
        etiqueta="Cantidad"
        ayuda="Número de unidades: cajas, bolsas, paquetes."
        error={errores.cantidad}
      >
        <input
          {...atributosControl("cantidad", true, errores.cantidad)}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(CANTIDAD_MAXIMA).length}
          value={campos.cantidad}
          onChange={(evento) => cambiar("cantidad", evento.target.value)}
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo id="fecha" etiqueta="Fecha de recepción" error={errores.fecha}>
        <input
          {...atributosControl("fecha", false, errores.fecha)}
          type="date"
          max={hoy || undefined}
          value={campos.fecha}
          onChange={(evento) => cambiar("fecha", evento.target.value)}
          className={CLASES_CONTROL}
        />
      </Campo>

      <button
        type="submit"
        className="rounded-lg bg-emerald-700 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-800"
      >
        Revisar entrada
      </button>
    </form>
  );
}
