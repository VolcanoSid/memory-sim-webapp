import React, { useState, useEffect, useRef } from "react";
import { allocateMemory, deallocateMemory, suggestStrategy } from "./services/api";
import { motion, AnimatePresence } from "framer-motion";
import MemoryChart from "./components/MemoryChart";
import "./index.css";

interface Block {
  label: string;
  value: number;
  color: string;
}

function App() {
  const [pid, setPid] = useState('');
  const [size, setSize] = useState(0);
  const [strategy, setStrategy] = useState('first_fit');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setRealtimeConnected(true);
    };

    socket.onmessage = (event) => {
      const memoryData = JSON.parse(event.data);
      setBlocks(parseMemory(memoryData));
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.warn("❌ WebSocket disconnected");
      setRealtimeConnected(false);
    };

    return () => socket.close();
  }, []);

  const parseMemory = (mem: string[]): Block[] => {
    return mem.map((blockStr) => {
      const parts = blockStr.split(' ');
      const [start, end] = parts[0].replace('[', '').replace(']', '').split('-').map(Number);
      const size = end - start + 1;
      const isFree = parts[1] === "Free";
      const color = isFree ? 'gray' : 'blue';
      return {
        label: blockStr,
        value: size,
        color
      };
    });
  };

  const handleAllocate = async () => {
    try {
      let backendStrategy = strategy.replace("_", "");

      const res = await allocateMemory(pid, size, backendStrategy);
      if (!res.memory) {
        alert(res.error || "Allocation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong during allocation.");
    }
  };

  const handleDeallocate = async () => {
    try {
      const res = await deallocateMemory(pid);
      if (!res.memory) {
        alert(res.reason || "Deallocation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong during deallocation.");
    }
  };

  const handleSuggest = async () => {
    try {
      const res = await suggestStrategy(size);
      const suggested = res.suggested_strategy;
      alert(`Suggested Strategy: ${suggested}`);
      setStrategy(suggested);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch suggestion.");
    }
  };

  const chartData = {
    labels: blocks.map((b) => b.label),
    datasets: [
      {
        data: blocks.map((b) => b.value),
        backgroundColor: blocks.map((b) => b.color),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold text-blue-600">Memory Allocator</h1>

      <div className="text-sm font-medium text-gray-600">
        {realtimeConnected ? "🟢 Real-time sync active" : "🔴 No real-time sync"}
      </div>

      <div className="flex gap-2">
        <input className="p-2 border rounded" placeholder="PID" value={pid} onChange={(e) => setPid(e.target.value)} />
        <input className="p-2 border rounded" type="number" placeholder="Size" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <select className="p-2 border rounded" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="first_fit">First Fit</option>
          <option value="best_fit">Best Fit</option>
          <option value="worst_fit">Worst Fit</option>
        </select>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAllocate}>Allocate</button>
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDeallocate}>Deallocate</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSuggest}>Suggest Strategy</button>
      </div>

      <div className="w-full max-w-2xl flex gap-1 mt-6">
        <AnimatePresence mode="popLayout">
          {blocks.map((block, index) => (
            <motion.div
              key={block.label + index}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: block.value * 2 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              className="text-xs text-center text-white rounded overflow-hidden"
              style={{
                backgroundColor: block.color,
                padding: '5px 0'
              }}
            >
              {block.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <MemoryChart data={chartData} />

      {blocks.length > 0 && (
        <div className="mt-8 w-full max-w-2xl bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Memory Table</h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Start</th>
                <th className="border px-2 py-1">End</th>
                <th className="border px-2 py-1">Size</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">PID</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, index) => {
                const parts = block.label.split(" ");
                const [start, end] = parts[0].replace("[", "").replace("]", "").split("-").map(Number);
                const isFree = parts[1] === "Free";
                return (
                  <tr key={index} className={isFree ? "bg-green-50" : "bg-red-50"}>
                    <td className="border px-2 py-1">{start}</td>
                    <td className="border px-2 py-1">{end}</td>
                    <td className="border px-2 py-1">{block.value}</td>
                    <td className="border px-2 py-1">{isFree ? "Free" : "Used"}</td>
                    <td className="border px-2 py-1">{isFree ? "-" : parts[1]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
