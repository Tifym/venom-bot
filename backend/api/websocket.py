from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog
import asyncio
from typing import List

logger = structlog.get_logger()
router = APIRouter()

class FrontendConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("frontend_ws_connected", total=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("frontend_ws_disconnected", total=len(self.active_connections))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error("frontend_ws_broadcast_error", error=str(e))

frontend_ws_manager = FrontendConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await frontend_ws_manager.connect(websocket)
    try:
        while True:
            # Prevent closing by keeping connection alive
            data = await websocket.receive_text()
            # We don't expect client to send much, mostly read-only
    except WebSocketDisconnect:
        frontend_ws_manager.disconnect(websocket)
