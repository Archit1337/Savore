import React, { createContext, useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Pause, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const ToastContext = createContext();

const getNotificationDetails = (message = "") => {
  const msg = message.toLowerCase();
  
  if (msg.includes('added to cart') || msg.includes('cart') || msg.includes('checkout')) {
    return {
      title: 'ATELIER CART',
      icon: <ShoppingBag size={14} className="text-[#FF6A4D]" />,
      color: '#FF6A4D',
      cleanMessage: message.replace('✓', '').trim()
    };
  }
  
  if (msg.includes('liked') || msg.includes('❤️')) {
    return {
      title: 'FAVORITES',
      icon: <Heart size={14} fill="#FF4B4B" className="text-[#FF4B4B] animate-pulse" />,
      color: '#FF4B4B',
      cleanMessage: message.replace('❤️', '').trim()
    };
  }

  if (msg.includes('paused') || msg.includes('⏸️')) {
    return {
      title: 'CINEMA FEED',
      icon: <Pause size={14} className="text-[#38BDF8]" />,
      color: '#38BDF8',
      cleanMessage: message.replace('⏸️', '').trim()
    };
  }

  if (msg.includes('playing') || msg.includes('▶️')) {
    return {
      title: 'CINEMA FEED',
      icon: <Play size={14} fill="#38BDF8" className="text-[#38BDF8]" />,
      color: '#38BDF8',
      cleanMessage: message.replace('▶️', '').trim()
    };
  }

  if (msg.includes('clear') || msg.includes('cleared') || msg.includes('conversation cleared')) {
    return {
      title: 'SYSTEM UPDATE',
      icon: <RefreshCw size={14} className="text-[#818CF8]" />,
      color: '#818CF8',
      cleanMessage: message.replace('✓', '').trim()
    };
  }

  if (msg.includes('⚠️') || msg.includes('failed') || msg.includes('error')) {
    return {
      title: 'SYSTEM ALERT',
      icon: <AlertCircle size={14} className="text-[#FBBF24]" />,
      color: '#FBBF24',
      cleanMessage: message.replace('⚠️', '').trim()
    };
  }

  return {
    title: 'SAVORÉ SYSTEM',
    icon: <Sparkles size={14} className="text-[#A78BFA]" />,
    color: '#A78BFA',
    cleanMessage: message
  };
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast notifications after 2.8s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message) => {
    // Generate a unique ID (timestamp) to force key changes on successive triggers
    setToast({ message, id: Date.now() });
  };

  const details = toast ? getNotificationDetails(toast.message) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* 🟢 Apple Dynamic Island Notification System */}
      <div className="fixed bottom-10 left-0 right-0 z-[999999] pointer-events-none select-none flex justify-center h-[48px]">
        <div className="relative w-[320px] max-w-[92vw] h-full flex justify-center items-center">
          <AnimatePresence>
            {toast && details && (
              <motion.div
                key={toast.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0.85, 
                  width: 70, 
                  height: 30, 
                  borderRadius: 15,
                  y: 10
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  width: 320, 
                  height: 48, 
                  borderRadius: 24,
                  y: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.85, 
                  width: 70, 
                  height: 30, 
                  borderRadius: 15,
                  y: 15
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 420, 
                  damping: 28 
                }}
                className="absolute bg-black border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-between px-4 overflow-hidden max-w-[92vw] pointer-events-auto"
                style={{
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 1.5px rgba(255,255,255,0.06)'
                }}
              >
                {/* Contents fade-in slightly after the pill expands to prevent text wrapping during morph */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: 0.08 }}
                  className="flex items-center w-full justify-between gap-3"
                >
                  {/* Left Side: Dynamic Icon Capsule */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/5 shadow-inner shrink-0">
                    {details.icon}
                  </div>

                  {/* Center Content: Title + Subtitle */}
                  <div className="flex-grow flex flex-col justify-center text-left min-w-0">
                    <span className="text-[9px] font-bold text-white/40 tracking-[0.1em] uppercase leading-none mb-0.5">
                      {details.title}
                    </span>
                    <span className="text-[12px] font-medium text-white truncate leading-tight">
                      {details.cleanMessage}
                    </span>
                  </div>

                  {/* Right Side: Live Pulse Dot / Savoré Halo */}
                  <div className="flex items-center gap-1.5 pr-1 shrink-0 relative w-1.5 h-1.5">
                    <div 
                      className="w-1.5 h-1.5 rounded-full animate-ping absolute"
                      style={{ backgroundColor: details.color }}
                    />
                    <div 
                      className="w-1.5 h-1.5 rounded-full absolute"
                      style={{ backgroundColor: details.color }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
