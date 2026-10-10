"use client";

import { useEffect, useState } from "react";
import { fechaHoy } from "./dominio";

/**
 * Entrega la fecha de hoy del dispositivo (AAAA-MM-DD).
 *
 * Devuelve cadena vacía durante el render en servidor y la fecha real al
 * montar en el navegador. Así el HTML del servidor (que puede estar en otra
 * zona horaria) nunca contradice la fecha del celular del voluntario.
 */
export function useFechaHoy(): string {
  const [hoy, setHoy] = useState("");

  useEffect(() => {
    setHoy(fechaHoy());
  }, []);

  return hoy;
}
