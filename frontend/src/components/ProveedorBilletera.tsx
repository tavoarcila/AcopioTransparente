"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  conectarBilletera,
  consultarBilletera,
  type EstadoBilletera,
} from "@/lib/freighter";

/** Lo que cualquier componente puede leer o pedir sobre la wallet. */
interface ContextoBilletera {
  estado: EstadoBilletera;
  /** Abre Freighter para que el usuario autorice la aplicación. */
  conectar: () => Promise<void>;
}

const Contexto = createContext<ContextoBilletera | null>(null);

/**
 * Comparte el estado de Freighter con toda la aplicación.
 * Así el encabezado y los formularios ven la misma conexión sin repetir consultas.
 */
export function ProveedorBilletera({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoBilletera>({ tipo: "verificando" });

  // Al cargar se recupera la conexión que el usuario ya haya autorizado antes.
  useEffect(() => {
    let vigente = true;
    consultarBilletera().then((nuevo) => {
      if (vigente) setEstado(nuevo);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const conectar = useCallback(async () => {
    setEstado({ tipo: "verificando" });
    setEstado(await conectarBilletera());
  }, []);

  const valor = useMemo(() => ({ estado, conectar }), [estado, conectar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Da acceso al estado de la wallet.
 * @throws Error si se usa fuera de `ProveedorBilletera`.
 */
export function useBilletera(): ContextoBilletera {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useBilletera debe usarse dentro de ProveedorBilletera");
  }
  return contexto;
}
