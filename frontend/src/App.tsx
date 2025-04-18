import React, { useState, useEffect, useRef } from "react";
import { allocateMemory, deallocateMemory, suggestStrategy } from "./services/api";
import { motion, AnimatePresence } from "framer-motion";
import MemoryChart from "./components/MemoryChart";
import "./index.css";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (socketRef.current) return; // Prevent multiple connections
  
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
  
    const connectWebSocket = () => {
      console.log("🌐 Attempting WebSocket connection...");
      socket = new WebSocket("ws://127.0.0.1:8000/ws");
      socketRef.current = socket;
  
      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        setRealtimeConnected(true);
        reconnectAttempts = 0;
        socket?.send("ping"); // Keep-alive or handshake
      };
  
      socket.onmessage = (event) => {
        try {
          const memoryData = JSON.parse(event.data);
          if (Array.isArray(memoryData.memory)) {
            setBlocks(parseMemory(memoryData.memory));
          } else {
            console.error("Unexpected WebSocket format:", memoryData);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
  
      socket.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
      };
  
      socket.onclose = () => {
        console.warn("⚠️ WebSocket disconnected");
        setRealtimeConnected(false);
  
        if (reconnectAttempts < 5) {
          const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, timeout);
        } else {
          console.error("🚫 Max reconnect attempts reached. WebSocket not reconnecting.");
        }
      };
    };
  
    connectWebSocket();
  
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socket?.close();
      socketRef.current = null;
    };
  }, []);
  
  const parseMemory = (mem: string[]): Block[] => {
    return mem.map((blockStr) => {
      const parts = blockStr.split(' ');
      const [start, end] = parts[0].replace('[', '').replace(']', '').split('-').map(Number);
      const size = end - start + 1;
      const isFree = parts[1] === "Free";
      const color = isFree ? '#6ee7b7' : '#3b82f6';
      return {
        label: blockStr,
        value: size,
        color,
      };
    });
  };

  const handleAllocate = async () => {
    if (!pid.trim()) {
      alert("Process ID is required for allocation.");
      return;
    }
  
    try {
      const res = await allocateMemory(pid, size, strategy.replace("_", ""));
  
      console.log("📦 Allocate response:", res);
  
      if (res.status === "sucess") {
        navigate(`/process/${pid}`);
      }
  
      const memoryRes = await fetch("http://localhost:8000/memory");
      const memoryData = await memoryRes.json();
      const match = memoryData.memory?.find((block: string) => block.includes(pid));
  
      if (match) {
        alert("⚠️ Allocation succeeded, but backend reported failure.\nProceeding anyway.");
        navigate(`/process/${pid}`);
      } else {
        alert(res.error || res.reason || "❌ Allocation failed.");
      }
    } catch (err) {
      console.error("🚨 Allocation crashed:", err);
      alert("Something went wrong while allocating memory. Please check backend/server status.");
    }
  };

  const handleDeallocate = async () => {
    if (!pid.trim()) {
      alert("Process ID is required for deallocation.");
      return;
    }
    try {
      const res = await deallocateMemory(pid);
      if (res.status !== "success") {
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

  const handleDownloadCSV = () => {
    const headers = "Start,End,Size,Status,PID\n";
    const rows = blocks.map(block => {
      const parts = block.label.split(" ");
      const [start, end] = parts[0].replace('[', '').replace(']', '').split('-');
      const isFree = parts[1] === "Free";
      const pid = isFree ? "-" : parts[1];
      const status = isFree ? "Free" : "Used";
      return `${start},${end},${block.value},${status},${pid}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "memory_process_table.csv";
    a.click();
  };

  const totalMemory = blocks.reduce((sum, b) => sum + b.value, 0);
  const usedMemory = blocks.filter(b => b.color !== '#6ee7b7').reduce((sum, b) => sum + b.value, 0);
  const usedPercent = totalMemory > 0 ? ((usedMemory / totalMemory) * 100).toFixed(1) : "0";
  const freeMemory = totalMemory - usedMemory;
  const processCount = blocks.filter(b => b.color !== '#6ee7b7').length;

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 drop-shadow-md">Memory Allocator</h1>

      <div className="text-sm font-medium">
        {realtimeConnected ? "🟢 Real-time sync active" : "🔴 No real-time sync"}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <input className="p-2 border rounded" placeholder="PID" value={pid} onChange={(e) => setPid(e.target.value)} />
        <input className="p-2 border rounded" type="number" placeholder="Size" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <select className="p-2 border rounded" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="first_fit">First Fit</option>
          <option value="best_fit">Best Fit</option>
          <option value="worst_fit">Worst Fit</option>
        </select>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow" onClick={handleAllocate}>Allocate</button>
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow" onClick={handleDeallocate}>Deallocate</button>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow" onClick={handleSuggest}>Suggest Strategy</button>
        <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded shadow" onClick={toggleDarkMode}>Toggle Dark</button>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded shadow" onClick={handleDownloadCSV}>Download Table</button>
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded shadow"
          onClick={() => {
            if (pid) {
              window.location.href = `/log/${pid}`;
            } else {
              alert("Enter a PID to view its log.");
            }
          }}
        >
          View Log
        </button>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-12 gap-1 mt-8">
        <AnimatePresence mode="popLayout">
          {blocks.map((block, index) => (
            <motion.div
              key={block.label + index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-1 text-xs text-center text-white rounded shadow-sm"
              style={{ width: `${block.value * 5}px`, backgroundColor: block.color, padding: '6px 2px' }}
            >
              <span title={block.label}>{block.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-2xl mt-6">
        <MemoryChart data={{
          labels: blocks.map((b) => b.label),
          datasets: [
            {
              data: blocks.map((b) => b.value),
              backgroundColor: blocks.map((b) => b.color),
              borderWidth: 1,
            },
          ]
        }} />
      </div>

      <div className="w-full max-w-2xl mt-4 bg-white dark:bg-gray-800 p-4 rounded shadow-md">
        <h2 className="text-lg font-semibold mb-2">📊 Memory Usage Stats</h2>
        <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden mb-2">
          <div
            className="h-4 bg-blue-500"
            style={{ width: `${usedPercent}%` }}
          ></div>
        </div>
        <p><strong>Used:</strong> {usedMemory} / {totalMemory} ({usedPercent}%)</p>
        <p><strong>Free:</strong> {freeMemory}</p>
        <p><strong>Processes:</strong> {processCount}</p>
      </div>
    </div>
  );
}

export default App;
