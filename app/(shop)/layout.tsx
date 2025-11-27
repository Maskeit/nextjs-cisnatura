import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <Navbar />
      <main className="flex flex-col lg:max-w-[2000px] min-h-screen mx-auto px-2">
        {children}
      </main>
      <Toaster />
      <Footer />
    </ThemeProvider>
  );
}
