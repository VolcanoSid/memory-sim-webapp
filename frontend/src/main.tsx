import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ProcessFlow from './pages/ProcessFlow';
import ProcessLog from './pages/ProcessLog'; // ✅ correct
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/process/:pid" element={<ProcessFlow />} />
        <Route path="/log/:pid" element={<ProcessLog />} /> {/* ✅ NOW ACTIVE */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
