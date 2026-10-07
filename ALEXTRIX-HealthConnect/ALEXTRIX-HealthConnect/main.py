from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Imports locales
from backend.database import engine, Base
from backend.routers import sensores
from backend.utils.websocket_manager import ws_manager

# -----------------------------------------------------------
# 🔹 CONFIGURACIÓN GENERAL
# -----------------------------------------------------------
app = FastAPI(title="ALEXTRIX HealthConnect API", version="2.0")

# Permitir acceso desde el dashboard web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas en la base de datos
Base.metadata.create_all(engine)

# -----------------------------------------------------------
# 🔹 MODELO DE DATOS RECIBIDOS DEL SMARTWATCH
# -----------------------------------------------------------
class SensorData(BaseModel):
    idUsuario: str
    frecuenciaCardiaca: float
    alerta: str | None = "Normal"
    gps: dict
    timestamp: str

# -----------------------------------------------------------
# 🔹 INCLUSIÓN DE ROUTERS
# -----------------------------------------------------------
app.include_router(sensores.router)

# -----------------------------------------------------------
# 🔹 ENDPOINT PRINCIPAL
# -----------------------------------------------------------
@app.get("/")
def home():
    return {"message": "Servidor ALEXTRIX activo ✅", "version": "2.0"}


# -----------------------------------------------------------
# 🔹 WEBSOCKET - Enviar datos en tiempo real al dashboard
# -----------------------------------------------------------
@app.websocket("/ws/datos")
async def websocket_datos(ws: WebSocket):
    await ws.accept()
    ws_manager.add_websocket(ws)
    try:
        while True:
            await ws.receive_text()
    except:
        ws_manager.remove_websocket(ws)
