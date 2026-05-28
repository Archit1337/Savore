import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';

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
        className="logo-ceramic-tile !bg-[#FAF6EE] !p-1 !w-[34px] !h-[34px] flex items-center justify-center rounded-xl overflow-hidden shrink-0 border border-[#FF6A4D]/15 shadow-sm"
        whileHover={{
          scale: 1.05,
          borderColor: 'rgba(255, 106, 77, 0.4)'
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
        <img 
          src={logoImg} 
          alt="S" 
          className="w-full h-full object-contain pointer-events-none transform-none scale-100" 
          style={{ 
            mixBlendMode: 'multiply',
            filter: 'blur(0.45px) contrast(1.75) brightness(0.54) saturate(1.1)'
          }}
        />
        
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
