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
  '/click-img10.svg?v=3',
  '/click-img11.svg?v=3',
  '/click-img12.svg?v=3',
  '/click-img13.svg?v=3',
  '/click-img14.svg?v=3'
];
export default function ClickBurstEffect() {
  const [particles, setParticles] = useState([]);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (CLICK_IMAGES.length === 0) return;

      const now = Date.now();
      if (now - lastClickTimeRef.current < 200) {
        return; // Snappy debounce (200ms) for quick subsequent clicks
      }
      lastClickTimeRef.current = now;

      // Select a random image
      const randomImg = CLICK_IMAGES[Math.floor(Math.random() * CLICK_IMAGES.length)];

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const vy = -60 - Math.random() * 20;     // Float straight up (60px to 80px)
      const rot = (Math.random() - 0.5) * 12;  // Very subtle luxury rotation tilt (-6deg to +6deg)
      const scale = 0.65 + Math.random() * 0.15; // Elegant, moderate size

      const newParticle = {
        id,
        x: e.clientX,
        y: e.clientY,
        ty15: `${(vy * 0.2).toFixed(1)}px`,
        rot15: `${(rot * 0.2).toFixed(1)}deg`,
        
        ty65: `${(vy * 0.8).toFixed(1)}px`,
        rot65: `${(rot * 0.8).toFixed(1)}deg`,
        
        ty100: `${vy.toFixed(1)}px`,
        rot100: `${rot.toFixed(1)}deg`,
        
        scale0: (scale * 0.4).toFixed(2),      // Scale entry start size
        scaleRest: scale.toFixed(2),           // Final rest scale
        image: randomImg
      };

      setParticles((prev) => [...prev, newParticle]);

      // Remove particle after animation completes (1300ms)
      setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== id));
      }, 1300);
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
            '--ty15': p.ty15,
            '--rot15': p.rot15,
            '--ty65': p.ty65,
            '--rot65': p.rot65,
            '--ty100': p.ty100,
            '--rot100': p.rot100,
            '--scale0': p.scale0,
            '--scale-rest': p.scaleRest,
          }}
          alt=""
        />
      ))}
    </div>
  );
}
