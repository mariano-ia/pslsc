import numpy as np, glob, os
from PIL import Image, ImageFilter
files = sorted(glob.glob("src_frames/f_*.png")); N = len(files)
home  = np.asarray(Image.open("home-mobile-1080x1920.png").convert("RGB"), dtype=np.float32)
cover = np.asarray(Image.open("cover-wall.png").convert("RGB"), dtype=np.float32)
last  = np.asarray(Image.open("final-last-frame.png").convert("RGB"), dtype=np.float32)
H, W, _ = cover.shape
rowmax = last[1200:1600].max(axis=(1,2)); y_stadium = 1200 + int(np.argmax(rowmax > 70)); Y_COVER = y_stadium - 8
print("cover from", Y_COVER)

# --- tracking del panel (franja de la nav) ---
S0, S1 = 20, 170; home_strip = home[S0:S1]
def est_dx(fr):
    strip = fr[S0:S1]; best, bdx = 1e9, 0
    for dx in range(0, 1000, 4):
        w = W - dx
        if w < 150: break
        e = np.median(np.abs(strip[:, :min(w, 760)] - home_strip[:, dx:dx + min(w, 760)]))
        if e < best: best, bdx = e, dx
    return bdx
frames = [np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) for p in files]
dx = np.array([est_dx(fr) for fr in frames], dtype=np.float32)
for i in range(1, N): dx[i] = max(dx[i], dx[i-1])                       # monotónico
# extrapolación una vez que el tracker se estanca con el panel ya más allá de la mitad
stall = None
for i in range(6, N):
    if dx[i] > 600 and dx[i] == dx[i-1] == dx[i-2]: stall = i - 2; break
if stall:
    v = (dx[stall-1] - dx[stall-7]) / 6.0
    print(f"tracker stalls at f{stall} ({stall/24:.2f}s) dx={dx[stall]:.0f}, extrapolating at {v:.1f} px/frame")
    for i in range(stall, N): dx[i] = min(W, dx[i-1] + v)
gone = int(np.argmax(dx >= W)) if (dx >= W).any() else N
print(f"panel fully gone at f{gone} ({gone/24:.2f}s)")

# --- máscaras ---
ys = np.arange(H, dtype=np.float32); xs = np.arange(W, dtype=np.float32)
fy = np.clip((ys - (Y_COVER - 14)) / 20.0, 0, 1)[:, None]
def boots_mask(fr):
    r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
    mx = fr.max(axis=2); mn = fr.min(axis=2); v = mx / 255.0; s = (mx - mn) / np.maximum(mx, 1)
    # tono en grados (solo relevante cuando g es el máximo o cerca): aqua pálido ~160-182°
    d = np.maximum(mx - mn, 1)
    hue = np.where(mx == g, 60 * (2 + (b - r) / d), np.where(mx == b, 60 * (4 + (r - g) / d), 60 * (((g - b) / d) % 6)))
    m = (v > 0.42) & (s > 0.26) & (s < 0.7) & (hue > 156) & (hue < 184)
    m[:Y_COVER - 130] = False; m[1460:] = False          # solo la franja donde pueden estar los botines
    return m.astype(np.float32)
os.makedirs("out8_frames", exist_ok=True)
prot_px = []; edge_log = []
for i, fr in enumerate(frames):
    edge = W - dx[i]
    if 0 < dx[i] < W:
        # borde real del panel medido en la banda: primera corrida de 8 columnas claras (luces del estadio)
        colmax = fr[1470:1900].max(axis=(0, 2)); bright = colmax > 110
        x0 = int(max(0, edge - 300)); found = None
        for x in range(x0, W - 8):
            if bright[x:x + 8].all(): found = x; break
        if found is not None: edge = found
        else: edge = W + 200                                     # sin luces en la banda: no hay estadio visible, no tapar
        edge_log.append((i, int(W - dx[i]), int(edge)))
    fx = np.clip((xs - (edge - 16)) / 10.0, 0, 1)[None, :]
    if dx[i] <= 0: fx = np.zeros_like(fx)                        # home quieta: no tocar nada
    C = fy * fx
    bm = boots_mask(fr); bm[:, :int(max(0, edge - 16))] = 0
    prot_px.append(int(bm.sum()))
    P = Image.fromarray((bm * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(2))
    P = np.asarray(P, dtype=np.float32) / 255.0
    r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]; v = fr.max(axis=2) / 255.0
    stadium_like = ((b > g + 6) & (v > 0.15)) | ((g > r + 25) & (g > b + 25) & (v > 0.2))   # azulado (edificios/luces) o verde (césped)
    P = P * (1 - stadium_like.astype(np.float32))
    # cobertura por color: todo lo azulado/verde dentro de la banda es estadio, esté donde esté el borde
    S = Image.fromarray((stadium_like * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2))
    S = np.asarray(S, dtype=np.float32) / 255.0
    alpha = (C * np.maximum(1 - P, S))[:, :, None]      # la cobertura por color solo a la derecha del borde del panel
    out = fr * (1 - alpha) + cover * alpha
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f"out8_frames/{os.path.basename(p)}" if False else f"out8_frames/f_{i+1:04d}.png")
pp = np.array(prot_px)
print("protected px per 0.5s:", [int(pp[i]) for i in range(0, N, 12)])
print("edge (frame, nav_edge, band_edge):", edge_log[::4]); print("done", N)
