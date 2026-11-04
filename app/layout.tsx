import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Nerea Studio",
    template: "%s · Nerea Studio",
  },
  description:
    "Planes de nutrición y entrenamiento. Dieta por días y sesiones con los pesos, preparadas por Nerea.",
};

export const viewport: Viewport = {
  themeColor: "#f6ecde",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <div id="contenido">{children}</div>
      </body>
    </html>
  );
}
