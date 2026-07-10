# tools/ — compilador de bloques para WordPress

## `build-blocks.py` — el compilador

Genera los 19 bloques del sitio en `dist/blocks/`, cada uno paste-ready para un widget HTML de
WordPress. Es manifest-driven: detecta de cada bloque qué CSS, JS, componentes y assets necesita.

```
python3 tools/build-blocks.py
```

Antes de correrlo para producción, editar arriba del archivo:
- `ASSET_BASE` — la URL donde subiste `dist/upload/` (mismo dominio de WP).
- `PERMALINKS` — los permalinks reales de Home / Founders / Partners.

Ver **`dist/UPLOAD.md`** para el flujo completo.

### Qué hace por cada bloque
- Namespacea todo el CSS bajo `.pslsc` (aislamiento bidireccional con el template).
- Referencia fuentes y assets hosteados por URL (`ASSET_BASE`).
- Empaqueta el JS como **data URI en el `src`** (WordPress corrompe el JS que va como texto — ver UPLOAD.md).
- Agrega full-bleed (`.pslsc--bleed`) y la franja de autodiagnóstico.
- Reescribe los links entre páginas a los permalinks reales.

## Las fuentes (WOFF2 subseteadas)

`dist/upload/fonts/*.woff2` son las 12 fuentes de marca subseteadas a Latin (1,16 MB → 127 KB).
Para regenerarlas hace falta `fonttools` + `brotli`:

```bash
python3 -m venv fontenv && ./fontenv/bin/pip install fonttools brotli
U="U+0020-007E,U+00A0-00FF,U+0100-017F,U+2013,U+2014,U+2018-201D,U+2022,U+00B7,U+2192,U+2713,U+00D7,U+2039,U+203A"
for f in Ferryman-ExtraBold Ferryman-Bold Druk-Medium Druk-Bold Druk-Heavy Druk-Super \
         DrukTextWide-Medium DrukTextWide-Heavy ProximaNova-Regular ProximaNova-Semibold ProximaNova-Bold; do
  ./fontenv/bin/pyftsubset "assets/fonts/$f.otf" --unicodes="$U" --flavor=woff2 \
    --layout-features='' --no-hinting --desubroutinize --output-file="dist/upload/fonts/$f.woff2"
done
./fontenv/bin/pyftsubset "assets/fonts/Cabazon_W01_Regular.ttf" --unicodes="$U" --flavor=woff2 \
  --layout-features='' --no-hinting --output-file="dist/upload/fonts/Cabazon-Regular.woff2"
```

Si agregás glifos (p. ej. acentos poco comunes que tipeen los usuarios), ampliá el rango `U+…` y
regenerá. La lista `FONTS` en `build-blocks.py` tiene que coincidir con los archivos generados.

## Nota histórica — el piloto todo-inline

El primer piloto (`06 · Founders`) se compiló con TODO embebido (fuentes e imágenes como data URI,
cero peticiones externas) y se validó en el sitio real. Ese enfoque no escala: los bloques con video
y la camiseta de 90 frames no se pueden embeber. Por eso todo el sitio usa `build-blocks.py`
(assets hosteados). Quedan como referencia solo las sondas de diagnóstico en `dist/_pilot/`.
