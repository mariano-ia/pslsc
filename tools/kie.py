"""
Cliente mínimo de kie.ai (jobs/createTask + recordInfo + upload) usado para los videos de Luca.
Uso desde Python:
    import kie
    url  = kie.upload("frame.png")                      # -> URL pública temporal (expira a los 3 días)
    tid  = kie.create_task("bytedance/seedance-2", {...})
    urls = kie.wait(tid, label="clip1")                  # -> lista de URLs de resultado
    kie.download(urls[0], "clip1.mp4")
Uso desde consola:   KIE_API_KEY=... python3 tools/kie.py upload a.png b.png
Trampas ya resueltas acá: certifi para SSL, User-Agent de navegador (sin él kie devuelve 403).
Créditos: GET https://api.kie.ai/api/v1/chat/credit
"""
import json, re, sys, time, urllib.request, mimetypes, uuid, ssl
try:
    import certifi; CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    CTX = ssl._create_unverified_context()
import os
KEY = os.environ.get("KIE_API_KEY", "").strip()
if not KEY:
    sys.exit("Falta KIE_API_KEY en el entorno. Ej.: export KIE_API_KEY=... (ver docs/luca-video-playbook.md)")
BASE = "https://api.kie.ai/api/v1"
H = {"Authorization": f"Bearer {KEY}", "User-Agent": "Mozilla/5.0"}

def _req(url, data=None, headers=None, method=None):
    h = dict(H); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
        return json.loads(r.read().decode())

def upload(path, upload_path="pslsc/takeover"):
    boundary = "----kie" + uuid.uuid4().hex
    name = path.split("/")[-1]
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    body = b""
    for k, v in (("uploadPath", upload_path), ("fileName", name)):
        body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
    body += open(path, "rb").read() + f"\r\n--{boundary}--\r\n".encode()
    j = _req("https://kieai.redpandaai.co/api/file-stream-upload", data=body,
             headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    if not j.get("success") and j.get("code") != 200: raise RuntimeError(j)
    return j["data"]["downloadUrl"]

def create_task(model, inp):
    j = _req(f"{BASE}/jobs/createTask", data=json.dumps({"model": model, "input": inp}).encode(),
             headers={"Content-Type": "application/json"}, method="POST")
    if j.get("code") != 200: raise RuntimeError(j)
    return j["data"]["taskId"]

def task_info(task_id):
    return _req(f"{BASE}/jobs/recordInfo?taskId={task_id}")

def wait(task_id, every=10, timeout=1800, label=""):
    t0 = time.time(); last = None
    while time.time() - t0 < timeout:
        j = task_info(task_id); d = j.get("data") or {}
        st = d.get("state")
        if st != last: print(f"  [{label}] {int(time.time()-t0)}s state={st}", flush=True); last = st
        if st == "success":
            rj = d.get("resultJson"); rj = json.loads(rj) if isinstance(rj, str) else (rj or {})
            return rj.get("resultUrls") or rj.get("result_urls") or rj
        if st == "fail": raise RuntimeError(f"{d.get('failCode')}: {d.get('failMsg')}")
        time.sleep(every)
    raise TimeoutError(task_id)

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=300, context=CTX) as r, open(path, "wb") as f: f.write(r.read())
    return path

if __name__ == "__main__":
    # uso: python3 kie.py upload <files...>
    if sys.argv[1] == "upload":
        for p in sys.argv[2:]: print(p.split("/")[-1], "->", upload(p))
