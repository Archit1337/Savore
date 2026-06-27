import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function InteractiveLogo() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect responsiveness / mobile touch viewports
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 768 || 
        ('ontouchstart' in window) || 
        navigator.maxTouchPoints > 0
      );
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Normalize coordinates relative to logo center (-1 to 1)
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  // 3D Parallax offset settings (Desktop Only)
  const haloOffset = isMobile ? { x: 0, y: 0 } : { x: coords.x * -9, y: coords.y * -9 };
  const tileOffset = isMobile ? { x: 0, y: 0 } : { x: coords.x * 6, y: coords.y * 6 };
  const textOffset = isMobile ? { x: 0, y: 0 } : { x: coords.x * 3, y: coords.y * 3 };

  return (
    <Link
      to="/"
      className="logo-tile-container outline-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 🔮 1. AMBIENT BREATHING BACKDROP HALO */}
      <motion.div
        className={`logo-ambient-halo ${!isHovered ? 'logo-ambient-halo-breathing' : ''}`}
        animate={{
          x: haloOffset.x,
          y: haloOffset.y,
          scale: isHovered ? 1.25 : 1,
          boxShadow: isHovered ? 'var(--logo-glow-active)' : 'none'
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      />

      {/* 🧊 2. CERAMIC / METAL GEOMETRIC LOGO TILE */}
      <motion.div
        className="logo-ceramic-tile !p-1 !w-[34px] !h-[34px] flex items-center justify-center rounded-xl overflow-hidden shrink-0 border border-[#FFFFFF]/15 shadow-sm"
        whileHover={{
          scale: 1.05,
          borderColor: 'rgba(255, 255, 255, 0.35)'
        }}
        whileTap={{ scale: 0.94 }}
        animate={{
          x: tileOffset.x,
          y: tileOffset.y,
          boxShadow: isHovered 
            ? '0 8px 24px rgba(255, 106, 77, 0.25), var(--logo-shadow)' 
            : 'var(--logo-shadow)'
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 14 }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-[23px] h-[23px] pointer-events-none" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Thick organic fluid S monogram (exact replica of the uploaded logo asset) */}
          <path 
            d="M68 29C68 18 58 14 48 14C33 14 27 23 27 36C27 49 73 51 73 64C73 77 67 86 48 86C38 86 32 81 32 71" 
            stroke="#FFFFFF" 
            strokeWidth="17.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
        
        {/* Dynamic Light Sweep reflection */}
        <div className="logo-sweep-element" />
      </motion.div>

      {/* 👁️ 3. ELEGANT LETTERPRESS BRAND TEXT */}
      <motion.span
        className="logo-brand-text"
        animate={{
          x: textOffset.x,
          y: textOffset.y,
          color: isHovered ? 'var(--primary)' : 'var(--text-primary)'
        }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      >
        Savoré
      </motion.span>
    </Link>
  );
}
