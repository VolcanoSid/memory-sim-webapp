import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface LogEntry {
  pid: string;
  range: string;
  size: number;
  timestamp: string;
  strategy: string;
  status: string;
}

const ProcessLog = () => {
  const { pid } = useParams();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLog = async () => {
      try {
        const res = await fetch(`http://localhost:8000/process-log/${pid}`);
        const data = await res.json();
        setLog(data.log || []);
      } catch (err) {
        console.error("Failed to fetch process log:", err);
      } finally {
        setLoading(false);
      }
    };

    if (pid) {
      fetchLog(); // initial call
      interval = setInterval(fetchLog, 2000); // auto-refresh
    }

    return () => clearInterval(interval);
  }, [pid]);

  const handleDownloadCSV = () => {
    if (!log.length) return;

    const headers = ["Timestamp", "Memory Range", "Size", "Strategy", "Status"];
    const rows = log.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.range,
      entry.size.toString(),
      entry.strategy,
      entry.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `process_log_${pid}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-300">
        📜 Process Log for PID: {pid}
      </h1>

      {loading ? (
        <div className="text-center text-lg animate-pulse">Loading...</div>
      ) : log.length === 0 ? (
        <div className="text-center text-red-500">No log entries found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-300 dark:border-gray-700 rounded shadow">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Memory Range</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Strategy</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, i) => (
                <tr key={i} className="border-t border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-2">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2">{entry.range}</td>
                  <td className="px-4 py-2">{entry.size}</td>
                  <td className="px-4 py-2 capitalize">{entry.strategy}</td>
                  <td className="px-4 py-2 capitalize">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        entry.status === "active"
                          ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                          : "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-6 flex justify-center gap-4 flex-wrap">
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          🔙 Back to Memory Panel
        </Link>
        <button
          onClick={handleDownloadCSV}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded shadow"
        >
          ⬇️ Download CSV
        </button>
      </div>
    </div>
  );
};

export default ProcessLog;
