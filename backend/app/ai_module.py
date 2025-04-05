from .logic import memory

def suggest_strategy(size):
    free_blocks = [block for block in memory if block.is_free and block.size >= size]

    if not free_blocks:
        return "none"

    # Strategy comparisons
    first_fit = next((b for b in free_blocks), None)
    best_fit = min(free_blocks, key=lambda b: b.size)
    worst_fit = max(free_blocks, key=lambda b: b.size)

    fragmentation_first = first_fit.size - size if first_fit else float('inf')
    fragmentation_best = best_fit.size - size if best_fit else float('inf')
    fragmentation_worst = worst_fit.size - size if worst_fit else float('inf')

    # Pick strategy with least waste
    strategy_map = {
        "first_fit": fragmentation_first,
        "best_fit": fragmentation_best,
        "worst_fit": fragmentation_worst
    }

    best_strategy = min(strategy_map, key=strategy_map.get)
    return best_strategy

