import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "MOTOLIGA — Grassroots motorsport, live",
  description:
    "Streaming, live telemetry, and fantasy rankings for Formula Student, Karting, and the leagues the mainstream forgot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0c0d10] text-[#f5f5f0]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}