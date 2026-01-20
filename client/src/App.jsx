import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import QrGate from './pages/QrGate';
import Register from './pages/Register';
import Cabinet from './pages/Cabinet';
import Notify from './pages/Notify';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';

function getTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem('exelix_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
}

function App() {
  const [theme, setThemeState] = useState(getTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const setTheme = (v) => {
    const next = v || (theme === 'dark' ? 'light' : 'dark');
    setThemeState(next);
    localStorage.setItem('exelix_theme', next);
    applyTheme(next);
  };

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/q/demo" replace />} />
        <Route path="/q/:code" element={<QrGate theme={theme} onTheme={setTheme} />} />
        <Route path="/register" element={<Register theme={theme} onTheme={setTheme} />} />
        <Route path="/cabinet" element={<Cabinet theme={theme} onTheme={setTheme} />} />
        <Route path="/notify" element={<Notify theme={theme} onTheme={setTheme} />} />
        <Route path="/admin" element={<AdminLogin theme={theme} onTheme={setTheme} />} />
        <Route path="/admin/dash" element={<Admin theme={theme} onTheme={setTheme} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
