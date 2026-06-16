// Savoré — Premium Cinematic Loader System
// 100% Modular, Isolated, and High-Performance (Stable 60fps GPU execution)

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const canvasRef = useRef(null);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 16) {
      return 'day'; // Morning/Afternoon
    } else if (hour >= 16 && hour < 19) {
      return 'evening'; // Sunset
    } else {
      return 'night'; // Night Moon & Stars
    }
  };

  // ☀️/🌙 High-Definition 4K Retro-Wave Canvas Background Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let frame = 0;

    // Responsive Canvas Resizing for 4K / Retina high definition sharp rendering
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    // Responsive virtual pixel size (8px on desktop, 6px on mobile)
    const pixelSize = window.innerWidth < 768 ? 6 : 8;

    // Twinkling stars (for night mode) - generated relative to grid columns/rows
    const gridCols = Math.ceil(w / pixelSize);
    const gridRows = Math.ceil(h / pixelSize);

    const stars = Array.from({ length: 35 }, () => ({
      px: Math.floor(Math.random() * gridCols),
      py: Math.floor(Math.random() * (gridRows * 0.6)), // keep in upper sky
      speed: 0.015 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2
    }));

    // Drift clouds grid positions
    let cloud1X = Math.floor(gridCols * 0.85);
    let cloud2X = Math.floor(gridCols * 0.25);

    const timeOfDay = getTimeOfDay();

    // Helper to draw a pixel block at virtual grid coordinates
    const drawPixelRect = (px, py, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(px * pixelSize, py * pixelSize, pw * pixelSize, ph * pixelSize);
    };

    // Helper to draw a pixel-art fluffy cloud on the grid
    const drawRetroCloud = (cx, cy, color) => {
      ctx.fillStyle = color;
      ctx.fillRect((cx - 6) * pixelSize, cy * pixelSize, 13 * pixelSize, 2 * pixelSize);
      ctx.fillRect((cx - 4) * pixelSize, (cy - 1) * pixelSize, 9 * pixelSize, 1 * pixelSize);
      ctx.fillRect((cx - 1) * pixelSize, (cy - 2) * pixelSize, 4 * pixelSize, 1 * pixelSize);
      ctx.fillRect((cx - 8) * pixelSize, (cy + 1) * pixelSize, 16 * pixelSize, 1 * pixelSize);
    };

    // Helper to draw a retro sun with horizontal synthwave stripe cuts
    const drawRetroSun = (cx, cy, radius, color) => {
      for (let y = cy - radius; y <= cy + radius; y++) {
        // Retro stripe cuts: skip rows towards the bottom
        if (y > cy + 1 && (y - cy) % 2 === 0) continue;
        const dx = Math.round(Math.sqrt(radius * radius - (y - cy) * (y - cy)));
        if (dx > 0) {
          drawPixelRect(cx - dx, y, dx * 2, 1, color);
        }
      }
    };

    // Helper to draw a procedurally jagged pixel-art mountain range
    const drawRetroMountains = (baseColor, outlineColor) => {
      const rowY = gridRows - 6; // Base height line
      for (let col = 0; col <= gridCols; col++) {
        // Procedural mountain peak heights on grid
        const peakY = Math.floor(rowY - Math.abs(Math.sin(col * 0.16) * 4) - Math.abs(Math.cos(col * 0.06) * 2));
        // Fill mountain body down to screen bottom
        drawPixelRect(col, peakY, 1, gridRows - peakY, baseColor);
        // Neon outline
        if (outlineColor) {
          drawPixelRect(col, peakY, 1, 1, outlineColor);
        }
      }
    };

    const draw = () => {
      frame++;
      const currentW = canvas.width / (window.devicePixelRatio || 1);
      const currentH = canvas.height / (window.devicePixelRatio || 1);
      const currentCols = Math.ceil(currentW / pixelSize);
      const currentRows = Math.ceil(currentH / pixelSize);
      ctx.clearRect(0, 0, currentW, currentH);

      if (timeOfDay === 'day') {
        // --- DAY SKY ---
        const grad = ctx.createLinearGradient(0, 0, 0, currentH);
        grad.addColorStop(0, '#2980b9'); // Rich sky blue
        grad.addColorStop(1, '#6dd5fa'); // Soft cyan gradient
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, currentW, currentH);

        // Retro Sun (Yellow with cuts)
        const sunX = Math.floor(currentCols * 0.8);
        const sunY = 10;
        drawRetroSun(sunX, sunY, 7, '#f1c40f');

        // Drift Clouds
        cloud1X -= 0.04;
        if (cloud1X < -10) cloud1X = currentCols + 10;
        drawRetroCloud(Math.floor(cloud1X), 14, 'rgba(255, 255, 255, 0.6)');

        cloud2X -= 0.02;
        if (cloud2X < -10) cloud2X = currentCols + 10;
        drawRetroCloud(Math.floor(cloud2X), 20, 'rgba(255, 255, 255, 0.45)');

        // Distant mountains (soft blue-gray silhouette)
        drawRetroMountains('#4ba3df', null);

      } else if (timeOfDay === 'evening') {
        // --- SUNSET ---
        const grad = ctx.createLinearGradient(0, 0, 0, currentH);
        grad.addColorStop(0, '#1a1c4b'); // Deep twilight purple
        grad.addColorStop(0.55, '#c33764'); // Crimson magenta
        grad.addColorStop(1, '#e67e22'); // Warm sunset orange
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, currentW, currentH);

        // Synthwave Sun (Vibrant peach gradient with cuts)
        const sunX = Math.floor(currentCols * 0.75);
        const sunY = Math.floor(currentRows * 0.6);
        drawRetroSun(sunX, sunY, 9, '#ff7675');

        // Twilight Clouds
        cloud1X -= 0.035;
        if (cloud1X < -10) cloud1X = currentCols + 10;
        drawRetroCloud(Math.floor(cloud1X), 12, 'rgba(253, 121, 168, 0.4)');

        cloud2X -= 0.018;
        if (cloud2X < -10) cloud2X = currentCols + 10;
        drawRetroCloud(Math.floor(cloud2X), 18, 'rgba(253, 121, 168, 0.25)');

        // Neon sunset mountains (deep violet with a bright orange rim)
        drawRetroMountains('#6c5ce7', '#fdcb6e');

      } else {
        // --- NIGHT ---
        const grad = ctx.createLinearGradient(0, 0, 0, currentH);
        grad.addColorStop(0, '#04050d'); // Jet black space
        grad.addColorStop(1, '#0e111d'); // Obsidian navy
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, currentW, currentH);

        // Twinkling Star Pixels
        stars.forEach((star) => {
          const alpha = 0.2 + Math.abs(Math.sin(frame * star.speed + star.phase)) * 0.8;
          drawPixelRect(star.px, star.py, 1, 1, `rgba(255, 255, 255, ${alpha})`);
        });

        // Retro Crescent Moon (facing left)
        const moonX = Math.floor(currentCols * 0.8);
        const moonY = 10;
        ctx.fillStyle = '#f6e58d'; // Pale silver-yellow
        ctx.fillRect((moonX + 2) * pixelSize, (moonY - 4) * pixelSize, 2 * pixelSize, 1 * pixelSize);
        ctx.fillRect((moonX + 1) * pixelSize, (moonY - 3) * pixelSize, 2 * pixelSize, 1 * pixelSize);
        ctx.fillRect(moonX * pixelSize, (moonY - 2) * pixelSize, 2 * pixelSize, 2 * pixelSize);
        ctx.fillRect((moonX + 1) * pixelSize, moonY * pixelSize, 2 * pixelSize, 1 * pixelSize);
        ctx.fillRect((moonX + 2) * pixelSize, (moonY + 1) * pixelSize, 2 * pixelSize, 1 * pixelSize);

        // Cyberpunk night mountains (obsidian black with neon coral outline)
        drawRetroMountains('#0b0f19', '#ff7675');
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isExiting]);

  // Cycle active icon in center with precise cinematic timings
  useEffect(() => {
    if (isExiting) return;
    const iconInterval = setInterval(() => {
      setActiveIconIndex((prev) => (prev + 1) % ICONS.length);
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

  // Smooth progress bar pacing
  useEffect(() => {
    const duration = 3200; // 3.2s progress path
    const intervalTime = 16; // ~60fps updates
    const step = 100 / (duration / intervalTime);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setIsExiting(true);
          // Wait slightly for exit zoom animation, then trigger complete
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 600);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(progressTimer);
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
      className="cinematic-loader-overlay fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden"
      initial={{ backgroundColor: startBg, opacity: 1 }}
      animate={isExiting ? { 
        backgroundColor: endBg,
      } : { 
        backgroundColor: startBg,
        opacity: 1
      }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
    >
      {/* ☀️/🌙 High-Definition 4K Time-of-Day Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{
          opacity: isExiting ? 0 : 0.82,
          transition: 'opacity 0.60s ease'
        }}
      />

      {/* 🧊 Floating Premium Glassmorphic Card Container */}
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
          animation: isExiting ? 'none' : undefined,
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
        <motion.div 
          className="w-16 h-16 rounded-full bg-white/[0.03] dark:bg-black/[0.12] border border-white/[0.04] flex items-center justify-center text-[#FF6A4D] mb-6 relative z-20"
          animate={isExiting ? { 
            scale: 30, 
            opacity: [1, 0.9, 0],
            y: -25,
            rotate: 15,
          } : { 
            scale: 1, 
            opacity: 1,
            rotate: 0,
            y: 0,
          }}
          transition={{ 
            duration: 0.65, 
            ease: [0.16, 1, 0.3, 1] 
          }}
        >
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
            className="h-full bg-gradient-to-r from-[#FF6A4D] to-[#FF8A72]"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(255, 106, 77, 0.6), 0 0 4px rgba(255, 138, 114, 0.4)'
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
