# Tokens — origen de cada decisión

Sistema visual validado por el cliente (jul 2026) y verificado contra el manual de marca oficial
(PSL-Brandbook.pdf — material de referencia, no vive en el repo).

## Colores oficiales (brandbook)

| Nombre | Valor | Pantone |
|---|---|---|
| Aquamarine | `#AAF6E6` (RGB 170/246/230) | 0921 C |
| Black | `#000000` | Black C |
| White | `#FFFFFF` | White C |
| Red Marine | `#FF0033` | 0821 C |

**Regla de marca crítica:** el escudo NO admite colores no aprobados — el brandbook muestra
explícitamente un escudo **naranja tachado**. Cualquier acento naranja/terracota queda descartado.
Tampoco: quitar elementos, alterar proporciones, outline, cambiar opacidad, rotar, ni sombras
sobre el escudo. El naranja está prohibido en todo el sitio.

## Mapeo → tokens (colores y fuentes)

Color: **aquamarine principal, negro secundario, blanco + red marine acento** (indicación del cliente).

| Token | Valor | Origen |
|---|---|---|
| `--color-aqua` | `#AAF6E6` | Aquamarine oficial — PRINCIPAL: CTAs, kickers, acentos sobre oscuro |
| `--color-aqua-deep` | `#0E8C79` | aquamarine legible sobre superficies claras (contraste) |
| `--color-ink` | `#0C0C0A` | negro cálido — fondo base oscuro |
| `--color-paper` | `#FFFFFF` | blanco de marca — secciones claras |
| `--color-red-marine` | `#FF0033` | Red Marine oficial — acento de urgencia |
| `--font-hero` | Ferryman | título de la home (H1) / heros |
| `--font-display` | Druk | títulos de sección, números display, títulos de card |
| `--font-label` (`--font-mono` alias) | Druk Text Wide | kickers, labels, nav, "EST. 2019" |
| `--font-body` | Proxima Nova | body / UI / botones / inputs (legible) |
| `--font-detail` | Cabazon | detalle decorativo (uso puntual) |

Fuentes instaladas vía `@font-face` en `tokens/fonts.css` (archivos en `assets/fonts/`).

## Assets de marca (`assets/brand/`)
- `crest-aqua.webp` / `crest-black.webp` — escudo institucional (nav, footer, boarding pass, fixtures).
- `anchor-aqua.webp` / `anchor-black.webp` — ancla suelta (detalles del footer).

## Assets de imagen / video
- `assets/images/luka-card.webp` — mascota **Luka** (boarding pass del bloque Founders).
- `assets/images/pslsc_academy.webp` — foto de la academia (bloque Academy).
- `assets/proof/stadium-aerial.webp` — render aéreo del estadio (bloque Proof).
- `assets/jersey360/f_00.webp … f_89.webp` — 90 cuadros del giro 360° de la camiseta.
- `assets/videos/hero.mp4` + `assets/videos/hero-poster.webp` — video de fondo del hero.

Tagline oficial: **"Anchored in glory · Pride of the City"**.

## Pendiente
- Reemplazar placeholders de render/foto (`▦ DROP ASSET HERE`) por renders de estadio y fotos
  reales cuando el cliente los entregue.
- Tipografía blackletter del escudo: solo vive en el asset del crest, no se usa como webfont.
