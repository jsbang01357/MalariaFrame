import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response

FRONTEND_DIR = (Path(__file__).resolve().parent / "frontend").resolve()
ENTRY_FILE = "malaria.html"

app = FastAPI(title="MalariaFrame")

@app.get("/api/health")
async def health(_request: Request):
    return JSONResponse({"ok": True, "service": "malariaframe", "stores_patient_data": False})

async def frontend(request: Request):
    path = request.path_params.get("path") or ENTRY_FILE
    if path.startswith("api/"):
        return JSONResponse({"error": "not found"}, status_code=404)
    target = (FRONTEND_DIR / path).resolve()
    if FRONTEND_DIR not in target.parents and target != FRONTEND_DIR:
        return Response("not found", status_code=404)
    if target.is_dir():
        target = target / ENTRY_FILE
    if not target.exists() and Path(path).suffix:
        return Response("not found", status_code=404)
    if not target.exists():
        target = FRONTEND_DIR / ENTRY_FILE
    if target == (FRONTEND_DIR / ENTRY_FILE).resolve():
        return Response(target.read_text(encoding="utf-8"), media_type="text/html")
    media_type = mimetypes.guess_type(target.name)[0]
    return FileResponse(target, media_type=media_type)

@app.get("/")
async def frontend_root(request: Request):
    return await frontend(request)

@app.get("/{path:path}")
async def frontend_path(request: Request, path: str):
    return await frontend(request)
