import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-muted/30 dark:bg-muted text-muted-foreground mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Información de la tienda */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-zinc-500">Cisnatura</h3>
            <p className="text-sm">
              Productos naturales de alta calidad para tu bienestar y salud.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-zinc-500">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-primary transition-colors">
                  Carrito
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Mi Cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-zinc-500">Contacto</h4>
            <p className="text-sm">
              Email: cisnatura.ventas@gmail.com<br />
              Teléfono: (314) 123-4567
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Cisnatura. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
