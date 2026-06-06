// Savoré — Premium SafeImage Component with Matte Shimmer & Luxury Vector Fallback
// All styling via explicit inline CSS — NO Tailwind dependency
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SafeImage({
  src,
  alt = 'Savoré Culinary Selection',
  className = '',
  style = {},
  placeholderClassName = '',
}) {
  const [status, setStatus] = useState('loading'); // loading, loaded, error
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setStatus('loading');
    setImgSrc(src);
  }, [src]);

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  // Container fills its parent — styled via clean Tailwind classes
  return (
    <div 
      className={`block w-full h-full relative overflow-hidden select-none ${className}`} 
      style={style}
    >

      {/* 1. Shimmer loading state — uses global shimmerPulse keyframe */}
      <AnimatePresence>
        {status === 'loading' && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,_var(--surface)_25%,_var(--surface-bright)_50%,_var(--surface)_75%)] bg-[length:200%_100%] animate-[shimmerPulse_1.8s_infinite_linear]"
          >
            <div className="absolute inset-0 bg-black/[0.18] backdrop-blur-[2px]" />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.04] relative z-[1]"
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-4 h-4 rounded-full bg-gradient-to-br from-[#FF6B52] to-[#FF5A3C]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Actual image — fully styled via Tailwind classes */}
      {status !== 'error' && (
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={`block w-full h-full object-cover object-center transition-opacity duration-550 ease-in-out will-change-[opacity] ${
            status === 'loaded' ? 'opacity-100 static' : 'opacity-0 absolute'
          }`}
        />
      )}

      {/* 3. Luxury failover plate illustration */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            key="error-fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center border border-light bg-[radial-gradient(circle_at_center,_var(--surface-bright)_0%,_var(--surface)_100%)]"
          >
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-b from-white/[0.05] to-transparent mb-2.5"
            >
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary filter drop-shadow-[0_2px_8px_rgba(255,90,60,0.35)]"
              >
                <path d="M2 17C2 18.1 4.5 19 12 19C19.5 19 22 18.1 22 17C22 15.9 19.5 15 12 15C4.5 15 2 15.9 2 17Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 14.5C5 14.5 5 7 12 7C19 7 19 14.5 19 14.5"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 7V4M12 7C11.4477 7 11 6.55228 11 6C11 5.44772 11.4477 5 12 5C12.5523 5 13 5.44772 13 6C13 6.55228 12.5523 7 12 7Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary mb-1 font-sans">
              Savoré Selection
            </span>
            <p className="text-[10px] text-text-muted leading-normal font-light m-0 font-sans">
              Culinary display preparing...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
