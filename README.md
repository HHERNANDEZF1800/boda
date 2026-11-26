# Boda · Landing page

Invitación web con historia de la pareja, vista **diagonal (isométrica) / vertical**, música, pétalos animados y **RSVP por código** (pase de persona + 1 y solicitud de personas adicionales).

## Correr en local
```bash
python3 -m http.server 8000
# abrir http://localhost:8000  (en modo demo, código DEMO01 o DEMO02)
```

## Dónde se edita cada cosa
| Qué | Archivo |
|---|---|
| Nombres, fecha, historia, lugares, música, URL del RSVP | `js/config.js` |
| Fotos | `assets/img/` (reemplaza `ejemplo-N.svg` por tus `.jpg` y actualiza `config.js`) |
| Canción | `assets/audio/cancion.mp3` + `musica: "assets/audio/cancion.mp3"` en `config.js` |
| Colores y estilos | `css/style.css` (variables en `:root`) |
| Backend de confirmaciones | `apps-script/` (ver `LEEME.md`) |

## Hosting
Es un sitio estático: no requiere VPS. Opciones gratis: Netlify, Vercel, Cloudflare Pages o GitHub Pages; las confirmaciones viven en Google Sheets.
