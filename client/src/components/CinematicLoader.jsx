// Savoré — Premium Cinematic Loader System
// 100% Modular, Isolated, and High-Performance (Stable 60fps GPU execution)

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 🍽️ Minimal Luxury Outline SVGs
const ChefHatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M6 18V17a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" />
    <path d="M5 14c-1.5-1.5-1-4 .5-5 .8-.5 1.7-.5 2.5 0M19 14c1.5-1.5 1-4-.5-5-.8-.5-1.7-.5-2.5 0" />
    <path d="M8 9a4 4 0 0 1 8 0" />
    <rect x="7" y="17" width="10" height="3" rx="1.5" />
  </svg>
);

const SushiIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <ellipse cx="12" cy="12" rx="9" ry="5" />
    <ellipse cx="12" cy="12" rx="5" ry="2.5" />
    <ellipse cx="12" cy="10" rx="2" ry="1" />
    <path d="M3 12v3.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5V12" />
  </svg>
);

const PizzaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M15 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM11 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M20 3.7c-.5-.3-1.1-.3-1.6 0L4 12.2c-.6.3-.9.9-.9 1.6 0 .7.4 1.3.9 1.6 1.7 1 3.7 1.6 5.8 1.6 2.3 0 4.5-.6 6.3-1.7l3-1.8c.6-.3.9-.9.9-1.6 0-.7-.4-1.3-.9-1.6L20 3.7z" />
    <path d="M4.3 12.6c3.2-1.9 6.8-2.9 10.5-2.9h.2" />
  </svg>
);

const WineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M6 3h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V3z" />
    <path d="M12 16v5M8 21h8" />
  </svg>
);

const ClocheIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M12 4V3M5 17h14c1.1 0 2-.9 2-2 0-5.5-4.5-10-10-10S2 9.5 2 15c0 1.1.9 2 2 2zM2 20h20" />
  </svg>
);

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const DiningBowlIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
    <path d="M2 10h20M2 10a10 10 0 0 0 20 0M6 10c0-3.5 2.5-6 6-6s6 2.5 6 6" />
    <path d="M12 2v2M8 4c.5 1 1.5 2 4 2s3.5-1 4-2" />
  </svg>
);

const ICONS = [ChefHatIcon, SushiIcon, PizzaIcon, WineIcon, ClocheIcon, FlameIcon, DiningBowlIcon];

export default function CinematicLoader({ onComplete }) {
  const [activeIconIndex, setActiveIconIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle active icon in center with precise cinematic timings
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setActiveIconIndex((prev) => (prev + 1) % ICONS.length);
    }, 700);
    return () => clearInterval(iconInterval);
  }, []);

  // Smooth progress bar pacing
  useEffect(() => {
    const duration = 1600; // 1.6s progress path
    const intervalTime = 16; // ~60fps updates
    const step = 100 / (duration / intervalTime);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          // Wait slightly for exit feel, then trigger complete
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 200);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(progressTimer);
  }, [onComplete]);

  const ActiveIcon = ICONS[activeIconIndex];
  const brandLetters = ["S", "A", "V", "O", "R", "É"];

  return (
    <motion.div
      className="cinematic-loader-overlay fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        filter: "blur(12px)",
        scale: 1.03,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
      }}
    >
      {/* Background Soft Parallax Drift Glows (Completely isolated) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          className="absolute w-[350px] h-[350px] rounded-full bg-[#FF6A4D]/[0.03] blur-[80px]"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '15%', left: '20%' }}
        />
        <motion.div 
          className="absolute w-[300px] h-[300px] rounded-full bg-[#FF8A72]/[0.025] blur-[90px]"
          animate={{
            x: [0, -30, 50, 0],
            y: [0, 40, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ bottom: '15%', right: '20%' }}
        />
      </div>

      {/* 🧊 Floating Premium Glassmorphic Card Container */}
      <motion.div
        className="cinematic-loader-card relative z-10 w-[310px] sm:w-[350px] py-10 px-8 flex flex-col items-center justify-center rounded-[28px] text-center"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
        }}
      >
        {/* Shimmer Sweep overlay layer */}
        <div className="cinematic-loader-shimmer" />

        {/* 👨‍🍳 Dynamic Active Vector Outlined Illustration in Center */}
        <div className="w-18 h-18 rounded-full bg-white/[0.03] dark:bg-black/[0.12] border border-white/[0.04] flex items-center justify-center text-[#FF6A4D] mb-6 relative">
          
          {/* Subtle Outer Glowing Coral Pulse Ring */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-[#FF6A4D]/25"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeIconIndex}
              initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.88, 
                rotate: 8,
                transition: { duration: 0.28 } 
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <ActiveIcon />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ✨ Centerpiece Editorial Letter Reveal */}
        <motion.div 
          className="flex items-center gap-2 mb-2 select-none"
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { staggerChildren: 0.06 }
            }
          }}
        >
          {brandLetters.map((letter, idx) => (
            <motion.span
              key={idx}
              className="text-[26px] font-light tracking-[0.08em] font-sans"
              variants={{
                initial: { opacity: 0, y: 8, filter: "blur(2.5px)" },
                animate: { 
                  opacity: 1, 
                  y: 0, 
                  filter: "blur(0px)",
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } 
                }
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>

        {/* Slogan */}
        <motion.p
          className="text-[11px] uppercase tracking-[0.24em] font-medium text-text-muted mb-7 opacity-75 sm:whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Cinematic Dining Experience
        </motion.p>

        {/* 🌀 Premium Coral Progress Line Container */}
        <div className="w-[180px] h-[3px] rounded-full bg-white/[0.06] dark:bg-black/[0.22] overflow-hidden relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#FF6A4D] to-[#FF8A72]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
