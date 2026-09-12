import json, os, kie
REPO="/Users/marianonoceti/Desktop/Antigravity/PSLSC Website/portstlucie"
refs = {
  "home":   "home-mobile-1080x1920.png",
  "luca_front_alt": f"{REPO}/docs/luca/ref-turnaround-front-alt.png",
  "luca_front":     f"{REPO}/docs/luca/ref-turnaround-front.png",
  "luca_expr":      f"{REPO}/docs/luca/ref-expressions.png",
  "luca_all":       f"{REPO}/docs/luca/ref-turnaround-all.png",
  "crest":          f"{REPO}/assets/brand/crest-aqua.webp",
  "stadium":        f"{REPO}/assets/proof/stadium-iso-night.webp",
}
urls = json.load(open("urls.json")) if os.path.exists("urls.json") else {}
for k,p in refs.items():
    if k not in urls: urls[k]=kie.upload(p); print("up", k, urls[k])
json.dump(urls, open("urls.json","w"), indent=1)

PROMPT_B = """Design a vertical 9:16 mobile phone screen for a football club's season ticket launch, as a flat, finished full-screen graphic. This exact image will later be rebuilt as a web page, so keep the layout simple, clean and precise.

BACKGROUND: full-bleed near-black matte wall (#0C0C0A) with a very subtle dark painted-wood / concrete texture and a soft vignette. No colored gradients, no light rays, no glow.

TOP: the club crest from reference image 1 (aquamarine shield with an anchor and the text "PORT ST. LUCIE SC"), reproduced exactly, centered horizontally, its top at about 5% of the height, about 12% of the height tall.

HEADLINE, left-aligned with a left margin of about 6% of the width, starting at about 30% of the height: three lines of heavy condensed uppercase sans-serif type (Druk-like), one word group per line, tight leading:
line 1: "SEASON" in warm white (#F4F1EA)
line 2: "TICKETS" in warm white (#F4F1EA)
line 3: "ARE HERE." in pale aquamarine (#AAF6E6)
The headline block is about 55% of the width wide. Spell every word exactly as written.

SUBLINE: below the headline, two lines of small letter-spaced uppercase sans-serif in light gray (#D8D5CE): "BE THERE FROM" on the first line and "THE BEGINNING." on the second. Exactly this text.

The right 40% of the frame beside the headline is intentionally EMPTY dark wall; a character will be placed there later, so leave it clean.

BOTTOM: the lowest 22% of the frame shows a dim night exterior view of a modern football stadium with floodlight masts and palm-tree silhouettes, inspired by reference image 2, blending upward into the black wall with a soft fade. On the stadium facade a small sign reads "PORT ST LUCIE SC". Keep it dark so the headline stays dominant.

Absolutely NO character, no mascot, no people, no buttons, no UI chrome, no phone frame, no status bar, no watermark, and no text other than the words specified above."""

tid = kie.create_task("gpt-image-2-5-sunburst-image-to-image",
    {"prompt": PROMPT_B, "input_urls": [urls["crest"], urls["stadium"]], "aspect_ratio": "9:16", "resolution": "2K", "background": "opaque"})
print("task B:", tid)
res = kie.wait(tid, every=8, timeout=540, label="B")
print("result:", res)
kie.download(res[0], "frame-B-final-raw.png")
from PIL import Image
im=Image.open("frame-B-final-raw.png"); print("size", im.size)
im.convert("RGB").resize((1080,1920), Image.LANCZOS).save("frame-B-final.png"); print("saved frame-B-final.png")
