import type { Metadata } from "next";
import "@/app/globals.css";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  // Base para resolver canonical, Open Graph y demás URLs relativas de metadata.
  metadataBase: new URL(SITE_URL),
  title: "Cisnatura - Productos Naturales",
  description: "Tienda de productos naturales, herbolaria y homeopatía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
