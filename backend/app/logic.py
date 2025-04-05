class MemoryBlock:
    def __init__(self, start, size, is_free=True, pid=None):
        self.start = start
        self.size = size
        self.is_free = is_free
        self.pid = pid

    def __repr__(self):
        return f"[{self.start}-{self.start + self.size - 1}] {'Free' if self.is_free else self.pid}"


# Initialize memory as a list of one free block (100 units)
memory = [MemoryBlock(0, 100)]


def allocate(pid: str, size: int, strategy: str):
    global memory

    # ✅ Normalize strategy input
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
        return {"error": f"Unknown strategy: {strategy}"}

    if block_index is None:
        return {"status": "failed", "reason": "No suitable block found"}

    block = memory[block_index]

    if block.size > size:
        # Split the block
        new_block = MemoryBlock(block.start + size, block.size - size)
        memory.insert(block_index + 1, new_block)

    block.size = size
    block.is_free = False
    block.pid = f"{pid} ({strategy.replace('_', '-').title()})"

    return {
        "status": "success",
        "pid": pid,
        "start": block.start,
        "end": block.start + size - 1,
        "strategy": strategy,
        "memory": [str(b) for b in memory]
    }


def deallocate(pid: str):
    global memory

    found = False
    for block in memory:
        if block.pid == pid:
            block.is_free = True
            block.pid = None
            found = True

    if not found:
        return {"status": "failed", "reason": f"Process {pid} not found"}

    # Merge adjacent free blocks
    i = 0
    while i < len(memory) - 1:
        if memory[i].is_free and memory[i + 1].is_free:
            memory[i].size += memory[i + 1].size
            del memory[i + 1]
        else:
            i += 1

    return {
        "status": "success",
        "pid": pid,
        "memory": [str(b) for b in memory]
    }
