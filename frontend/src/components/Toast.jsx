import React, { useState, useEffect, useCallback } from 'react';

let toastId = 0;
let addToastFn = null;

export function useToast() {
  const showToast = useCallback((message, type = 'info') => {
    if (addToastFn) addToastFn({ message, type, id: ++toastId });
  }, []);
  return { showToast };
}

const typeConfig = {
  success: { bg: 'bg-white border-green-400', icon: '✓', iconBg: 'bg-green-500', text: 'text-primary' },
  error:   { bg: 'bg-white border-red-400',   icon: '✕', iconBg: 'bg-red-500',   text: 'text-primary' },
  warning: { bg: 'bg-white border-amber-400',  icon: '!', iconBg: 'bg-amber-500', text: 'text-primary' },
  info:    { bg: 'bg-white border-accent',     icon: 'i', iconBg: 'bg-accent',    text: 'text-primary' },
};

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const cfg = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-card border-l-4 shadow-card
                  text-sm cursor-pointer animate-slideIn ${cfg.bg} max-w-sm`}
      onClick={() => onRemove(toast.id)}
    >
      <span className={`w-6 h-6 rounded-full ${cfg.iconBg} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
        {cfg.icon}
      </span>
      <span className={`${cfg.text} flex-1 text-[13px]`}>{toast.message}</span>
      <button className="text-secondary hover:text-primary ml-1 text-base leading-none">×</button>
    </div>
  );
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => setToasts((p) => [...p, t]);
    return () => { addToastFn = null; };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
