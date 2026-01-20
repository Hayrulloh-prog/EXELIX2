import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m, ms = 3000) => {
    setMsg(m);
    if (ms > 0) setTimeout(() => setMsg(null), ms);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && <div className="toast" role="alert">{msg}</div>}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx) || (() => {});
}
