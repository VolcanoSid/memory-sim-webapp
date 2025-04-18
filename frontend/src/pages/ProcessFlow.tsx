import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface Block {
  label: string;
  value: number;
  color: string;
}

const steps = [
  "🧬 Creating process...",
  "📈 Selecting strategy...",
  "📦 Finding memory block...",
  "✅ Allocating memory...",
];

const ProcessFlow = () => {
  const { pid } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [blockInfo, setBlockInfo] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch("http://localhost:8000/memory");
        const data = await res.json();
        const blocks: string[] = data.memory;

        const match = blocks.find((block) => block.includes(pid || ""));
        if (match) {
          setBlockInfo(match); // e.g., "[100-149] P2"
        }
      } catch (err) {
        console.error("Failed to fetch memory block:", err);
      }
    };

    if (pid) {
      fetchMemory();
    }
  }, [pid]);

  return (
    <div className="min-h-screen p-8 text-center text-gray-800 dark:text-white bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-300">
        🚀 Process Flow for PID: {pid}
      </h1>

      <div className="max-w-xl mx-auto flex flex-col gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`transition-all duration-500 p-4 rounded shadow ${
              index <= currentStep
                ? "bg-green-100 dark:bg-green-800"
                : "bg-gray-200 dark:bg-gray-700 opacity-30"
            }`}
          >
            <span className="text-lg">{step}</span>
          </div>
        ))}

        {currentStep === steps.length - 1 && blockInfo && (
          <div className="bg-blue-100 dark:bg-blue-800 mt-4 p-4 rounded shadow">
            <p className="text-lg">
              🧠 <strong>Memory Allocated:</strong> <code>{blockInfo}</code>
            </p>
          </div>
        )}
      </div>

      {currentStep === steps.length - 1 && (
        <div className="mt-6">
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            🔙 Back to Memory Panel
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProcessFlow;
