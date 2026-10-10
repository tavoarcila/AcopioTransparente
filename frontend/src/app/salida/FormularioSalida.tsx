"use client";

import { useEffect, useState, type FormEvent } from "react";
import { atributosControl, Campo, CLASES_CONTROL } from "@/components/Campo";
import { PanelFirma } from "@/components/PanelFirma";
import {
  DESTINO_MAX,
  formatearFecha,
  validarSalida,
  type CamposTexto,
  type Errores,
  type SalidaLote,
} from "@/lib/dominio";
import { useFechaHoy } from "@/lib/useFechaHoy";

/**
 * Formulario de salida de un lote.
 *
 * La salida se enlaza a su entrada por el número de lote. El destino es un
 * lugar general (barrio, vereda, albergue), nunca una persona.
 */
export function FormularioSalida() {
  const [campos, setCampos] = useState<CamposTexto<SalidaLote>>({
    idLote: "",
    destino: "",
    fecha: "",
  });
  const hoy = useFechaHoy();
  const [errores, setErrores] = useState<Errores<SalidaLote>>({});
  const [confirmado, setConfirmado] = useState<SalidaLote | null>(null);

  // La fecha arranca en hoy, pero solo si el usuario no ha elegido otra.
  useEffect(() => {
    if (hoy) setCampos((previos) => (previos.fecha ? previos : { ...previos, fecha: hoy }));
  }, [hoy]);

  /** Actualiza un campo y limpia su error para no mostrar un mensaje viejo. */
  const cambiar = (campo: keyof SalidaLote, valor: string) => {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const resultado = validarSalida(campos);
    if (resultado.ok) {
      setErrores({});
      setConfirmado(resultado.datos);
    } else {
      setErrores(resultado.errores);
    }
  };

  if (confirmado) {
    return (
      <PanelFirma
        funcionContrato="registrar_salida"
        filas={[
          { etiqueta: "Lote de entrada", valor: `#${confirmado.idLote}` },
          { etiqueta: "Destino", valor: confirmado.destino },
          { etiqueta: "Fecha de entrega", valor: formatearFecha(confirmado.fecha) },
        ]}
        alEditar={() => setConfirmado(null)}
      />
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <Campo
        id="idLote"
        etiqueta="Número de lote"
        ayuda="El número que recibió el lote al registrar su entrada."
        error={errores.idLote}
      >
        <input
          {...atributosControl("idLote", true, errores.idLote)}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={15}
          value={campos.idLote}
          onChange={(evento) => cambiar("idLote", evento.target.value)}
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo
        id="destino"
        etiqueta="Destino"
        ayuda="Barrio, vereda o albergue. No escribas nombres, cédulas ni teléfonos."
        error={errores.destino}
      >
        <input
          {...atributosControl("destino", true, errores.destino)}
          type="text"
          autoComplete="off"
          maxLength={DESTINO_MAX}
          value={campos.destino}
          onChange={(evento) => cambiar("destino", evento.target.value)}
          className={CLASES_CONTROL}
        />
      </Campo>

      <Campo id="fecha" etiqueta="Fecha de entrega" error={errores.fecha}>
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
        Revisar salida
      </button>
    </form>
  );
}
