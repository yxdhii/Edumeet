# EduMeet – listo para GitHub Pages

## Estructura
Sube el contenido de esta carpeta a la raíz de tu repositorio:
- `index.html`
- `css/styles.css`
- `js/app.js`
- `.nojekyll`

## Publicar en GitHub Pages
1. Crea un repositorio en GitHub (por ejemplo, `edumeet`).
2. Sube estos archivos y carpetas directamente a la raíz del repositorio. No dejes `index.html` dentro de otra carpeta.
3. Entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. En **Branch**, selecciona `main` y carpeta `/ (root)`.
6. Presiona **Save** y espera a que GitHub Pages genere el enlace.
7. Abre el enlace publicado. Si no ves los últimos cambios, recarga con `Ctrl + F5`.

## Requisitos
- `index.html` debe permanecer en la raíz.
- Las rutas CSS y JavaScript son relativas (`./css/styles.css` y `./js/app.js`), por lo que funcionan también en un repositorio de proyecto.
- Plus Jakarta Sans y Lucide Icons se cargan desde servicios CDN; se necesita conexión a Internet para mostrarlos.

## Almacenamiento y límites
Este es un prototipo estático. Las cuentas, la sesión y las reservas se guardan en `localStorage` del navegador de cada visitante. No existe una base de datos compartida, no se sincroniza entre dispositivos y borrar los datos del navegador puede eliminar los registros.
Las contraseñas se guardan en el almacenamiento local del navegador sin protección de servidor; no uses contraseñas reales. Para un sistema público real se necesita backend, base de datos y autenticación segura.
