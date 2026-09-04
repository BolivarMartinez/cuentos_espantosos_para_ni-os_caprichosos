## Cómo abrir el proyecto en Visual Studio Code

1. Descomprime la carpeta `trabajo hackhaton`.
2. Abre VS Code → `Archivo > Abrir carpeta...` → selecciona `trabajo hackhaton`.
3. Instala la extensión **Live Server** (de Ritwick Dey).
4. Clic derecho sobre `index.html` → **"Open with Live Server"**.

Todo funciona con HTML, CSS y JavaScript puro — sin `npm install` ni backend. Los datos (usuarios, cómics, merchandising, reseñas, carrito) se guardan en el **localStorage** del navegador donde pruebes el sitio.

## Estructura

```
trabajo hackhaton/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── hero-banner.png       → ilustración del héroe
│   ├── legends-logo.png      → logo LEGENDS (fondo transparente)
│   ├── star.png              → estrella decorativa (fondo transparente)
│   └── comic-cover-default.png → portada de ejemplo
└── README.md
```

## Qué cambió frente a la versión anterior (visual)

- Header simplificado: logo pequeño en caja negra (a la izquierda) + nombre del sitio, y acciones de autenticación, carrito y favoritos a la derecha. Se quitó la barra de búsqueda para igualar la maqueta de tu equipo.
- Hero a todo lo ancho con degradado oscuro abajo y el título grande superpuesto con efecto glitch (sombra cian/magenta), igual que en la imagen.
- Tarjetas de cómic con borde morado, título en la fuente "Creepster" y el precio como botón redondeado (**haz clic en el precio para agregarlo al carrito**). El carrito permite cambiar cantidades, eliminar productos y consultar el total.
- Sección de merchandising a sangre (las fotos tocan los bordes de la pantalla), con esquinas redondeadas solo en la primera y última tarjeta, igual que en tu captura.

## Funciones que siguen intactas

- **Registro e inicio de sesión** de usuarios.
- **Reseñas de 1 a 5 estrellas + comentario** por cómic — haz clic sobre la portada de un cómic para abrir sus reseñas. Solo puede publicar quien tenga sesión iniciada.
- **Panel de administrador oculto**: 5 clics seguidos sobre el logo del header.
  - Usuario: `cuentos espantosos`
  - Contraseña: `LEGENDS_26*`
  - Desde ahí: agregar/eliminar cómics, agregar/eliminar fotos de merchandising, eliminar comentarios de cualquier cómic.
- **Modo auditor de solo lectura**: inicia sesión desde el acceso normal con `auditor@empresa.com` y contraseña `Auditor_2026*` para consultar estadísticas, cómics, merchandising y noticias sin botones de edición o eliminación.
- **Favoritos por usuario**: guarda cómics o productos de merchandising y gestiona la lista desde el botón de favoritos.
- **Noticias**: se muestran en la portada y el administrador puede publicarlas o eliminarlas desde su panel.

## Nota honesta

Como antes, todo corre en el navegador con `localStorage`: es perfecto para la demo del hackathon, pero los datos no se comparten entre distintas personas ni dispositivos. Para eso se necesitaría un backend real (Node.js + base de datos, o Firebase/Supabase) más adelante.
## Cambios realizados hoy

Se incorporó un **modo auditor de solo lectura** para revisar el estado de la demo sin alterar sus datos:

- Se creó automáticamente la cuenta `auditor@empresa.com` con contraseña `Auditor_2026*`.
- El panel muestra estadísticas de cómics, merchandising, noticias, reseñas y unidades en el carrito.
- Incluye listados de cómics, productos y noticias, identificados como contenido de solo lectura.
- El modo auditor oculta las acciones de compra y edición, y conserva la sesión al recargar la página.
- El panel se actualiza cuando el administrador agrega o elimina contenido y cuando cambia el `localStorage` desde otra pestaña.
- Se añadió el cierre de sesión específico del auditor y la restauración de la vista normal.

También se documentaron y consolidaron las mejoras actuales de la interfaz: carrito visible con cantidades y total, favoritos por usuario, noticias administrables, galería de merchandising reorganizada, tipografía Roman Antique y recursos visuales en `assets/`.

La aplicación continúa funcionando sin dependencias de `npm` ni backend; todos los datos se almacenan localmente en el navegador para la demo del hackathon.
