#!/usr/bin/env python3
"""
Compilador de bloques PSL SC para WordPress (constructor visual, widget "HTML").
Genera un archivo autocontenido por bloque en dist/blocks/, listo para copiar y pegar.

Cada bloque:
  - CSS namespaceado bajo .pslsc (no pisa el template, ni el template lo pisa a él)
  - fuentes y assets HOSTEADOS una vez (ASSET_BASE), referenciados por URL
  - JS como data: URI en el atributo src  (WordPress corrompe el JS que va como texto
    dentro de <script>: ve el `<` de `a < b`, cree que abre una etiqueta y escapa los `&`,
    rompiendo `a && b` -> `a &#038;&#038; b`. En los atributos no entra.)
  - full-bleed sin alignfull  +  franja de autodiagnóstico al pie

Correr:  python3 tools/build-blocks.py
Requiere las fuentes subseteadas en <scratchpad>/allfonts/ (ver tools/README.md).
"""
import re, base64, os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.environ.get("PSL_FONTS_DIR", "")  # dir con los .woff2 subseteados (para verificar tamaños)
NS = ".pslsc"

# ─────────────────────────────────────────────────────────────── CONFIG
# Decisión del cliente (2026-07-10): dejar los placeholders TAL CUAL. El desarrollador de WordPress
# hace un find-and-replace de estos 4 tokens cuando tenga las URLs reales (ver dist/UPLOAD.md §2).
# Alternativa equivalente: poner acá los valores reales y re-correr el build.
ASSET_BASE = "__PSL_ASSET_BASE__/"           # ej. "https://www.portstluciesc.com/wp-content/uploads/psl/"
PERMALINKS = {
    "home.html":     "__URL_HOME__",         # ej. "/"          (o "/home/")
    "sumate.html":   "__URL_SUMATE__",       # ej. "/become-a-founder/"
    "partners.html": "__URL_PARTNERS__",     # ej. "/partners/"
}

# Bloques a compilar. Nav (00) y News (08) quedan fuera: son nativos del template de USL.
BLOCKS = [
    ("home", "01-hero"), ("home", "02-stats"), ("home", "03-project"), ("home", "04-proof"),
    ("home", "04b-fixtures"), ("home", "05-jersey"), ("home", "06-founders"),
    ("home", "07-academy"), ("home", "09-cierre-footer"),
    ("sumate", "s01-hero"), ("sumate", "s02-benefits"), ("sumate", "s03-plans"),
    ("sumate", "s05-faq"), ("sumate", "s06-cta"),
    ("partners", "p01-hero"), ("partners", "p02-opportunity"), ("partners", "p03-value"),
    ("partners", "p04-traction"), ("partners", "p05-contact"),
]

# Fuentes hosteadas (family, weight, archivo .woff2 en ASSET_BASE fonts/)
FONTS = [
    ("Ferryman", 800, "Ferryman-ExtraBold"), ("Ferryman", 700, "Ferryman-Bold"),
    ("Druk", 500, "Druk-Medium"), ("Druk", 700, "Druk-Bold"),
    ("Druk", 800, "Druk-Heavy"), ("Druk", 900, "Druk-Super"),
    ("Druk Text Wide", 500, "DrukTextWide-Medium"), ("Druk Text Wide", 800, "DrukTextWide-Heavy"),
    ("Proxima Nova", 400, "ProximaNova-Regular"), ("Proxima Nova", 600, "ProximaNova-Semibold"),
    ("Proxima Nova", 700, "ProximaNova-Bold"), ("Cabazon", 400, "Cabazon-Regular"),
]

# Componentes web -> archivos JS (en orden; el config del live-counter va primero para inlinear el import)
COMPONENTS = {
    "psl-live-counter":     ["live-counter/live-counter.config.js", "live-counter/live-counter.js"],
    "psl-fixtures":         ["fixtures/fixtures.js"],
    "psl-jersey-viewer":    ["jersey-viewer/jersey-viewer.js"],
    "psl-founder-id":       ["founder-id/founder-id.js"],
    "psl-departures-board": ["departures-board/departures-board.js"],
}
# CSS de cada componente (va junto con su JS; sin esto el componente monta pero queda sin estilar)
COMPONENT_CSS = {
    "psl-live-counter":     "live-counter/live-counter.css",
    "psl-fixtures":         "fixtures/fixtures.css",
    "psl-jersey-viewer":    "jersey-viewer/jersey-viewer.css",
    "psl-founder-id":       "founder-id/founder-id.css",
    "psl-departures-board": "departures-board/departures-board.css",
}

def read(p): return open(os.path.join(REPO, p), encoding="utf-8").read()

# ─────────────────────────────────────────────────────────────── CSS namespacing
def strip_comments(css): return re.sub(r"/\*.*?\*/", "", css, flags=re.S)

def prefix_selector(sel):
    sel = sel.strip()
    if not sel: return sel
    if sel in (":root", "html", "body"): return NS
    if sel.startswith("html "): return NS + " " + sel[5:]
    if sel.startswith("body "): return NS + " " + sel[5:]
    if sel.startswith("*"):     return NS + " " + sel
    return NS + " " + sel

def namespace_css(css):
    css = strip_comments(css)
    out, i, n = [], 0, len(css)
    while i < n:
        m = re.match(r"\s*@(font-face|keyframes|-webkit-keyframes|media|supports)([^{]*)\{", css[i:])
        if m:
            at = m.group(1); head = css[i:i + m.end()]
            depth, j = 1, i + m.end()
            while j < n and depth:
                if css[j] == "{": depth += 1
                elif css[j] == "}": depth -= 1
                j += 1
            body = css[i + m.end(): j - 1]
            if at in ("font-face", "keyframes", "-webkit-keyframes"):
                out.append(head + body + "}")
            else:
                out.append(head + namespace_css(body) + "}")
            i = j; continue
        m = re.match(r"([^{}]+)\{([^{}]*)\}", css[i:])
        if not m: i += 1; continue
        sels = [s.strip() for s in m.group(1).split(",") if s.strip()]
        keep = [s for s in sels if s not in ("html", "body")]
        if keep:
            out.append(f"{', '.join(prefix_selector(s) for s in keep)}{{{m.group(2).strip()}}}")
        i += m.end()
    return "\n".join(out)

# ─────────────────────────────────────────────────────────────── fuentes (hosteadas)
def fonts_css():
    return "\n".join(
        f"@font-face{{font-family:'{fam}';font-weight:{wt};font-style:normal;font-display:swap;"
        f"src:url({ASSET_BASE}fonts/{f}.woff2) format('woff2');}}"
        for fam, wt, f in FONTS
    )

# ─────────────────────────────────────────────────────────────── assets -> ASSET_BASE
def rewrite_assets(text):
    return text.replace("/assets/", f"{ASSET_BASE}assets/")

# ─────────────────────────────────────────────────────────────── links cruzados -> permalinks
def rewrite_links(html):
    def sub(m):
        page, anchor = m.group(1) + ".html", (m.group(2) or "")
        return PERMALINKS.get(page, page) + anchor
    return re.sub(r"(home|sumate|partners)\.html(#[\w-]+)?", sub, html)

# ─────────────────────────────────────────────────────────────── JS -> data: URI
def js_to_data_uri(js):
    b = "data:text/javascript;base64," + base64.b64encode(js.encode("utf-8")).decode("ascii")
    unsafe = {ord(c): f"%{ord(c):02X}" for c in '%#<>&"\r\n'}
    pct = "data:text/javascript;charset=utf-8," + js.translate(unsafe)
    return pct if len(pct) < len(b) else b

# ─────────────────────────────────────────────────────────────── motion.js (scoped)
def motion_js():
    m = read("native/_patterns/motion.js")
    m = m.replace("const html = document.documentElement;", "")
    m = re.sub(r"function initMotion\(root = document\) \{.*?\n\}",
        "function initMotion(root){root.classList.add('psl-motion');"
        "initReveal(root);initParallax(root);initTilt(root);initSpotlight(root);"
        "initMagnetic(root);initCountdown(root);}", m, flags=re.S)
    m = m.replace("document.addEventListener('DOMContentLoaded', () => initMotion());", "")
    m = m.replace("export { initMotion };", "")
    for fn in ("initNavScroll", "initGrain", "initCursor", "initSeams"):
        m = re.sub(rf"function {fn}\(\) \{{.*?\n\}}\n", "", m, flags=re.S)
    return rewrite_assets(m)

# ─────────────────────────────────────────────────────────────── componentes
def component_js(tag):
    files = COMPONENTS[tag]
    parts = []
    for f in files:
        src = read("custom/" + f)
        if f.endswith(".config.js"):
            src = src.replace("export const", "const")                 # inline del config
        src = re.sub(r"import\s+\{[^}]+\}\s+from\s+'[^']*';", "", src)  # sacar el import del config
        src = re.sub(r"export\s+\{[^}]+\};", "", src)                   # sacar exports
        src = re.sub(r"customElements\.define\('([\w-]+)',\s*(\w+)\);",
                     r"if(!customElements.get('\1'))customElements.define('\1',\2);", src)
        parts.append(rewrite_assets(src))
    return "\n".join(parts)

# ─────────────────────────────────────────────────────────────── reporter (autodiagnóstico)
REPORTER = """
(function(){
  function el(){return document.getElementById('psl-diag');}
  window.addEventListener('error',function(e){
    var d=el(); if(!d) return;
    d.textContent='\\u274C El JS del bloque fallo: '+(e.message||'error')+'  ('+(e.lineno||'?')+')';
    d.className='psl-diag';
  },true);
  window.__pslDiag=function(){
    var d=el(); if(!d) return;
    d.textContent='\\u2705 JS OK - ancho util '+document.documentElement.clientWidth+'px';
    d.className='psl-diag is-ok';
  };
})();
"""

def boot_js(needs_motion):
    mot = "document.querySelectorAll('.pslsc').forEach(function(r){if(!r.dataset.pslBooted){r.dataset.pslBooted='1';initMotion(r);}});" if needs_motion else ""
    return f"""
function pslVw(){{document.documentElement.style.setProperty('--psl-vw',document.documentElement.clientWidth+'px');}}
pslVw(); addEventListener('resize',pslVw,{{passive:true}});
function pslBoot(){{ {mot} if(window.__pslDiag) window.__pslDiag(); }}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',pslBoot); else pslBoot();
"""

# ─────────────────────────────────────────────────────────────── base / reset / bleed / diag
def base_css():
    return f"""{NS}, {NS} *, {NS} *::before, {NS} *::after {{ box-sizing: border-box; }}
{NS} {{ width:100%; font-family:var(--font-body); color:var(--color-text); line-height:normal; -webkit-font-smoothing:antialiased; }}
{NS} h1,{NS} h2,{NS} h3,{NS} h4,{NS} h5,{NS} h6,{NS} p,{NS} ul,{NS} ol,{NS} li,{NS} figure,{NS} blockquote,{NS} dl,{NS} dd {{ margin:0; padding:0; color:inherit; font:inherit; text-transform:none; }}
{NS} ul,{NS} ol {{ list-style:none; }}
{NS} a {{ color:inherit; text-decoration:none; }}
{NS} img,{NS} video,{NS} canvas,{NS} svg {{ display:block; max-width:100%; }}
{NS} button,{NS} input,{NS} textarea,{NS} select {{ font:inherit; color:inherit; }}
{NS} ::selection {{ background:var(--color-aqua); color:var(--color-black); }}
{NS}--bleed {{ width:var(--psl-vw,100vw); max-width:var(--psl-vw,100vw); margin-left:calc(50% - var(--psl-vw,100vw)/2); margin-right:calc(50% - var(--psl-vw,100vw)/2); }}
{NS} .psl-diag {{ font:12px/1.5 ui-monospace,Menlo,monospace; margin-top:16px; padding:9px 12px; border-radius:6px; background:#FF0033; color:#fff; word-break:break-word; }}
{NS} .psl-diag.is-ok {{ background:rgba(14,140,121,.12); color:var(--color-aqua-deep); }}"""

# ─────────────────────────────────────────────────────────────── build de un bloque
def build_block(page, name):
    html = read(f"native/{page}/{name}.html")
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S).strip()   # sin comentarios (rompen el parser de WP)

    comps = sorted(set(re.findall(r"<(psl-[a-z-]+)", html)))
    uses_pcard = bool(re.search(r"\bpcard\b", html))
    uses_ptl   = bool(re.search(r"\bptl\b", html)) and name != "03-project"
    needs_motion = bool(re.search(r"data-(reveal|parallax|tilt|spotlight|magnetic|countdown)", html))

    # CSS: tokens + motion + propio + deps compartidas + CSS de cada componente embebido
    css_files = ["tokens/tokens.css", "native/_patterns/motion.css", f"native/{page}/{name}.css"]
    if uses_pcard: css_files.insert(2, "native/_patterns/cards.css")
    if uses_ptl:   css_files.insert(2, "native/home/03-project.css")
    for c in comps:
        if c in COMPONENT_CSS: css_files.append("custom/" + COMPONENT_CSS[c])
    css = "\n".join(namespace_css(read(f)) for f in css_files)

    # JS: motion (si hace falta) + componentes + boot
    js_parts = []
    if needs_motion or comps:
        if needs_motion: js_parts.append(motion_js())
        for c in comps:
            if c in COMPONENTS: js_parts.append(component_js(c))
        js_parts.append(boot_js(needs_motion))
    else:
        js_parts.append(boot_js(False))
    js = "\n".join(js_parts)

    html = rewrite_links(rewrite_assets(html))

    diag = '<p class="psl-diag" id="psl-diag">&#10060; El script del bloque no se ejecuto (o fue removido)</p>'
    scripts = (f'<script src="{js_to_data_uri(REPORTER)}"></script>\n'
               f'<script type="module" src="{js_to_data_uri(js)}"></script>')

    return f"""<!-- PSL SC - bloque {page}/{name}. Pegar en un widget HTML de WordPress.
     Assets y fuentes hosteados en {ASSET_BASE} (ver dist/UPLOAD.md).
     El JS va como data: URI en el src (WordPress corrompe el JS que va como texto). -->
<style>
{fonts_css()}
{base_css()}
{css}
</style>

<div class="pslsc pslsc--bleed">
{html}
{diag}
</div>

{scripts}
"""

# ─────────────────────────────────────────────────────────────── main
if __name__ == "__main__":
    outdir = os.path.join(REPO, "dist", "blocks")
    os.makedirs(outdir, exist_ok=True)
    total = 0
    print(f"ASSET_BASE = {ASSET_BASE}")
    print(f"permalinks = {PERMALINKS}\n")
    for page, name in BLOCKS:
        html = build_block(page, name)
        out = os.path.join(outdir, f"psl-{page}-{name}.html")
        open(out, "w", encoding="utf-8").write(html)
        total += len(html.encode())
        print(f"  {page}/{name:16} {len(html.encode())/1024:6.1f} KB")
    print(f"\n  {len(BLOCKS)} bloques · {total/1024:.0f} KB en total (sin contar assets hosteados)")
