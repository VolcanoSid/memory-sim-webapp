import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

// Register chart.js modules
Chart.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ["Used", "Free"],
  datasets: [
    {
      data: [60, 40], // Example values, update dynamically as needed
      backgroundColor: ["#3b82f6", "#d1d5db"], // blue and gray
      hoverOffset: 4,
    },
  ],
};

export default function MemoryChart() {
  return (
    <div className="w-64 h-64 mt-4 bg-white rounded p-4 shadow">
      <Doughnut data={data} />
    </div>
  );
}
