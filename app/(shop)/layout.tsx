import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Cisnatura - Productos Naturales",
  description: "Tienda de productos naturales, herbolaria y homeopatía",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <Navbar />
        <main className="flex flex-col lg:max-w-[2000px] min-h-screen mx-auto px-2">
          {children}
        </main>
        <Toaster />
        <Footer />
        <CookieConsent />
      </SessionProvider>
    </ThemeProvider>
  );
}
