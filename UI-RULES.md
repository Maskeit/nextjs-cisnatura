## Ecommerce Cisnatura
Esta es una pagina web dedicada a vender productos relacionados con la salud, son productos naturales, tipo herbolaria, homeopatia, asi como tambien ofrece cursos de temas de salud alternativa.
La pagina usara la autenticacion mediante firebase o custom via api de la pagina. Se usara middleware para validar la autorizacion de envio de peticiones.

## Normas para UI

Fondos claros, colores con paleta verde claro o verde agua.
Texto claro y con buen contraste ya que muchos de los usuarios son personas mayores,

## facil de entender y de usar
la interaccion humano y software debe ser lo mas sencillo y entendible para el usuario
sin tantas animaciones, solo las necesarias o las que se te indiquen

Precios claros y botones claros de entender

## Estructura de la pagina 
Login page - form para registrarse o loguearse

Home - pagina de inicio muestra el catalogo de los productos

Carrito - muestra los productos agregados al carrito, con opciones para agregar o quitar cantidad de productos

Domicilio - Pagina muestra a donde se enviara el pedido, formulario para llenar los datos de la persona y tambien muestra domicilios ya agregados anteriormente, maximo 3 se pueden guardar.

Orden summary - el resumen de lo que se va ordenar. Los productos y el domicilio (paso previo a pagar) con boton de pagar y con la opcion de pago (sera una pasarela de pagos)

Resumen de la compra - esto muestra lo que se acaba de comprar y a donde se enviara.

## elementos de la UI 
Header - el header muestra lo siguiente
1. Logo de la tienda
2. la barra de busqueda de productos
3. icono del perfil iniciado (desplegable para ver el perfil y boton de cerrar sesion / iniciar en caso de no tener una sesion)
5. boton de carrito que meustra cuantos productos van agregados

Footer



# Paso 1
Disenar la arquitectura de paginas y rutas y layouts para la pagina con las paginas que ya se mencionaron
