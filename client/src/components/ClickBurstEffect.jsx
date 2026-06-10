import React, { useState, useEffect, useRef } from 'react';

// Global click particle images list.
// Custom premium hand-drawn illustration image paths provided by the user.
const CLICK_IMAGES = [
  '/click-img1.svg?v=3',
  '/click-img2.svg?v=3',
  '/click-img3.svg?v=3',
  '/click-img4.svg?v=3',
  '/click-img5.svg?v=3',
  '/click-img6.svg?v=3',
  '/click-img7.svg?v=3',
  '/click-img8.svg?v=3',
  '/click-img9.svg?v=3',
  '/click-img10.svg?v=3'
];

export default function ClickBurstEffect() {
  const [particles, setParticles] = useState([]);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (CLICK_IMAGES.length === 0) return;

      const now = Date.now();
      if (now - lastClickTimeRef.current < 350) {
        return; // Reject double-fired events and tap-emulation delays (within 350ms)
      }
      lastClickTimeRef.current = now;

      // Shuffle images to select unique illustrations for the burst
      const shuffledImages = [...CLICK_IMAGES].sort(() => 0.5 - Math.random());

      // Start with a random base angle
      const baseAngle = Math.random() * 360;

      // Spawn a mini cluster of 3 particles on click
      const newParticles = Array.from({ length: 3 }).map((_, index) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
        
        // Mathematically distribute angles (0, 120, 240 degrees + baseAngle) with minor jitter to prevent overlapping paths
        const angleDeg = baseAngle + (index * 120) + (Math.random() - 0.5) * 10;
        const angle = angleDeg * (Math.PI / 180);
        const speed = 80 + Math.random() * 50; // Increased speed for wider spread
        const gravity = 25 + Math.random() * 30; // Random gravity pull for parabolic arced trajectory
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 60; // Launch upward slightly
        
        // Dynamic swing rotations per keyframe step
        const rotStart = (Math.random() - 0.5) * 45;
        const rot15 = rotStart + (Math.random() - 0.5) * 40;
        const rot80 = rot15 + (Math.random() - 0.5) * 90;
        const rot100 = rot80 + (Math.random() - 0.5) * 50;
        
        const scale = 0.5 + Math.random() * 0.4;
        const duration = `${1200 + Math.round(Math.random() * 500)}ms`;
        const delay = `${Math.round(Math.random() * 60)}ms`;

        return {
          id,
          x: e.clientX,
          y: e.clientY,
          // Curved path: x moves linearly, y pulls downward over time via gravity multiplier squared
          tx15: `${(vx * 0.4).toFixed(1)}px`,
          ty15: `${(vy * 0.4 + gravity * 0.16).toFixed(1)}px`,
          rot15: `${rot15.toFixed(1)}deg`,
          
          tx80: `${(vx * 1.8).toFixed(1)}px`,
          ty80: `${(vy * 1.8 + gravity * 3.24).toFixed(1)}px`,
          rot80: `${rot80.toFixed(1)}deg`,
          
          tx100: `${(vx * 2.2).toFixed(1)}px`,
          ty100: `${(vy * 2.2 + gravity * 4.84).toFixed(1)}px`,
          rot100: `${rot100.toFixed(1)}deg`,
          
          scale15: (scale * 1.2).toFixed(2), // Elastic scale overshoot on spawn
          scale80: scale.toFixed(2),         // Settle scale
          duration,
          delay,
          image: shuffledImages[index % shuffledImages.length]
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after the longest possible animation finishes (2200ms)
      newParticles.forEach((p) => {
        setTimeout(() => {
          setParticles((prev) => prev.filter((item) => item.id !== p.id));
        }, 2200);
      });
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      {particles.map((p) => (
        <img
          key={p.id}
          src={p.image}
          onError={(e) => {
            const currentSrc = e.target.src;
            if (currentSrc.includes('.svg')) {
              e.target.src = currentSrc.replace('.svg', '.png');
            }
          }}
          className="click-particle pointer-events-none select-none"
          style={{
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--tx15': p.tx15,
            '--ty15': p.ty15,
            '--rot15': p.rot15,
            '--tx80': p.tx80,
            '--ty80': p.ty80,
            '--rot80': p.rot80,
            '--tx100': p.tx100,
            '--ty100': p.ty100,
            '--scale15': p.scale15,
            '--scale80': p.scale80,
            '--duration': p.duration,
            '--delay': p.delay,
          }}
          alt=""
        />
      ))}
    </div>
  );
}
