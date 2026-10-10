import Link from "next/link";

/** Accesos al flujo principal: cada tarjeta es un paso del recorrido del Blueprint. */
const ACCESOS = [
  {
    ruta: "/entrada",
    titulo: "Registrar entrada",
    descripcion: "Llegó una donación al centro de acopio.",
    quien: "Administrador",
  },
  {
    ruta: "/salida",
    titulo: "Registrar salida",
    descripcion: "Se entregó un lote a un barrio, vereda o albergue.",
    quien: "Administrador",
  },
  {
    ruta: "/tablero",
    titulo: "Ver tablero público",
    descripcion: "Cuánto entró, cuánto salió y qué queda pendiente.",
    quien: "Cualquier persona, sin cuenta",
  },
] as const;

/** Pantalla de inicio: explica el propósito y lleva a cada paso del flujo. */
export default function PaginaInicio() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900">
          Que cada donación se pueda verificar
        </h1>
        <p className="mt-3 text-base text-stone-700">
          Cada entrada y cada entrega de un centro de acopio queda escrita en
          Stellar. Nadie puede cambiarla después, ni siquiera quien la registró.
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {ACCESOS.map((acceso) => (
          <li key={acceso.ruta}>
            <Link
              href={acceso.ruta}
              className="block rounded-xl border border-stone-200 bg-white px-4 py-4 hover:border-emerald-700"
            >
              <span className="block text-base font-semibold text-stone-900">
                {acceso.titulo}
              </span>
              <span className="mt-1 block text-sm text-stone-600">
                {acceso.descripcion}
              </span>
              <span className="mt-2 block text-xs text-stone-500">{acceso.quien}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="rounded-xl border border-stone-200 bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-stone-900">Qué se guarda y qué no</h2>
        <p className="mt-2 text-sm text-stone-700">
          Se guarda el lote, la categoría, la cantidad, la fecha y el destino
          general. No se guardan nombres, cédulas ni datos de las familias: lo
          que se escribe en la red es público y no se borra.
        </p>
      </section>
    </div>
  );
}
