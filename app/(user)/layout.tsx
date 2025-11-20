import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mi Cuenta - Cisnatura",
  description: "Gestiona tu perfil, órdenes y preferencias en Cisnatura",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Navbar />
      <main className="flex flex-col lg:max-w-[2000px] min-h-screen mx-auto px-8">
        {children}
      </main>
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}
