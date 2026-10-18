"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enlaceTransaccion, RED_ESPERADA } from "@/lib/config";
import { leerAdmin, type AvisosEnvio, type ResultadoEnvio } from "@/lib/contrato";
import { abreviarDireccion } from "@/lib/freighter";
import { useBilletera } from "./ProveedorBilletera";

/** Una línea del resumen: nombre del dato y su valor ya formateado. */
export interface FilaResumen {
  etiqueta: string;
  valor: string;
}

interface PropiedadesPanelFirma {
  /** Función del contrato que recibirá el registro. */
  funcionContrato: "registrar_entrada" | "registrar_salida";
  /** Datos validados que se enviarán al contrato. */
  filas: FilaResumen[];
  /** Vuelve al formulario para corregir. */
  alEditar: () => void;
  /** Firma y envía el registro con la cuenta conectada. */
  enviar: (direccion: string, avisos: AvisosEnvio) => Promise<ResultadoEnvio>;
  /** Limpia el formulario para registrar otro lote. */
  alTerminar: () => void;
}

/** Etapas del envío. Cada una tiene su propio mensaje en pantalla. */
type Etapa =
  | { tipo: "revision" }
  | { tipo: "firmando" }
  | { tipo: "confirmando" }
  | { tipo: "exito"; hash: string; idLote: number }
  | { tipo: "error"; mensaje: string };

/** Estado de la consulta de la cuenta administradora del contrato. */
type ConsultaAdmin = { tipo: "cargando" } | { tipo: "lista"; admin: string } | { tipo: "error" };

/**
 * Lee una vez la cuenta administradora del contrato.
 * Sirve para avisar antes de firmar si la cuenta conectada no podrá registrar.
 */
function useAdminContrato(): ConsultaAdmin {
  const [consulta, setConsulta] = useState<ConsultaAdmin>({ tipo: "cargando" });
  useEffect(() => {
    let vigente = true;
    leerAdmin()
      .then((admin) => vigente && setConsulta({ tipo: "lista", admin }))
      .catch((error: unknown) => {
        console.error("Error leyendo el admin del contrato:", error);
        if (vigente) setConsulta({ tipo: "error" });
      });
    return () => {
      vigente = false;
    };
  }, []);
  return consulta;
}

/**
 * Bloque que muestra el estado de la wallet antes de firmar: si falta
 * instalarla o conectarla, si está en otra red o si la cuenta no es la
 * administradora del contrato.
 */
function EstadoFirma({ admin }: { admin: ConsultaAdmin }) {
  const { estado, conectar } = useBilletera();

  if (estado.tipo === "verificando") {
    return <p className="text-sm text-stone-600">Verificando Freighter…</p>;
  }
  if (estado.tipo === "sin_extension") {
    return (
      <p className="text-sm text-stone-700">
        No se detectó Freighter en este navegador.{" "}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-800 underline"
        >
          Instalar Freighter
        </a>
      </p>
    );
  }
  if (estado.tipo === "desconectada") {
    return (
      <div className="flex flex-col gap-2">
        {estado.error && <p className="text-sm text-red-700">{estado.error}</p>}
        <button
          type="button"
          onClick={conectar}
          className="rounded-lg border border-emerald-700 px-4 py-3 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
        >
          Conectar Freighter
        </button>
      </div>
    );
  }
  if (estado.red !== RED_ESPERADA) {
    return (
      <p className="text-sm text-red-700">
        Freighter está en la red {estado.red}. Cámbiala a Testnet en la extensión
        y recarga la página.
      </p>
    );
  }
  if (admin.tipo === "lista" && admin.admin !== estado.direccion) {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        La cuenta conectada ({abreviarDireccion(estado.direccion)}) no es la
        administradora de este centro de acopio ({abreviarDireccion(admin.admin)}).
        La red rechazaría el registro. Cambia de cuenta en Freighter.
      </p>
    );
  }
  return (
    <p className="text-sm text-stone-700">
      Firmará la cuenta{" "}
      <span className="font-mono" title={estado.direccion}>
        {abreviarDireccion(estado.direccion)}
      </span>{" "}
      en Testnet.
    </p>
  );
}

/** Pantalla final cuando la red confirmó el registro. */
function Confirmacion({
  funcionContrato,
  hash,
  idLote,
  alTerminar,
}: {
  funcionContrato: PropiedadesPanelFirma["funcionContrato"];
  hash: string;
  idLote: number;
  alTerminar: () => void;
}) {
  const esEntrada = funcionContrato === "registrar_entrada";
  return (
    <section className="flex flex-col gap-5" aria-labelledby="titulo-confirmacion">
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-5">
        <h2 id="titulo-confirmacion" className="text-lg font-semibold text-emerald-900">
          {esEntrada ? "Entrada registrada en Stellar" : "Salida registrada en Stellar"}
        </h2>
        <p className="mt-3 text-4xl font-semibold text-emerald-900">Lote #{idLote}</p>
        <p className="mt-2 text-sm text-emerald-900">
          {esEntrada
            ? "Anota este número en la donación y dáselo al donante: con él consulta en el tablero si su aporte fue entregado."
            : "El lote quedó marcado como entregado. Ya aparece así en el tablero público."}
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
        <p className="text-stone-600">Comprobante en la red (hash de la transacción):</p>
        <a
          href={enlaceTransaccion(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all font-mono text-emerald-800 underline"
        >
          {hash}
        </a>
        <p className="mt-2 text-xs text-stone-500">
          Cualquiera puede abrir este enlace en el explorador y comprobar el registro.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={alTerminar}
          className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-800"
        >
          {esEntrada ? "Registrar otra entrada" : "Registrar otra salida"}
        </button>
        <Link
          href="/tablero"
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-center text-base font-medium text-stone-800 hover:bg-stone-50"
        >
          Ver tablero
        </Link>
      </div>
    </section>
  );
}

/**
 * Paso de confirmación de un registro.
 *
 * Muestra exactamente qué se enviará al contrato y con qué cuenta se firmará.
 * Al tocar "Firmar y registrar" se abre Freighter; después se espera a que la
 * red confirme y se muestra el hash. El botón se bloquea mientras tanto para
 * que un doble toque no envíe el registro dos veces.
 */
export function PanelFirma({
  funcionContrato,
  filas,
  alEditar,
  enviar,
  alTerminar,
}: PropiedadesPanelFirma) {
  const { estado } = useBilletera();
  const admin = useAdminContrato();
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "revision" });
  // Candado síncrono: el estado de React tarda un render en reflejar el clic.
  const enviando = useRef(false);

  const puedeFirmar =
    estado.tipo === "conectada" &&
    estado.red === RED_ESPERADA &&
    admin.tipo === "lista" &&
    admin.admin === estado.direccion;
  const ocupado = etapa.tipo === "firmando" || etapa.tipo === "confirmando";

  const firmar = async () => {
    if (!puedeFirmar || estado.tipo !== "conectada" || enviando.current) return;
    const direccion = estado.direccion;
    enviando.current = true;
    setEtapa({ tipo: "firmando" });
    const resultado = await enviar(direccion, {
      alFirmar: () => setEtapa({ tipo: "confirmando" }),
    });
    enviando.current = false;
    setEtapa(
      resultado.ok
        ? { tipo: "exito", hash: resultado.hash, idLote: resultado.idLote }
        : { tipo: "error", mensaje: resultado.mensaje },
    );
  };

  if (etapa.tipo === "exito") {
    return (
      <Confirmacion
        funcionContrato={funcionContrato}
        hash={etapa.hash}
        idLote={etapa.idLote}
        alTerminar={alTerminar}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="titulo-resumen">
      <div>
        <h2 id="titulo-resumen" className="text-lg font-semibold text-stone-900">
          Revisa antes de firmar
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Esto es lo que quedará escrito en Stellar. Después de firmar no se puede
          editar ni borrar.
        </p>
      </div>

      <dl className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-stone-600">{fila.etiqueta}</dt>
            <dd className="text-right text-sm font-medium text-stone-900">{fila.valor}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-stone-600">Función del contrato</dt>
          <dd className="font-mono text-sm text-stone-900">{funcionContrato}</dd>
        </div>
      </dl>

      <EstadoFirma admin={admin} />

      <div aria-live="polite">
        {etapa.tipo === "firmando" && (
          <p className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Revisa la ventana de Freighter: ahí ves qué vas a firmar. Confirma para continuar.
          </p>
        )}
        {etapa.tipo === "confirmando" && (
          <p className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Firmado. Esperando que la red confirme el registro (tarda unos 5 segundos).
            No cierres esta pantalla.
          </p>
        )}
        {etapa.tipo === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {etapa.mensaje}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="button"
          onClick={firmar}
          disabled={!puedeFirmar || ocupado}
          className="flex-1 rounded-lg bg-emerald-700 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
        >
          {etapa.tipo === "firmando"
            ? "Esperando firma…"
            : etapa.tipo === "confirmando"
              ? "Confirmando…"
              : "Firmar y registrar"}
        </button>
        <button
          type="button"
          onClick={alEditar}
          disabled={ocupado}
          className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-base font-medium text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Corregir datos
        </button>
      </div>
    </section>
  );
}
