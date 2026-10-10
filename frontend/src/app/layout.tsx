import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Encabezado } from "@/components/Encabezado";
import { ProveedorBilletera } from "@/components/ProveedorBilletera";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Acopio Transparente",
    template: "%s · Acopio Transparente",
  },
  description:
    "Registro público de entradas y salidas de donaciones en centros de acopio, sobre Stellar testnet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Estructura común de todas las pantallas: encabezado, navegación y contenido.
 * El margen inferior deja espacio para la barra de navegación fija en celular.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProveedorBilletera>
          <Encabezado />
          <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pb-12">{children}</main>
        </ProveedorBilletera>
      </body>
    </html>
  );
}
