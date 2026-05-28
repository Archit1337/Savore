import React, { createContext, useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast notifications after 2.5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message) => {
    setToast({ message });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 🔮 Apple-Style Glassmorphic Toast Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 15, scale: 0.98, x: '-50%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glassmorphic-toast fixed bottom-10 left-1/2 py-3 px-[22px] rounded-2xl text-sm font-medium flex items-center justify-center z-[999999] pointer-events-none leading-[1.4]"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
