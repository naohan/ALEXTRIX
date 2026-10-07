from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database import get_session
from ..models import Registro
from ..utils.alerts import analizar_datos_criticos
from ..utils.websocket_manager import ws_manager

router = APIRouter()

# -----------------------------------------------------------
# 🔹 MODELO DE DATOS RECIBIDOS DEL SMARTWATCH
# -----------------------------------------------------------
class SensorData(BaseModel):
    idUsuario: str
    frecuenciaCardiaca: float
    alerta: str | None = "Normal"
    gps: dict
    timestamp: str

@router.get("/api/sensores")
def obtener_todos(session: Session = Depends(get_session)):
    """Endpoint para listar todos los registros - tabla histórica"""
    registros = session.query(Registro).order_by(Registro.id.desc()).limit(50).all()
    return [
        {
            "idUsuario": r.idUsuario,
            "frecuenciaCardiaca": r.frecuenciaCardiaca,
            "gps": {"lat": r.lat, "lon": r.lon},
            "timestamp": r.timestamp,
            "hora_recepcion": r.hora_recepcion
        }
        for r in registros
    ]

@router.get("/api/sensores/ultimo")
def obtener_ultimo(session: Session = Depends(get_session)):
    """Obtener el último registro"""
    ultimo = session.query(Registro).order_by(Registro.id.desc()).first()
    if not ultimo:
        return {"mensaje": "No hay registros todavía"}
    return {
        "idUsuario": ultimo.idUsuario,
        "frecuenciaCardiaca": ultimo.frecuenciaCardiaca,
        "gps": {"lat": ultimo.lat, "lon": ultimo.lon},
        "timestamp": ultimo.timestamp,
        "hora_recepcion": ultimo.hora_recepcion
    }

@router.post("/api/sensores")
async def recibir_datos(data: SensorData, session: Session = Depends(get_session)):
    """Endpoint POST para recibir datos del smartwatch con análisis de alertas"""
    try:
        lat = float(data.gps["lat"])
        lon = float(data.gps["lon"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=422, detail="gps debe incluir lat y lon numéricos")

    registro = Registro(
        idUsuario=data.idUsuario,
        frecuenciaCardiaca=data.frecuenciaCardiaca,
        lat=lat,
        lon=lon,
        timestamp=data.timestamp
    )
    session.add(registro)
    session.commit()

    # Usar la alerta que viene del cliente, o generar una si no viene o es "Normal"
    alerta_final = data.alerta
    
    # Si no viene alerta o es "Normal", analizar datos críticos para generar alerta
    if not alerta_final or alerta_final == "Normal":
        alerta_generada = analizar_datos_criticos(data.frecuenciaCardiaca)
        if alerta_generada:
            alerta_final = alerta_generada

    # Preparar datos para WebSocket con la alerta
    datos_websocket = {
        "idUsuario": data.idUsuario,
        "frecuenciaCardiaca": data.frecuenciaCardiaca,
        "alerta": alerta_final or "Normal",
        "gps": data.gps,
        "timestamp": data.timestamp
    }

    # Enviar dato en tiempo real por WebSocket al dashboard
    await ws_manager.broadcast_json(datos_websocket)

    response = {"status": "ok", "mensaje": "Dato guardado correctamente"}
    if alerta_final and alerta_final != "Normal":
        response["alerta"] = alerta_final
    
    return response
