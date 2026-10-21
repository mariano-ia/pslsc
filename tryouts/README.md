# tryouts/ — Pruebas de jugadores en Buenos Aires (8/11)

Landing con formulario de inscripción para las pruebas de Port St. Lucie SC en Buenos Aires
(domingo 8 de noviembre, jugadores de 18 a 25 años, sin costo).

Vive en **`/tryouts/`** del mismo proyecto de Vercel. Igual que `school/`, **no va a WordPress ni pasa por
`tools/build-blocks.py`**: es una página propia y autocontenida (no importa nada de `tokens/`, `native/` ni `custom/`).

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página (copy en español con algo de inglés en kickers y títulos). |
| `tryouts.css` | Estilos. Mobile-first, un breakpoint a 900px. |
| `tryouts.js` | Validación del form, confirmación, preguntas frecuentes y copiar link. |
| `config.js` | **Lo único que hay que tocar** para conectar ActiveCampaign. |
| `assets/` | Imágenes, íconos y fuentes (woff2) de la página. |

## Formulario

Campos: **nombre y apellido\***, **edad\*** (selector 18 a 25), **posición\*** (Arquero, Defensor, Mediocampista,
Delantero), **mail\*** y **experiencia / trayectoria previa** (opcional).
Hay un aviso: si la persona queda seleccionada, va a necesitar apto médico vigente
(el apto no se sube en el form; se lo pide a los seleccionados el mail de ActiveCampaign).

Arriba del botón van las **4 casillas del punto 13 de las bases**, sin preseleccionar: bases y condiciones\*,
datos personales\*, apto médico\* y uso de imagen (opcional). Las **bases y condiciones** completas (puntos 1 a 12)
están en el `<dialog id="bases">` de `index.html`; se abren desde las casillas o con **`/tryouts/#bases`**.

**Pendiente (dev):** conectar el envío a ActiveCampaign en `tryouts.js > sendLead`, con el mismo patrón que `/school`.
Mientras `config.js` esté vacío, el form valida pero **no envía y no finge éxito**: muestra un error y deja un `console.error`.

Para revisar el diseño de la confirmación sin backend: abrir **`/tryouts/?demo`**.

## Ver localmente

```bash
python3 -m http.server 4321   # → http://localhost:4321/tryouts/
```

Las rutas son absolutas (`/tryouts/…`): servir la **raíz del repo**.

## A confirmar

- Sede y horario (hoy figuran como "[Sede y horario a confirmar]" en las preguntas).
- Los `[corchetes]` de las bases: lugar y horario, mail de contacto y de privacidad, fecha límite de preinscripción,
  medio de confirmación, presentación del apto y cobertura, apoyo y gastos de viaje.
- Imagen para compartir (og:image).
