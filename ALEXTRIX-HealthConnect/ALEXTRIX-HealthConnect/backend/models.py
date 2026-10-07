from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from .database import Base

class Registro(Base):
    __tablename__ = "registros"

    id = Column(Integer, primary_key=True, autoincrement=True)
    idUsuario = Column(String(50))
    frecuenciaCardiaca = Column(Float)
    lat = Column(Float)
    lon = Column(Float)
    timestamp = Column(String(50))
    hora_recepcion = Column(DateTime, default=datetime.utcnow)




