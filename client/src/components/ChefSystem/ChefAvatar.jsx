// Savoré — Modular Interactive Chef Avatar Component

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChefMood } from './ChefMoodEngine';

export default function ChefAvatar({ mousePos = { x: 0, y: 0 }, isHovered = false, forceSmile = false }) {
  const { currentMood, isChatExpanded } = useChefMood();
  const [sparkles, setSparkles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive device tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // micro-pupil offsets for tracking
  const eyeXOffset = isChatExpanded ? -2.2 : forceSmile ? -3.0 : mousePos.x * 2.8;
  const eyeYOffset = isChatExpanded ? 0.8 : forceSmile ? 0.5 : mousePos.y * 1.8;

  // Sparkle burst handler on celebration state
  useEffect(() => {
    const handleSparkleBurst = () => {
      const newSparkles = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 200 + 70,
        y: Math.random() * 200 + 70,
        scale: Math.random() * 0.6 + 0.4
      }));
      setSparkles(newSparkles);
      
      // Auto-clear after 1.5s
      setTimeout(() => setSparkles([]), 1500);
    };

    window.addEventListener('chef-sparkle', handleSparkleBurst);
    return () => window.removeEventListener('chef-sparkle', handleSparkleBurst);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* 💥 Ambient Celebration Sparkles Overlay */}
      {sparkles.map((sp) => (
        <motion.div
          key={sp.id}
          initial={{ opacity: 1, scale: 0, x: sp.x, y: sp.y }}
          animate={{ opacity: 0, scale: sp.scale * 1.5, y: sp.y - 45 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-full pointer-events-none z-10 bg-[radial-gradient(circle,_#FF8A72_0%,_rgba(255,106,77,0)_70%)]"
        />
      ))}

      {/* Pseudo-3D Layered Chef Character SVG */}
      <motion.svg
        viewBox="0 0 400 400"
        animate={{
          x: isChatExpanded ? (isMobile ? 0 : 115) : 0, // Shifts the chef 115px to the right to stand perfectly beside the leftward shifted chat panel!
          y: isChatExpanded && isMobile ? 82 : currentMood === 'celebration' ? [0, -22, 0] : isHovered ? [0, -9, 0] : [0, -6, 0], // Peeks from below on mobile
          rotate: currentMood === 'celebration' ? [0, 5, -5, 0] : isHovered ? [0, 1.5, -1.5, 0] : [0, 1, -1, 0],
          rotateX: isChatExpanded ? 0 : mousePos.y * -14,
          rotateY: isChatExpanded ? 0 : mousePos.x * 14,
          scale: isChatExpanded ? (isMobile ? 0.75 : 0.95) : currentMood === 'celebration' ? 1.08 : isHovered ? 1.03 : 1
        }}
        transition={{
          x: { type: "spring", stiffness: 85, damping: 15 },
          y: { 
            repeat: currentMood === 'celebration' ? 0 : Infinity, 
            duration: currentMood === 'celebration' ? 0.6 : isHovered ? 3.6 : 4.5, 
            ease: "easeInOut" 
          },
          rotate: { 
            repeat: currentMood === 'celebration' ? 0 : Infinity, 
            duration: currentMood === 'celebration' ? 0.6 : isHovered ? 4.2 : 5.5, 
            ease: "easeInOut" 
          },
          rotateX: { type: "spring", stiffness: 100, damping: 15 },
          rotateY: { type: "spring", stiffness: 100, damping: 15 },
          scale: { type: "spring", stiffness: 110, damping: 12 }
        }}
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          filter: currentMood === 'celebration'
            ? 'drop-shadow(0 20px 32px rgba(255, 106, 77, 0.15))'
            : isHovered
            ? 'drop-shadow(0 16px 24px rgba(0,0,0,0.18))'
            : 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))',
          transition: 'filter 400ms var(--ease-apple)'
        }}
      >
        <defs>
          {/* Volumetric Hat Puff Gradients */}
          <radialGradient id="capPuffGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fbfbfd" />
            <stop offset="75%" stopColor="#e1e2ec" />
            <stop offset="95%" stopColor="#c5c6d3" />
            <stop offset="100%" stopColor="#acadb8" />
          </radialGradient>
          <linearGradient id="capShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b3b4c2" />
            <stop offset="100%" stopColor="#868796" />
          </linearGradient>
          <linearGradient id="capBandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9e9f0" />
          </linearGradient>

          {/* Subsurface skin gradients for Pixar feel */}
          <radialGradient id="faceGrad" cx="45%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffe7dd" />
            <stop offset="45%" stopColor="#ffd8c8" />
            <stop offset="85%" stopColor="#f5af9a" />
            <stop offset="100%" stopColor="#d3826b" />
          </radialGradient>

          <radialGradient id="earGradLeft" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffd8c8" />
            <stop offset="70%" stopColor="#f5af9a" />
            <stop offset="100%" stopColor="#cc7b65" />
          </radialGradient>

          <radialGradient id="earGradRight" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffd8c8" />
            <stop offset="70%" stopColor="#f5af9a" />
            <stop offset="100%" stopColor="#cc7b65" />
          </radialGradient>

          {/* Hair & facial textures */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c381e" />
            <stop offset="50%" stopColor="#41240f" />
            <stop offset="100%" stopColor="#200d02" />
          </linearGradient>

          <linearGradient id="mustacheGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a2912" />
            <stop offset="100%" stopColor="#1e0c03" />
          </linearGradient>

          {/* Coat volumetric shading */}
          <linearGradient id="coatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f7f7f9" />
            <stop offset="85%" stopColor="#dedee8" />
            <stop offset="100%" stopColor="#bebed0" />
          </linearGradient>

          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Ambient shadow base on floor */}
        <ellipse cx="200" cy="375" rx="72" ry="10" fill="rgba(0,0,0,0.22)" />

        {/* --- CHEF HEAD & HAIR --- */}
        <motion.g
          id="chef-head"
          animate={{
            rotate: isChatExpanded ? -7 : forceSmile ? -6 : mousePos.x * 7,
            x: isChatExpanded ? -10 : forceSmile ? -8 : mousePos.x * 10,
            y: isChatExpanded ? 3 : forceSmile ? 2 : mousePos.y * 7
          }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          {/* --- CHEF HAT --- */}
          <g id="chef-hat">
            {/* Back Shadow Puff Folds */}
            <path d="M128,142 C108,125 125,75 160,88 C145,115 138,130 128,142 Z" fill="url(#capShadowGrad)" />
            <path d="M272,142 C292,125 275,75 240,88 C255,115 262,130 272,142 Z" fill="url(#capShadowGrad)" />

            {/* Main Front Puff Folds */}
            <path d="M125,142 C100,105 140,55 180,75 C160,110 148,130 125,142 Z" fill="url(#capPuffGrad)" />
            <path d="M275,142 C300,105 260,55 220,75 C240,110 252,130 275,142 Z" fill="url(#capPuffGrad)" />
            <path d="M148,142 C140,40 260,40 252,142 Z" fill="url(#capPuffGrad)" />

            {/* Crease Overlays */}
            <path d="M185,142 C180,95 220,95 215,142 Z" fill="#e2e2ec" opacity="0.6" />
            <path d="M198,142 C196,105 204,105 202,142 Z" fill="#ffffff" opacity="0.8" />

            {/* Hat Base Band */}
            <rect x="142" y="140" width="116" height="26" rx="6" fill="url(#capBandGrad)" stroke="#c5c5d0" strokeWidth="1.2" filter="url(#softShadow)" />
            <rect x="142" y="156" width="116" height="6" fill="var(--primary)" rx="2" />
          </g>
          {/* Hair behind ears */}
          <path d="M132,165 Q115,175 130,195 Z" fill="url(#hairGrad)" />
          <path d="M268,165 Q285,175 270,195 Z" fill="url(#hairGrad)" />

          {/* Chubby ears */}
          <circle cx="130" cy="190" r="14" fill="url(#earGradLeft)" />
          <circle cx="270" cy="190" r="14" fill="url(#earGradRight)" />

          {/* Chubby face */}
          <path d="M138,165 C125,230 145,250 200,250 C255,250 275,230 262,165 Z" fill="url(#faceGrad)" />

          {/* Cheeks blush */}
          <ellipse cx="160" cy="212" rx="14" ry="9" fill="rgba(255, 90, 60, 0.35)" />
          <ellipse cx="240" cy="212" rx="14" ry="9" fill="rgba(255, 90, 60, 0.35)" />

          {/* Eye animations system */}
          <g id="chef-eyes">
            {isChatExpanded ? (
              <>
                {/* Look left towards the chat panel when expanded */}
                <ellipse cx="160" cy="195" rx="7.5" ry="7.5" fill="#232328" />
                <circle cx="155.5" cy="192.5" r="2.5" fill="#ffffff" />
                <ellipse cx="236" cy="195" rx="7.5" ry="7.5" fill="#232328" />
                <circle cx="231.5" cy="192.5" r="2.5" fill="#ffffff" />
              </>
            ) : currentMood === 'thinking' ? (
              <>
                {/* Upper curve thinking eyes */}
                <path d="M152,192 Q164,187 170,195" fill="none" stroke="#232328" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M230,192 Q242,187 248,195" fill="none" stroke="#232328" strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : currentMood === 'celebration' || isHovered || forceSmile ? (
              <>
                {/* Winking eye + happy crescent eye with cursor tracking */}
                <path d="M150,196 Q162,203 172,196" fill="none" stroke="#232328" strokeWidth="4" strokeLinecap="round" />
                <motion.ellipse
                  cx={238 + eyeXOffset} cy={194 + eyeYOffset} rx="7" ry="7" fill="#232328"
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ repeat: Infinity, duration: 4.5, repeatDelay: 2.2 }}
                />
                <circle cx={236 + eyeXOffset * 1.15} cy={191 + eyeYOffset * 1.15} r="2.5" fill="#ffffff" />
              </>
            ) : (
              <>
                {/* Standard blinking circular eyes */}
                <motion.ellipse
                  cx={162 + eyeXOffset} cy={194 + eyeYOffset} rx="7.5" ry="7.5" fill="#232328"
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ repeat: Infinity, duration: 3.8, repeatDelay: 2 }}
                />
                <circle cx={160 + eyeXOffset * 1.15} cy={191 + eyeYOffset * 1.15} r="2.5" fill="#ffffff" />

                <motion.ellipse
                  cx={238 + eyeXOffset} cy={194 + eyeYOffset} rx="7.5" ry="7.5" fill="#232328"
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ repeat: Infinity, duration: 3.8, repeatDelay: 2 }}
                />
                <circle cx={236 + eyeXOffset * 1.15} cy={191 + eyeYOffset * 1.15} r="2.5" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Nose */}
          <ellipse cx="200" cy="202" rx="10" ry="7" fill="#f8a287" filter="url(#softShadow)" />

          {/* Mustache */}
          <path d="M172,210 C188,210 193,217 200,217 C207,217 212,210 228,210 C245,210 248,218 243,225 C231,228 211,221 200,223 C189,221 169,228 157,225 C152,218 155,210 172,210 Z" fill="url(#mustacheGrad)" filter="url(#softShadow)" />

          {/* Mouth */}
          {isChatExpanded ? (
            <g>
              <path d="M184,226 C184,241 216,241 216,226 Z" fill="#800005" />
              <path d="M189,232 C194,228 206,228 211,232 Z" fill="#ff9999" />
            </g>
          ) : currentMood === 'thinking' ? (
            <path d="M192,230 Q200,225 208,230" fill="none" stroke="#6d0006" strokeWidth="3" strokeLinecap="round" />
          ) : currentMood === 'celebration' || forceSmile ? (
            <g>
              <path d="M185,225 C185,243 215,243 215,225 Z" fill="#800005" />
              <path d="M191,234 C195,229 205,229 209,234 Z" fill="#ff9999" />
            </g>
          ) : isHovered ? (
            <g>
              <path d="M184,226 C184,239 216,239 216,226 Z" fill="#800005" />
              <path d="M190,232 C194,229 206,229 210,232 Z" fill="#ff9999" />
            </g>
          ) : (
            <g>
              <path d="M188,226 C188,236 212,236 212,226 Z" fill="#800005" />
              <path d="M193,231 C196,228 204,228 207,231 Z" fill="#ff9999" />
            </g>
          )}
        </motion.g>

        {/* --- CHEF APRON & BODY --- */}
        <g id="chef-body">
          <path d="M138,250 C118,275 118,365 200,365 C282,365 282,275 262,250 Z" fill="url(#coatGrad)" filter="url(#softShadow)" />
          <path d="M182,250 L200,272 L218,250 L200,244 Z" fill="var(--primary)" />

          {/* Coat buttons */}
          <g fill="#232328" opacity="0.85">
            <circle cx="176" cy="280" r="4" />
            <circle cx="176" cy="302" r="4" />
            <circle cx="176" cy="324" r="4" />
            
            <circle cx="224" cy="280" r="4" />
            <circle cx="224" cy="302" r="4" />
            <circle cx="224" cy="324" r="4" />
          </g>

          <path d="M146,328 L254,328" stroke="#bebed0" strokeWidth="1.8" strokeDasharray="3 3" />
          <path d="M144,346 C144,365 170,365 200,365 C230,365 256,365 256,346 Z" fill="#ffffff" stroke="#dedee8" strokeWidth="1.2" />
        </g>

        {/* --- CHEF ARMS & HANDS --- */}
        {/* Left hand */}
        <motion.g
          id="chef-left-hand"
          animate={
            currentMood === 'active' || currentMood === 'thinking'
              ? { x: [0, 2, -2, 0], y: [0, -2, 2, 0] }
              : { x: [0, 0.6, -0.6, 0], y: [0, -0.6, 0.6, 0] }
          }
          transition={{
            repeat: Infinity,
            duration: currentMood === 'active' || currentMood === 'thinking' ? 1.8 : 5.0,
            ease: "easeInOut"
          }}
          style={{ transformOrigin: '135px 265px' }}
        >
          <path d="M136,262 C115,272 120,292 134,282 Z" fill="#ffffff" stroke="#c5c5d0" strokeWidth="1" />
          <circle cx="120" cy="292" r="10" fill="#ffe7dd" filter="url(#softShadow)" />

          {/* Stirring spoon */}
          <path d="M120,292 L94,318" stroke="#8a8a93" strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx="90" cy="322" rx="8" ry="12" fill="#bebed0" stroke="#8a8a93" strokeWidth="1" transform="rotate(-35 90 322)" />
        </motion.g>

        {/* Right hand */}
        <motion.g
          id="chef-right-hand"
          animate={
            isChatExpanded
              ? (isMobile 
                  ? { rotate: -20, x: -10, y: -15 } 
                  : { rotate: -70, x: -80, y: -20, scale: 1.06 } 
                )
              : currentMood === 'thinking'
              ? { rotate: 28, x: -14, y: -45 }
              : currentMood === 'celebration'
              ? { rotate: [-10, -35, -10], y: -8, scale: 1.15 }
              : isHovered
              ? { rotate: [-8, -22, -8], y: -3 }
              : { rotate: 0, x: 0, y: 0 }
          }
          transition={{ type: "spring", stiffness: 100, damping: 13 }}
          style={{ transformOrigin: '265px 265px' }}
        >
          <path d="M264,262 C285,272 280,292 266,282 Z" fill="#ffffff" stroke="#c5c5d0" strokeWidth="1" />
          {isChatExpanded ? (
            /* Pointing hand gesture */
            <g filter="url(#softShadow)" fill="#ffe7dd">
              <circle cx="280" cy="292" r="10" />
              <rect x="254" y="285" width="22" height="6.5" rx="3.2" transform="rotate(-5 254 285)" />
              <circle cx="276" cy="284" r="4.5" />
            </g>
          ) : isHovered || currentMood === 'celebration' ? (
            <g filter="url(#softShadow)">
              <circle cx="280" cy="292" r="10.5" fill="#ffe7dd" />
              <path d="M272,300 C272,308 288,308 288,300 Z" fill="#ffe7dd" />
            </g>
          ) : (
            <circle cx="280" cy="292" r="10" fill="#ffe7dd" filter="url(#softShadow)" />
          )}
        </motion.g>
      </motion.svg>
    </div>
  );
}
