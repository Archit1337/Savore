// Savoré — Premium SafeAvatar Component with Initials & SVG Fallback
// All styling via explicit inline CSS — NO Tailwind dependency
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SafeAvatar({
  src,
  alt = 'Savoré User',
  size = 28,
  className = '',
  style = {},
}) {
  const [status, setStatus] = useState('loading'); // loading, loaded, error

  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  // Derive initials from alt string
  const getInitials = (name) => {
    if (!name) return 'S';
    // Strip @ prefix if present
    const clean = name.replace(/^@/, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Container circular layout - styled via Tailwind classes
  return (
    <div 
      className={`rounded-full overflow-hidden flex items-center justify-center relative shrink-0 select-none bg-surface shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        ...style,
      }}
    >

      {/* 1. Shimmer loading state */}
      <AnimatePresence>
        {status === 'loading' && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,_var(--surface)_25%,_var(--surface-bright)_50%,_var(--surface)_75%)] bg-[length:200%_100%] animate-[shimmerPulse_1.8s_infinite_linear]"
          />
        )}
      </AnimatePresence>

      {/* 2. Actual image — fully styled via Tailwind classes */}
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full object-cover object-center rounded-full block transition-opacity duration-350 ease-in-out ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Initials / SVG fallback */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-full flex items-center justify-center text-white font-bold tracking-tight font-sans bg-gradient-to-br from-primary-hover to-primary"
            style={{
              fontSize: `${Math.max(10, size * 0.38)}px`,
            }}
          >
            {alt && alt !== 'Savoré User' && alt !== 'user profile' && alt !== 'comment user' ? (
              // Show derived initials
              <span className="leading-none select-none">
                {getInitials(alt)}
              </span>
            ) : (
              // Premium generic user SVG
              <svg
                width={Math.max(12, size * 0.52)}
                height={Math.max(12, size * 0.52)}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 21C20 19.6 19.4 18.2 18.4 17.2C17.4 16.2 16 15.6 14.6 15.6H9.4C8 15.6 6.6 16.2 5.6 17.2C4.6 18.2 4 19.6 4 21"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
