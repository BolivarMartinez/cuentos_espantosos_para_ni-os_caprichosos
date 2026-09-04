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

- Header simplificado: logo pequeño en caja negra (a la izquierda) + nombre del sitio, y un solo botón morado "Registrarse / Iniciar sesión" a la derecha. Se quitaron la barra de búsqueda y el ícono de carrito visibles, para igualar la maqueta de tu equipo.
- Hero a todo lo ancho con degradado oscuro abajo y el título grande superpuesto con efecto glitch (sombra cian/magenta), igual que en la imagen.
- Tarjetas de cómic con borde morado, título en la fuente "Creepster" y el precio como botón redondeado (**haz clic en el precio para agregarlo al carrito** — se guarda en segundo plano, sin un carrito visible todavía, tal como se ve en la maqueta).
- Sección de merchandising a sangre (las fotos tocan los bordes de la pantalla), con esquinas redondeadas solo en la primera y última tarjeta, igual que en tu captura.

## Funciones que siguen intactas

- **Registro e inicio de sesión** de usuarios.
- **Reseñas de 1 a 5 estrellas + comentario** por cómic — haz clic sobre la portada de un cómic para abrir sus reseñas. Solo puede publicar quien tenga sesión iniciada.
- **Panel de administrador oculto**: 5 clics seguidos sobre el logo del header.
  - Usuario: `cuentos espantosos`
  - Contraseña: `LEGENDS_26*`
  - Desde ahí: agregar/eliminar cómics, agregar/eliminar fotos de merchandising, eliminar comentarios de cualquier cómic.

## Nota honesta

Como antes, todo corre en el navegador con `localStorage`: es perfecto para la demo del hackathon, pero los datos no se comparten entre distintas personas ni dispositivos. Para eso se necesitaría un backend real (Node.js + base de datos, o Firebase/Supabase) más adelante.
Cambios realizados en la página

## Estilo del merchandising
Se ajustó la sección de merchandising para que se vea como una galería:

- imágenes más pequeñas
- separación uniforme entre cada una
- ormato más limpio y ordenado
- etiquetas de nombre sobre la imagen
CSS aplicado:

- grid con columnas más estrechas
- gap: 16px
- aspect-ratio: 4 / 5
- bordes redondeados y sombra ligera

## Fuente del sitio
Se cambió la tipografía principal a Roman Antique.

Se agregó en el HTML:

import de la fuente desde Google Fonts CDN
referencia a https://fonts.cdnfonts.com/css/roman-antique

Y en CSS:

- font-family: 'Roman Antique', 'Times New Roman', serif;

## Texto del encabezado
Se dejó el texto solo en la parte superior, en el header:

“Cuentos Espantosos para niños caprichosos”
Se quitó del hero para mantener la portada más limpia.

## Cambios visuales aplicados
- Se rediseñó la sección de merchandising para que se vea como una galería con imágenes más pequeñas y separadas.
- Se actualizó la tipografía del sitio a Roman Antique para darle un estilo más clásico y editorial.
- Se eliminó el texto del hero para mantener una portada más limpia.
- Se dejó el nombre del proyecto solo en la cabecera superior.