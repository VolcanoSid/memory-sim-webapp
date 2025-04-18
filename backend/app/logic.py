from datetime import datetime  # ✅ Correct usage

memory = []
allocation_log = []
history_log = []

class MemoryBlock:
    def __init__(self, start, size, is_free=True, pid=None):
        self.start = start
        self.size = size
        self.is_free = is_free
        self.pid = pid

    def __repr__(self):
        return f"[{self.start}-{self.start + self.size - 1}] {'Free' if self.is_free else self.pid}"

def log_action(action: str, pid: str, size: int, strategy: str, memory_snapshot: list):
    history_log.append({
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "pid": pid,
        "size": size,
        "strategy": strategy,
        "memory": memory_snapshot.copy()
    })

def get_history():
    return history_log[::-1]  # most recent first

def allocate(pid: str, size: int, strategy: str):
    global memory

    # 🚫 Prevent invalid sizes
    if size <= 0:
        return {"status": "failed", "reason": "Size must be greater than 0"}

    if not memory:
        memory.append(MemoryBlock(0, 100))  # default initialization

    strategy = strategy.lower().replace("-", "").replace("_", "").replace(" ", "")
    block_index = None

    if strategy == "firstfit":
        for i, block in enumerate(memory):
            if block.is_free and block.size >= size:
                block_index = i
                break

    elif strategy == "bestfit":
        best = None
        for i, block in enumerate(memory):
            if block.is_free and block.size >= size:
                if best is None or block.size < memory[best].size:
                    best = i
        block_index = best

    elif strategy == "worstfit":
        worst = None
        for i, block in enumerate(memory):
            if block.is_free and block.size >= size:
                if worst is None or block.size > memory[worst].size:
                    worst = i
        block_index = worst

    else:
        return {"status": "failed", "reason": f"Unknown strategy: {strategy}"}

    if block_index is None:
        return {"status": "failed", "reason": "No suitable block found"}

    block = memory[block_index]

    if block.size > size:
        new_block = MemoryBlock(block.start + size, block.size - size)
        memory.insert(block_index + 1, new_block)

    block.size = size
    block.is_free = False
    block.pid = f"{pid} ({strategy.replace('_', '-').title()})"

    allocation_log.append({
        "pid": pid,
        "range": f"[{block.start}-{block.start + size - 1}]",
        "size": size,
        "timestamp": datetime.now().isoformat(),
        "strategy": strategy,
        "status": "active"
    })

    print("📘 Allocation Log:", allocation_log)

    return {
        "status": "success",
        "pid": pid,
        "range": f"[{block.start}-{block.start + size - 1}]",
        "size": size,
        "timestamp": datetime.now().isoformat(),
        "strategy": strategy,
        "allocation_status": "active"
    }
def deallocate(pid: str):
    global memory

    found = False
    for block in memory:
        if block.pid and block.pid.startswith(pid):
            block.is_free = True
            block.pid = None
            found = True

            for entry in allocation_log:
                if entry["pid"] == pid and entry["status"] == "active":
                    entry["status"] = "deallocated"
                    break

    if not found:
        return {"status": "failed", "reason": f"Process {pid} not found"}

    i = 0
    while i < len(memory) - 1:
        if memory[i].is_free and memory[i + 1].is_free:
            memory[i].size += memory[i + 1].size
            del memory[i + 1]
        else:
            i += 1

    log_action("deallocate", pid, 0, "", [str(b) for b in memory])

    return {
        "status": "success",
        "pid": pid,
        "memory": [str(b) for b in memory]
    }

def get_memory_state():
    global memory
    return {
        "status": "success",
        "memory": [str(b) for b in memory]
    }
