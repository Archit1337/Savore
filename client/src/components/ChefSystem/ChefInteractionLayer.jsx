// Savoré — Chef Interaction Layer Component

import React, { useState, useRef, useEffect } from 'react';
import { useChefMood } from './ChefMoodEngine';
import ChefAvatar from './ChefAvatar';
import { soundController } from './SoundController';

export default function ChefInteractionLayer({ forceSmile = false }) {
  const { hoverStart, hoverEnd, triggerRecommendation } = useChefMood();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const rAF = useRef(null);

  // Passive event listener for high performance (60fps) mouse track
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    if (rAF.current) cancelAnimationFrame(rAF.current);
    
    const clientX = e.clientX;
    const clientY = e.clientY;

    rAF.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2); // Normalize to -1 to 1
      const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2); // Normalize to -1 to 1
      setMousePos({ x, y });
    });
  };

  useEffect(() => {
    return () => {
      if (rAF.current) cancelAnimationFrame(rAF.current);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverStart();
    soundController.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
    hoverEnd();
  };

  const handleClick = (e) => {
    e.stopPropagation();
    triggerRecommendation();
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-[320px] h-[420px] mx-auto cursor-pointer z-20 pointer-events-auto [perspective:1000px]"
    >
      {/* Volumetric glow backdrop */}
      <div
        className="chef-avatar-ambient-glow absolute top-[70px] left-[20px] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{
          opacity: isHovered ? 0.65 : 0.4,
          background: 'radial-gradient(circle, rgba(255, 90, 60, 0.16) 0%, rgba(255, 90, 60, 0) 70%)',
          transition: 'opacity 500ms var(--ease-apple)',
          transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`
        }}
      />

      <ChefAvatar mousePos={mousePos} isHovered={isHovered} forceSmile={forceSmile} />
    </div>
  );
}
