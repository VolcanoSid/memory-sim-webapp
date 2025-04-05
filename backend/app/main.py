from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from .logic import allocate, deallocate

try:
    from .ai_module import suggest_strategy
    ai_enabled = True
except ImportError:
    ai_enabled = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients: List[WebSocket] = []

class ProcessRequest(BaseModel):
    pid: str
    size: int
    strategy: str

@app.get("/")
def read_root():
    return {"message": "Memory Allocation API is working"}

@app.post("/suggest-strategy")
def get_suggestion(size: int):
    if not ai_enabled:
        raise HTTPException(status_code=501, detail="AI suggestion module not available")
    strategy = suggest_strategy(size)
    return {"suggested_strategy": strategy}

@app.post("/allocate")
async def allocate_memory(req: ProcessRequest, background_tasks: BackgroundTasks):
    strategy = req.strategy.strip().lower().replace(" ", "").replace("-", "")

    if strategy == "firstfit":
        normalized = "first_fit"
    elif strategy == "bestfit":
        normalized = "best_fit"
    elif strategy == "worstfit":
        normalized = "worst_fit"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown strategy: {req.strategy}")

    result = allocate(req.pid, req.size, normalized)
    background_tasks.add_task(broadcast_update, result)
    return result

@app.delete("/deallocate/{pid}")
async def deallocate_memory(pid: str, background_tasks: BackgroundTasks):
    result = deallocate(pid)
    if result["status"] == "failed":
        raise HTTPException(status_code=404, detail=result["reason"])
    background_tasks.add_task(broadcast_update, result)
    return result

# WebSocket route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  
    except WebSocketDisconnect:
        clients.remove(websocket)

async def broadcast_update(memory_state: dict):
    disconnected = []
    for client in clients:
        try:
            await client.send_json(memory_state)
        except:
            disconnected.append(client)
    for dc in disconnected:
        clients.remove(dc)
