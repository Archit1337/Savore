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
        const angleDeg = baseAngle + (index * 120) + (Math.random() - 0.5) * 15;
        const angle = angleDeg * (Math.PI / 180);
        const speed = 70 + Math.random() * 50; // Increased speed for wider spread
        
        return {
          id,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 50, // Slight upward bias but keep radial spread dominant
          rot: (Math.random() - 0.5) * 180,
          scale: 0.55 + Math.random() * 0.35, // Slightly smaller range to avoid overlap collisions
          image: shuffledImages[index % shuffledImages.length]
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);

      // Remove particles after the CSS animation completes (1600ms)
      newParticles.forEach((p) => {
        setTimeout(() => {
          setParticles((prev) => prev.filter((item) => item.id !== p.id));
        }, 1600);
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
            '--vx': `${p.vx}`,
            '--vy': `${p.vy}`,
            '--rot': `${p.rot}deg`,
            '--scale': `${p.scale}`,
          }}
          alt=""
        />
      ))}
    </div>
  );
}
