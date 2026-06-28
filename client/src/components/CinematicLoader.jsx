// Savoré — Premium Cinematic Loader System
// 100% Modular, Isolated, and High-Performance (Stable 60fps GPU execution)

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

// 🍽️ Minimal Luxury Outline SVGs
const ChefHatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M6 18V17a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" />
    <path d="M5 14c-1.5-1.5-1-4 .5-5 .8-.5 1.7-.5 2.5 0M19 14c1.5-1.5 1-4-.5-5-.8-.5-1.7-.5-2.5 0" />
    <path d="M8 9a4 4 0 0 1 8 0" />
    <rect x="7" y="17" width="10" height="3" rx="1.5" />
  </svg>
);

const SushiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <ellipse cx="12" cy="12" rx="9" ry="5" />
    <ellipse cx="12" cy="12" rx="5" ry="2.5" />
    <ellipse cx="12" cy="10" rx="2" ry="1" />
    <path d="M3 12v3.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5V12" />
  </svg>
);

const PizzaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M15 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM11 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M20 3.7c-.5-.3-1.1-.3-1.6 0L4 12.2c-.6.3-.9.9-.9 1.6 0 .7.4 1.3.9 1.6 1.7 1 3.7 1.6 5.8 1.6 2.3 0 4.5-.6 6.3-1.7l3-1.8c.6-.3.9-.9.9-1.6 0-.7-.4-1.3-.9-1.6L20 3.7z" />
    <path d="M4.3 12.6c3.2-1.9 6.8-2.9 10.5-2.9h.2" />
  </svg>
);

const WineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M6 3h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V3z" />
    <path d="M12 16v5M8 21h8" />
  </svg>
);

const ClocheIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M12 4V3M5 17h14c1.1 0 2-.9 2-2 0-5.5-4.5-10-10-10S2 9.5 2 15c0 1.1.9 2 2 2zM2 20h20" />
  </svg>
);

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const DiningBowlIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 block">
    <path d="M2 10h20M2 10a10 10 0 0 0 20 0M6 10c0-3.5 2.5-6 6-6s6 2.5 6 6" />
    <path d="M12 2v2M8 4c.5 1 1.5 2 4 2s3.5-1 4-2" />
  </svg>
);

const ICONS = [ChefHatIcon, SushiIcon, PizzaIcon, WineIcon, ClocheIcon, FlameIcon, DiningBowlIcon];

const GREETINGS = [
  { text: "नमस्ते", isIndic: true },
  { text: "नमस्कार", isIndic: true },
  { text: "வணக்கம்", isIndic: true },
  { text: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", isIndic: true },
  { text: "নমস্কার", isIndic: true },
  { text: "నమస్కారం", isIndic: true },
  { text: "നമസ്കാരം", isIndic: true },
  { text: "HELLO", isIndic: false }
];

const PARTICLES = [
  { id: 1, x: -75, delay: 0.1, duration: 4.2, size: 3 },
  { id: 2, x: 45, delay: 1.0, duration: 4.8, size: 4 },
  { id: 3, x: -35, delay: 1.8, duration: 4.5, size: 3 },
  { id: 4, x: 70, delay: 0.5, duration: 3.9, size: 5 },
  { id: 5, x: -15, delay: 2.2, duration: 5.2, size: 2.5 }
];

export default function CinematicLoader({ onComplete }) {
  const [activeIconIndex, setActiveIconIndex] = useState(() => Math.floor(Math.random() * ICONS.length));
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const progressRef = useRef(0);

  // Parallax Tilt 3D mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth physical spring damping
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(mouseY, springConfig);
  const rotateY = useSpring(mouseX, springConfig);

  const rectSizeRef = useRef({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      rectSizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (isExiting) return;
    const { width, height } = rectSizeRef.current;
    
    // Normalize coordinates between -1 and 1 relative to center
    const relativeX = e.clientX - width / 2;
    const relativeY = e.clientY - height / 2;
    
    const normX = relativeX / (width / 2);
    const normY = relativeY / (height / 2);

    // Subtle limit to 10 degrees tilt rotation
    mouseX.set(normX * 10);
    mouseY.set(-normY * 10);
  };

  const handleMouseLeave = () => {
    // Reset back to center smoothly
    mouseX.set(0);
    mouseY.set(0);
  };

  // Cycle active icon in center with precise cinematic timings
  useEffect(() => {
    if (isExiting) return;
    const iconInterval = setInterval(() => {
      if (progressRef.current < 90) {
        setActiveIconIndex((prev) => (prev + 1) % ICONS.length);
      }
    }, 700);
    return () => clearInterval(iconInterval);
  }, [isExiting]);

  // Cycle hello greetings in multiple languages
  useEffect(() => {
    if (isExiting) return;
    const greetingInterval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
    }, 400);
    return () => clearInterval(greetingInterval);
  }, [isExiting]);

  // Smooth progress bar pacing with organic EaseOutCubic acceleration
  useEffect(() => {
    const duration = 2800; // 2.8 seconds
    const startTime = Date.now();
    let animationFrameId;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      // EaseOutCubic: f(t) = 1 - (1-t)^3
      const easedT = 1 - Math.pow(1 - t, 3);
      const currentProgress = easedT * 100;

      setProgress(currentProgress);
      progressRef.current = currentProgress;

      if (t < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setIsExiting(true);
        // Wait slightly for exit zoom animation, then trigger complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 600);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onComplete]);

  const ActiveIcon = ICONS[activeIconIndex];

  // Adaptive theme check
  const isLightMode = typeof document !== 'undefined' && (
    document.documentElement.classList.contains('light') || 
    document.documentElement.getAttribute('class')?.includes('light')
  );
  const startBg = isLightMode ? '#f9f6f0' : '#0b0f14';
  const endBg = isLightMode ? 'rgba(249, 246, 240, 0)' : 'rgba(11, 15, 20, 0)';

  const cardBg = isExiting 
    ? 'rgba(255, 255, 255, 0)' 
    : (isLightMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.04)');
    
  const cardBorder = isExiting 
    ? '1px solid rgba(255, 255, 255, 0)' 
    : (isLightMode ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)');

  const cardShadow = isExiting 
    ? 'none' 
    : (isLightMode ? '0 16px 48px rgba(0, 0, 0, 0.05)' : '0 16px 48px rgba(0, 0, 0, 0.32)');

  const cardBlur = isExiting
    ? 'blur(0px)'
    : 'blur(18px)';

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="cinematic-loader-overlay fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden"
      initial={{ backgroundColor: startBg, opacity: 1 }}
      animate={isExiting ? { 
        backgroundColor: endBg,
      } : { 
        backgroundColor: startBg,
        opacity: 1
      }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
    >
      {/* 🧊 Floating Premium Glassmorphic Card Wrapper */}
      <div 
        className="cinematic-loader-card-wrapper pointer-events-none"
        style={{
          perspective: 1000,
          transformStyle: 'preserve-3d',
          animation: isExiting ? 'none' : undefined
        }}
      >
        <motion.div
          className="cinematic-loader-card relative z-10 w-[310px] sm:w-[350px] py-10 px-8 flex flex-col items-center justify-center rounded-[28px] text-center"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ 
            opacity: isExiting ? 0.99 : 1, 
            scale: isExiting ? 1.05 : 1, 
            y: isExiting ? -10 : 0,
            backgroundColor: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
            backdropFilter: cardBlur,
            WebkitBackdropFilter: cardBlur,
          }}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            overflow: isExiting ? 'visible' : 'hidden'
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Shimmer Sweep overlay layer */}
          {!isExiting && <div className="cinematic-loader-shimmer" />}

          {/* Floating Culinary Particles */}
          {!isExiting && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-gradient-to-t from-[#FF6A4D]/25 to-[#FF8A72]/15"
                  style={{
                    left: `calc(50% + ${p.x}px)`,
                    bottom: '0px',
                    width: p.size,
                    height: p.size,
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: -240, 
                    opacity: [0, 0.6, 0.6, 0] 
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* 👨‍🍳 Dynamic Active Vector Outlined Illustration in Center */}
          <div className="w-16 h-16 mb-6 relative z-20 flex items-center justify-center">
            {/* Circular Glass Orbit Ring & Orbiting Dot */}
            {!isExiting && (
              <div className="absolute w-[80px] h-[80px] rounded-full border border-white/5 dark:border-white/[0.02] pointer-events-none flex items-center justify-center z-10">
                <motion.div
                  className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF6A4D] to-[#FF8A72] shadow-[0_0_6px_#FF6A4D]"
                  style={{ 
                    left: '0px', 
                    top: 'calc(50% - 3px)',
                    transformOrigin: '40px center' 
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4.0, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}

            {/* Subtle Outer Glowing Coral Pulse Ring */}
            {!isExiting && (
              <motion.div 
                className="absolute inset-0 rounded-full border border-[#FF6A4D]/25"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* High-Resolution Scaled Container */}
            <motion.div 
              className="cinematic-illustration-circle absolute w-[512px] h-[512px] rounded-full bg-white/[0.03] dark:bg-black/[0.12] border border-white/[0.04] flex items-center justify-center text-[#FF6A4D]"
              animate={isExiting ? { 
                scale: 5.0, 
                opacity: [1, 0.9, 0],
                y: -25,
                rotate: 15,
              } : { 
                scale: 0.125, 
                opacity: 1,
                rotate: 0,
                y: 0,
              }}
              style={{
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
              }}
              transition={{ 
                duration: 0.65, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <motion.div
                key={activeIconIndex}
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotate: 0,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
                className="flex items-center justify-center w-full h-full"
              >
                <ActiveIcon />
              </motion.div>
            </motion.div>
          </div>

          {/* ✨ Centerpiece Editorial Letter Reveal with Metallic Shimmer */}
          <motion.div 
            className="flex items-center gap-2 mb-2 select-none"
            animate={isExiting ? { opacity: 0, y: 12, scale: 0.94, filter: "blur(3px)" } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.span
              className="brand-shimmer-text text-[26px] font-light tracking-[0.38em] font-sans"
              initial={{ opacity: 0, y: 8, filter: "blur(2.5px)" }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                filter: "blur(0px)"
              }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              SAVORÉ
            </motion.span>
          </motion.div>

          {/* Languages Greeting Animator with a soft glow backdrop */}
          <motion.div 
            className="h-[24px] mb-7 flex items-center justify-center overflow-hidden relative w-full"
            animate={isExiting ? { opacity: 0, y: 10, filter: "blur(3px)" } : { opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Soft ambient highlight behind text */}
            <div className="absolute w-[80px] h-[20px] bg-[#FF6A4D]/5 rounded-full blur-md pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.p
                key={greetingIndex}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-gradient-to-r from-[#FF6A4D] to-[#FF8A72] bg-clip-text text-transparent select-none whitespace-nowrap drop-shadow-[0_2px_8px_rgba(255,106,77,0.15)] ${
                  GREETINGS[greetingIndex].isIndic
                    ? "text-[15px] font-semibold tracking-normal"
                    : "text-[13px] uppercase tracking-[0.3em] font-bold"
                }`}
              >
                {GREETINGS[greetingIndex].text}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* 🌀 Premium Coral Progress Line Container with Laser Glow */}
          <motion.div 
            className="w-[180px] h-[3px] rounded-full bg-white/[0.06] dark:bg-black/[0.22] overflow-hidden relative"
            animate={isExiting ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.div 
              className="h-full w-full bg-gradient-to-r from-[#FF6A4D] to-[#FF8A72]"
              style={{ 
                transformOrigin: 'left',
                scaleX: progress / 100,
                willChange: 'transform',
                boxShadow: '0 0 10px rgba(255, 106, 77, 0.6), 0 0 4px rgba(255, 138, 114, 0.4)'
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
