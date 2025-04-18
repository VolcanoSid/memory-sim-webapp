from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from .logic import allocate, deallocate, get_memory_state

try:
    from .ai_module import suggest_strategy
    ai_enabled = True
except ImportError:
    ai_enabled = False

app = FastAPI()

# CORS: Allow all origins (adjust in prod)
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

@app.get("/memory")
async def get_memory_state_api():
    return get_memory_state()

@app.post("/suggest-strategy")
def get_suggestion(size: int):
    if not ai_enabled:
        raise HTTPException(status_code=501, detail="AI suggestion module not available")
    strategy = suggest_strategy(size)
    return {"suggested_strategy": strategy}

@app.post("/allocate")
async def allocate_memory(req: ProcessRequest, background_tasks: BackgroundTasks):
    normalized = req.strategy.strip().lower().replace(" ", "").replace("-", "").replace("_", "")

    if normalized not in ["firstfit", "bestfit", "worstfit"]:
        raise HTTPException(status_code=400, detail=f"Unknown strategy: {req.strategy}")

    result = allocate(req.pid, req.size, normalized)

    print("📦 ALLOCATION RESULT:", result)

    if result["status"] == "success":
        background_tasks.add_task(broadcast_update, get_memory_state())

    return result

@app.delete("/deallocate/{pid}")
async def deallocate_memory(pid: str, background_tasks: BackgroundTasks):
    result = deallocate(pid)
    if result["status"] == "failed":
        raise HTTPException(status_code=404, detail=result["reason"])

    background_tasks.add_task(broadcast_update, get_memory_state())
    return result

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    print("🟢 WebSocket connection open")

    try:
        await websocket.send_json(get_memory_state())

        while True:
            message = await websocket.receive_text()

            if message == "ping":
                # ✅ Keep-alive response
                await websocket.send_json(get_memory_state())
            else:
                print(f"⚠️ Unknown WebSocket message received: {message}")
    except WebSocketDisconnect:
        print("🔴 WebSocket disconnected")
        if websocket in clients:
            clients.remove(websocket)
    except Exception as e:
        print(f"🔥 WebSocket error: {e}")
        if websocket in clients:
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

@app.get("/process-log/{pid}")
async def get_process_log(pid: str):
    from .logic import allocation_log
    entries = [entry for entry in allocation_log if entry["pid"] == pid]
    return {"log": entries}
