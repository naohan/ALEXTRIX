from typing import Optional

def analizar_datos_criticos(frecuencia_cardiaca: float) -> Optional[str]:
    """
    Analiza la frecuencia cardíaca y detecta valores críticos
    
    Args:
        frecuencia_cardiaca: Frecuencia cardíaca del usuario
    
    Returns:
        str: Mensaje de alerta si se detecta un valor crítico, None en caso contrario
    """
    alerta = None
    
    if frecuencia_cardiaca > 130:
        alerta = "⚠️ Estrés alto"
    elif frecuencia_cardiaca < 50:
        alerta = "⚠️ Frecuencia cardíaca baja"
    
    return alerta




