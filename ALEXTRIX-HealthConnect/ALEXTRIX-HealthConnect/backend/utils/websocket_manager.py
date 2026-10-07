from typing import List
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.websockets: List[WebSocket] = []
    
    def add_websocket(self, websocket: WebSocket):
        self.websockets.append(websocket)
    
    def remove_websocket(self, websocket: WebSocket):
        if websocket in self.websockets:
            self.websockets.remove(websocket)
    
    async def broadcast_json(self, data: dict):
        """Envía un mensaje JSON a todos los websockets conectados"""
        disconnected = []
        for ws in self.websockets:
            try:
                await ws.send_json(data)
            except:
                disconnected.append(ws)
        
        # Remover websockets desconectados
        for ws in disconnected:
            self.remove_websocket(ws)

# Instancia global del manager
ws_manager = WebSocketManager()




