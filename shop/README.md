# shop/ — tienda oficial (mockup a medida)

Mockup funcional de la **tienda oficial de Port St. Lucie SC**. A diferencia del resto del sitio
(que se pega como bloques HTML en WordPress), la tienda es **a medida** — un único HTML autocontenido.
**No se compila a bloques ni pasa por `tools/build-blocks.py`.**

## Qué es

- `index.html` — la tienda completa (home con categorías + vista de categoría con grilla de productos +
  carrito lateral + newsletter + footer). CSS y JS inline; las **fuentes de marca van embebidas**
  (Druk, Proxima Nova, Cabazon, Ferryman), así que el archivo es portable y no depende de nada externo
  salvo las imágenes.
- `assets/` — crest, mascot (WebP con transparencia) y las 4 fotos de categoría (fan/team, portrait +
  landscape), todas optimizadas a WebP.

## Ver localmente

Servir la raíz del repo y abrir `/shop/` (usa rutas absolutas `/shop/assets/…`):
```
python3 -m http.server 4321   # → http://localhost:4321/shop/
```

## Estilos

Alineada al sistema de diseño del sitio (`tokens/tokens.css`): aquamarine `#AAF6E6`, ink `#0C0C0A`,
paper `#F4F1EA`, red-marine `#FF0033`, y las mismas tipografías (el hero usa **Ferryman**, igual que el
hero de la web). Sin naranja en la UI. Todo el CSS cuelga de un wrapper propio.

## Pendientes / a cablear (para el dev)

- **Catálogo demo**: los productos y sus imágenes salen de un dataset de demo de Soccer Locker
  (`soccerlocker-demo.s3…`, ~44 imágenes). Son de referencia — reemplazar por el catálogo/carrito real.
  El carrito, el checkout y las cantidades son mock (client-side).
- **Checkout**: hoy la tienda oficial vive en la plataforma externa de Soccer Locker
  (`shop.myuniformsoccerlocker.com/clubs/port-st-lucie-sc`). Definir si la tienda a medida reemplaza
  esa plataforma o convive con ella.
- **Link "Become a Founder"** (hero): apunta a la **URL de preview de Vercel**
  (`pslsc.vercel.app/pages/sumate.html`) — reemplazar por el permalink real de la página de Founders.
- **Newsletter** (footer): el submit es mock — cablear al endpoint real.
