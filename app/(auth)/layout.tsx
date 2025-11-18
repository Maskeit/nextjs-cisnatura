import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Cisnatura - Autenticación",
  description: "Inicia sesión o regístrate en Cisnatura",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
