import React, { useEffect, useRef, useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { soundController } from './ChefSystem/SoundController';

export default function Hero3DBackground({ chefVisible = false }) {
  const canvasRef = useRef(null);
  const { isDark } = useContext(ThemeContext);

  const [isLogoActive, setIsLogoActive] = useState(false);
  const isLogoActiveRef = useRef(false);

  // Store projected screen space coordinates of all active particles for exact collision detection
  const projectedPointsRef = useRef([]);

  // Smooth mouse coordinates and scroll offsets tracking (with lerp interpolation)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, targetY: 0 });

  // Sizzle burst state trackers
  const prevChefVisibleRef = useRef(chefVisible);
  const sizzleRef = useRef({ intensity: 0 });
  const chefSizzleFadeRef = useRef(0);

  // Detect chef visibility changes to trigger particle sizzle burst
  useEffect(() => {
    if (prevChefVisibleRef.current !== chefVisible) {
      sizzleRef.current.intensity = 1.4; // spike sizzle effect!
      prevChefVisibleRef.current = chefVisible;
    }
  }, [chefVisible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Handles High-DPI/Retina displays
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = canvas.width = rect.width * dpr;
      height = canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      width = rect.width;
      height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse movement
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2); // -1 to 1
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2); // -1 to 1
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    // Track page scroll
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const maxScroll = 840; // Height of the landing page hero section
      scrollRef.current.targetY = Math.min(scrollPos / maxScroll, 1.0);
    };

    // Global Click Handler (ensures clicks work even if covered by overlays/gradients)
    const handleGlobalClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if click coordinate is within 40px of any Point Cloud particle
      const clickedOnParticle = projectedPointsRef.current.some(pt => {
        const dx = clickX - pt.x;
        const dy = clickY - pt.y;
        return (dx * dx + dy * dy) < 1600; // 40px comfortable click target
      });

      if (clickedOnParticle) {
        const nextState = !isLogoActiveRef.current;
        isLogoActiveRef.current = nextState;
        setIsLogoActive(nextState);
        
        // Play popping Web Audio sound
        soundController.playPop();
        
        // Trigger sizzle burst during transition
        sizzleRef.current.intensity = 1.35;
      }
    };

    // Prevent accidental text selection on spam-clicking particles
    const handleGlobalMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clickedOnParticle = projectedPointsRef.current.some(pt => {
        const dx = clickX - pt.x;
        const dy = clickY - pt.y;
        return (dx * dx + dy * dy) < 1600; // 40px comfortable target
      });

      if (clickedOnParticle) {
        e.preventDefault(); // Blocks browser text selection highlight start
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('mousedown', handleGlobalMouseDown);

    // ── 3D SHAPE CONSTELLATION MATHEMATICS ──
    const R = 230; 
    const particles = [];

    // Mesh Grid Definition (24 rings, 30 segments = 720 structural mesh points)
    const meshRings = 24;
    const meshSegments = 30;
    const totalMeshPoints = meshRings * meshSegments;

    // Generate structural mesh coordinates
    for (let r = 0; r < meshRings; r++) {
      for (let s = 0; s < meshSegments; s++) {
        const phi = (s / meshSegments) * Math.PI * 2;
        const idx = r * meshSegments + s;
        const t = idx / totalMeshPoints;

        // ── Shape 0: Chef's Cloche + Plate ──
        let cX = 0, cY = 0, cZ = 0;
        if (r < 12) {
          // Cloche Part (0 to 11)
          if (r < 8) {
            const theta = (r / 7) * (Math.PI / 2) * 0.9;
            cX = R * Math.sin(theta) * Math.cos(phi);
            cY = -R * 0.9 * Math.cos(theta) + 30; // Shifted up slightly
            cZ = R * Math.sin(theta) * Math.sin(phi);
          } else if (r < 10) {
            const rimOffset = (r === 8) ? 0 : 5;
            cX = (R + rimOffset) * Math.cos(phi);
            cY = 30;
            cZ = (R + rimOffset) * Math.sin(phi);
          } else {
            const theta = ((r - 10) / 1) * Math.PI;
            const knobR = R * 0.13;
            cX = knobR * Math.sin(theta) * Math.cos(phi);
            cY = -knobR * Math.cos(theta) - R * 0.9 + 30;
            cZ = knobR * Math.sin(theta) * Math.sin(phi);
          }
        } else {
          // Plate Part (12 to 23)
          const pr = r - 12; // 0 to 11
          if (pr < 7) {
            // Flat Well
            const radius = (pr / 6) * R * 0.75;
            cX = radius * Math.cos(phi);
            cY = 35; // Plate sits just below the cloche rim (30)
            cZ = radius * Math.sin(phi);
          } else {
            // Tilted Rim
            const radius = R * 0.75 + ((pr - 7) / 4) * R * 0.45;
            cX = radius * Math.cos(phi);
            cY = 35 - (radius - R * 0.75) * 0.25;
            cZ = radius * Math.sin(phi);
          }
        }

        // ── Shape 1: Culinary Plate ──
        let pX = 0, pY = 0, pZ = 0;
        if (r < 14) {
          // Flat Well
          const radius = (r / 13) * R * 0.75;
          pX = radius * Math.cos(phi);
          pY = -15; // Centered vertically
          pZ = radius * Math.sin(phi);
        } else {
          // Tilted Rim
          const radius = R * 0.75 + ((r - 14) / 9) * R * 0.45;
          pX = radius * Math.cos(phi);
          pY = -15 - (radius - R * 0.75) * 0.25;
          pZ = radius * Math.sin(phi);
        }

        // ── Shape 2: Wine Chalice ──
        let gX = 0, gY = 0, gZ = 0;
        if (r < 12) {
          // Bowl
          const theta = (r / 11) * (Math.PI / 2) * 0.85;
          gX = R * 0.65 * Math.sin(theta) * Math.cos(phi);
          gY = R * 0.55 * Math.cos(theta) + 20;
          gZ = R * 0.65 * Math.sin(theta) * Math.sin(phi);
        } else if (r < 20) {
          // Stem
          const stemY = -R * 0.6 + ((r - 12) / 7) * R * 0.6 + 20;
          const stemR = R * 0.05;
          gX = stemR * Math.cos(phi);
          gY = stemY;
          gZ = stemR * Math.sin(phi);
        } else {
          // Base
          const radius = R * 0.05 + ((r - 20) / 3) * R * 0.4;
          gX = radius * Math.cos(phi);
          gY = -R * 0.6 + 20;
          gZ = radius * Math.sin(phi);
        }

        // ── Shape 3: Dispersed Steam ──
        const dX = (Math.random() - 0.5) * 800;
        const dY = (Math.random() - 0.5) * 600;
        const dZ = (Math.random() - 0.5) * 400;

        // ── Shape 4: Savoré "S" Logo Monogram (Mirrored & scaled to align with Savoré branding) ──
        let sX = 0, sY = 0, sZ = 0;
        const sAngle = t * Math.PI * 2.8 - Math.PI * 0.4;
        if (t < 0.5) {
          // Top loop curve (curves left, matches branding monogram)
          sX = -R * 0.42 * Math.sin(sAngle);
          sY = (R * 0.42 * Math.cos(sAngle) - R * 0.28) * 0.85;
        } else {
          // Bottom loop curve (curves right, matches branding monogram)
          sX = -R * 0.42 * Math.sin(-sAngle + Math.PI);
          sY = (R * 0.42 * Math.cos(-sAngle + Math.PI) + R * 0.28) * 0.85;
        }
        sZ = (Math.random() - 0.5) * R * 0.18;

        particles.push({
          isMesh: true,
          x: cX + (Math.random() - 0.5) * 200,
          y: cY + (Math.random() - 0.5) * 200,
          z: cZ + (Math.random() - 0.5) * 200,
          pos0: { x: cX, y: cY, z: cZ },
          pos1: { x: pX, y: pY, z: pZ },
          pos2: { x: gX, y: gY, z: gZ },
          pos3: { x: dX, y: dY, z: dZ },
          posLogo: { x: sX, y: sY, z: sZ },
          size: 1.5 + Math.random() * 1.5,
          speed: 0.04 + Math.random() * 0.04,
          noiseAmp: 3 + Math.random() * 6,
          noiseFreq: 0.015,
          noisePhase: Math.random() * Math.PI * 2,
          colorType: Math.floor(Math.random() * 3)
        });
      }
    }

    // Precalculate wireframe connection lines between adjacent mesh points
    const lines = [];
    for (let r = 0; r < meshRings; r++) {
      for (let s = 0; s < meshSegments; s++) {
        const idx = r * meshSegments + s;
        
        // Connect to next segment in the ring loop
        const nextS = (s + 1) % meshSegments;
        const idxNextS = r * meshSegments + nextS;
        lines.push([idx, idxNextS]);

        // Connect to next ring
        if (r < meshRings - 1) {
          // Skip connecting ring 11 to ring 12 (separates Cloche/Plate and Bowl/Stem)
          if (r !== 11) {
            const idxNextR = (r + 1) * meshSegments + s;
            lines.push([idx, idxNextR]);
          }
        }
      }
    }

    // ── ADD LOOSE SPICE DRIFT PARTICLES (900 particles orbiting the mesh) ──
    const spiceCount = 900;
    for (let i = 0; i < spiceCount; i++) {
      // Pick a random mesh coordinate to cluster around, then apply offsets
      const refIdx = Math.floor(Math.random() * totalMeshPoints);
      const meshP = particles[refIdx];
      const offsetDist = 20 + Math.random() * 25;
      const offX = (Math.random() - 0.5) * offsetDist * 2;
      const offY = (Math.random() - 0.5) * offsetDist * 2;
      const offZ = (Math.random() - 0.5) * offsetDist * 2;
      
      const t = i / spiceCount;

      const pos0 = { x: meshP.pos0.x + offX, y: meshP.pos0.y + offY, z: meshP.pos0.z + offZ };
      const pos1 = { x: meshP.pos1.x + offX, y: meshP.pos1.y + offY, z: meshP.pos1.z + offZ };
      const pos2 = { x: meshP.pos2.x + offX, y: meshP.pos2.y + offY, z: meshP.pos2.z + offZ };
      const pos3 = {
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: (Math.random() - 0.5) * 400
      };

      // Savoré "S" shape for spice particles
      let sX = 0, sY = 0, sZ = 0;
      const sAngle = t * Math.PI * 2.8 - Math.PI * 0.4;
      if (t < 0.5) {
        sX = -R * 0.42 * Math.sin(sAngle) + offX;
        sY = ((R * 0.42 * Math.cos(sAngle) - R * 0.28) * 0.85) + offY;
      } else {
        sX = -R * 0.42 * Math.sin(-sAngle + Math.PI) + offX;
        sY = ((R * 0.42 * Math.cos(-sAngle + Math.PI) + R * 0.28) * 0.85) + offY;
      }
      sZ = (Math.random() - 0.5) * R * 0.18 + offZ;

      particles.push({
        isMesh: false,
        x: pos0.x + (Math.random() - 0.5) * 200,
        y: pos0.y + (Math.random() - 0.5) * 200,
        z: pos0.z + (Math.random() - 0.5) * 200,
        pos0,
        pos1,
        pos2,
        pos3,
        posLogo: { x: sX, y: sY, z: sZ },
        size: 1.0 + Math.random() * 2.2,
        speed: 0.03 + Math.random() * 0.04,
        noiseAmp: 6 + Math.random() * 12,
        noiseFreq: 0.01 + Math.random() * 0.02,
        noisePhase: Math.random() * Math.PI * 2,
        colorType: Math.floor(Math.random() * 3)
      });
    }

    const rotateX = (x, y, z, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const rotateY = (x, y, z, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    // Render loop
    let startTime = performance.now();

    const tick = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Smooth inputs (lerp)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      const scroll = scrollRef.current;
      scroll.y += (scroll.targetY - scroll.y) * 0.075;

      const time = (performance.now() - startTime) * 0.001;

      // Decay sizzle burst intensity back to zero
      const sizzle = sizzleRef.current;
      sizzle.intensity += (0 - sizzle.intensity) * 0.05; // Decay factor

      // Sizzle multiplier scale
      const activeSizzleMultiplier = 1.0 + sizzle.intensity * 12.0;

      // ── DRAW BACKGROUND RADIAL VIGNETTE ──
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createRadialGradient(
        width * 0.65 + mouse.x * 25,
        height * 0.4 + mouse.y * 25,
        100,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );

      if (isDark) {
        grad.addColorStop(0, '#080a0f'); // Deep dark midnight center (darker backdrop)
        grad.addColorStop(0.55, '#040508'); // Rich deep dark
        grad.addColorStop(1, '#010203'); // Almost pitch black
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.65, '#faf6ee'); // Savoré Light warm cream
        grad.addColorStop(1, '#f0e9d6');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // ── DRAW AMBIENT GRADIENT WASHES (AURORA GLOWS) ──
      const glows = [
        { x: width * 0.28, y: height * 0.42, r: 380, color: isDark ? 'rgba(255, 106, 77, 0.010)' : 'rgba(255, 106, 77, 0.012)' }, // Left orange wash (ultra-subtle)
        { x: width * 0.72, y: height * 0.40, r: 420, color: isDark ? 'rgba(255, 210, 127, 0.015)' : 'rgba(255, 210, 127, 0.015)' },  // Gold wash right behind chef (ultra-subtle)
        { x: width * 0.50, y: height * 0.72, r: 320, color: isDark ? 'rgba(255, 106, 77, 0.006)' : 'rgba(255, 106, 77, 0.008)' }  // Bottom center ambient glow (ultra-subtle)
      ];

      glows.forEach((g) => {
        // Slow drifting movement
        const dx = Math.sin(time * 0.3 + g.r) * 35;
        const dy = Math.cos(time * 0.28 + g.r) * 35;
        
        const aura = ctx.createRadialGradient(
          g.x + dx + mouse.x * 20,
          g.y + dy + mouse.y * 20,
          10,
          g.x + dx,
          g.y + dy,
          g.r
        );
        aura.addColorStop(0, g.color);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
      });

      // ── CHEF VISIBILITY SIZZLE/FADE LERP ──
      const targetSizzleFade = prevChefVisibleRef.current ? 1.0 : 0.0;
      chefSizzleFadeRef.current += (targetSizzleFade - chefSizzleFadeRef.current) * 0.05;
      const globalFade = 1.0 - chefSizzleFadeRef.current;

      // ── MORPHING CALCULATIONS & DRAWING ──
      const fov = 380; // Perspective zoom field of view
      const zOffset = 380; // Constant Z offset, no knockback

      const projected = new Array(particles.length);
      const currentProjected = [];

      // Center point (offset to the right on desktop to frame the mascot chef)
      const centerX = width > 768 ? width * 0.68 : width * 0.5;
      const centerY = height * 0.50; // Shifted slightly upwards

      particles.forEach((p, idx) => {
        // 1. Calculate Target Position based on Click State (Logo override) or Scroll percentage
        let tx, ty, tz;
        
        if (isLogoActiveRef.current) {
          // Morph: Savoré "S" Logo shape, morphing to pos3 (dispersed steam) as you scroll
          const ease = scroll.y * scroll.y * (3 - 2 * scroll.y);
          tx = p.posLogo.x + (p.pos3.x - p.posLogo.x) * ease;
          ty = p.posLogo.y + (p.pos3.y - p.posLogo.y) * ease;
          tz = p.posLogo.z + (p.pos3.z - p.posLogo.z) * ease;
        } else if (scroll.y < 0.33) {
          // Morph: Cloche (0) ➔ Plate (1)
          const t = scroll.y / 0.33;
          const ease = t * t * (3 - 2 * t);
          tx = p.pos0.x + (p.pos1.x - p.pos0.x) * ease;
          ty = p.pos0.y + (p.pos1.y - p.pos0.y) * ease;
          tz = p.pos0.z + (p.pos1.z - p.pos0.z) * ease;
        } else if (scroll.y < 0.66) {
          // Morph: Plate (1) ➔ Wine Chalice (2)
          const t = (scroll.y - 0.33) / 0.33;
          const ease = t * t * (3 - 2 * t);
          tx = p.pos1.x + (p.pos2.x - p.pos1.x) * ease;
          ty = p.pos1.y + (p.pos2.y - p.pos1.y) * ease;
          tz = p.pos1.z + (p.pos2.z - p.pos1.z) * ease;
        } else {
          // Morph: Wine Chalice (2) ➔ Dispersed Steam Cloud (3)
          const t = (scroll.y - 0.66) / 0.34;
          const ease = t * t * (3 - 2 * t);
          tx = p.pos2.x + (p.pos3.x - p.pos2.x) * ease;
          ty = p.pos2.y + (p.pos3.y - p.pos2.y) * ease;
          tz = p.pos2.z + (p.pos3.z - p.pos2.z) * ease;
        }

        // Apply Chef Sizzle Upwards Scatter
        if (chefSizzleFadeRef.current > 0.001) {
          const fadeEase = chefSizzleFadeRef.current;
          // Interpolate current target towards pos3 (dispersed) and shift upwards
          tx = tx + (p.pos3.x - tx) * fadeEase;
          ty = ty + (p.pos3.y - ty - 600) * fadeEase; // Push up by 600
          tz = tz + (p.pos3.z - tz) * fadeEase;
        }

        // Add organic thermal noise jitter (sizzling cooking effect)
        const jitter = Math.sin(time * p.noiseFreq * 100 + p.noisePhase) * p.noiseAmp;
        
        // Fades jitter factor when shapes are fully formed (settles points)
        const transitionFactor = Math.sin(scroll.y * Math.PI * 3);
        
        // Apply active sizzle spikes multiplier
        const activeJitter = jitter * (0.3 + 0.7 * Math.abs(transitionFactor)) * activeSizzleMultiplier;

        tx += activeJitter * 0.45;
        ty += activeJitter * 0.45 + Math.sin(time * 1.5 + p.noisePhase) * 4;
        tz += activeJitter * 0.45;

        // Physics: Spring coords towards target. Speeds up when sizzling.
        const lerpSpeed = p.speed * (1.0 + sizzle.intensity * 4.0);
        p.x += (tx - p.x) * lerpSpeed;
        p.y += (ty - p.y) * lerpSpeed;
        p.z += (tz - p.z) * lerpSpeed;

        // Apply global auto-spin and mouse parallax tilt ONLY if logo is NOT active
        let rotP;
        if (isLogoActiveRef.current) {
          // Keep Savoré Logo facing forward (no auto-spin Y), but apply 3D scroll tilt X and mouse tilts
          const mouseAngleY = mouse.x * 0.18;
          const mouseAngleX = -mouse.y * 0.14 + scroll.y * 0.12;
          rotP = rotateY(p.x, p.y, p.z, mouseAngleY);
          rotP = rotateX(rotP.x, rotP.y, rotP.z, mouseAngleX);
        } else {
          const autoSpinAngleY = time * 0.24;
          rotP = rotateY(p.x, p.y, p.z, autoSpinAngleY);

          const mouseAngleY = mouse.x * 0.24;
          // Apply a default baseline tilt (0.20) simulating the cursor being UP
          const mouseAngleX = 0.20 - mouse.y * 0.15 + scroll.y * 0.12;
          rotP = rotateY(rotP.x, rotP.y, rotP.z, mouseAngleY);
          rotP = rotateX(rotP.x, rotP.y, rotP.z, mouseAngleX);
        }

        // Perspective Projection
        const finalZ = rotP.z + zOffset;
        if (finalZ > 10) {
          const scale = fov / finalZ;
          let projX = rotP.x * scale + centerX;
          let projY = rotP.y * scale + centerY;

          // Animation on Logo hover: a small subset of particles disintegrate (push away) smoothly
          if (isLogoActiveRef.current && idx % 5 === 0) {
            const mouseCanvasX = mouse.x * (width / 2) + width / 2;
            const mouseCanvasY = mouse.y * (height / 2) + height / 2;
            const dx = projX - mouseCanvasX;
            const dy = projY - mouseCanvasY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Particles within 125px radius push outward along vector (re-integrates back on mouse leave)
            if (dist < 125) {
              const strength = 1.0 - dist / 125;
              const pushFactor = strength * 45; // Smooth distance push offset
              projX += (dx / (dist || 1)) * pushFactor;
              projY += (dy / (dist || 1)) * pushFactor;
            }
          }

          projected[idx] = {
            x: projX,
            y: projY,
            z: finalZ,
            size: p.size * scale * 0.85,
            colorType: p.colorType,
            isMesh: p.isMesh
          };

          // Save projected coordinates of mesh points for accurate click detection
          if (p.isMesh) {
            currentProjected.push({ x: projX, y: projY });
          }
        } else {
          projected[idx] = null;
        }
      });

      // Update projected points ref for handleCanvasClick
      projectedPointsRef.current = currentProjected;

      // Update cursor dynamically based on whether hovering over any visible particle
      const mouseCanvasX = mouse.x * (width / 2) + width / 2;
      const mouseCanvasY = mouse.y * (height / 2) + height / 2;

      const isHoveringParticle = currentProjected.some(pt => {
        const dx = mouseCanvasX - pt.x;
        const dy = mouseCanvasY - pt.y;
        return (dx * dx + dy * dy) < 1296; // 36px radius check (smooth, forgiving hover pointer)
      });

      if (isHoveringParticle) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }

      // ── DRAW MESH CONNECTION LINES (Hologram grid) ──
      ctx.lineWidth = 0.75;
      lines.forEach(([u, v]) => {
        const p1 = projected[u];
        const p2 = projected[v];

        if (p1 && p2) {
          const avgZ = (p1.z + p2.z) / 2;
          
          // Fades out lines when scrolling deep into the dispersed steam phase
          const fade = Math.max(0, 1.2 - avgZ / 580) * Math.max(0, 1.0 - (scroll.y - 0.7) * 3) * globalFade;
          
          if (fade > 0.01) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            if (isDark) {
              ctx.strokeStyle = `rgba(255, 106, 77, ${fade * 0.14})`; // Glowing orange mesh lines
            } else {
              ctx.strokeStyle = `rgba(255, 106, 77, ${fade * 0.08})`;
            }
            ctx.stroke();
          }
        }
      });

      // ── DRAW GLOWING DUST PARTICLES (Depth-Sorted) ──
      const drawList = [];
      projected.forEach((pt) => {
        if (pt && pt.x >= -50 && pt.x <= width + 50 && pt.y >= -50 && pt.y <= height + 50) {
          drawList.push(pt);
        }
      });
      drawList.sort((a, b) => b.z - a.z);

      drawList.forEach((pt) => {
        let opacity = Math.max(0.04, Math.min(0.9, 1.35 - pt.z / 600));
        opacity *= globalFade;
        if (opacity < 0.01) return; // Skip rendering fully transparent particles

        const radius = Math.max(0.4, pt.size);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

        if (isDark) {
          if (pt.colorType === 0) {
            ctx.fillStyle = `rgba(255, 106, 77, ${opacity * 0.75})`; // Restored orange glow
          } else if (pt.colorType === 1) {
            ctx.fillStyle = `rgba(255, 210, 127, ${opacity * 0.90})`; // Restored gold glow
          } else {
            ctx.fillStyle = `rgba(250, 246, 238, ${opacity * 0.40})`; // Restored cream
          }
        } else {
          if (pt.colorType === 0) {
            ctx.fillStyle = `rgba(255, 106, 77, ${opacity * 0.45})`;
          } else if (pt.colorType === 1) {
            ctx.fillStyle = `rgba(220, 155, 65, ${opacity * 0.50})`;
          } else {
            ctx.fillStyle = `rgba(130, 120, 105, ${opacity * 0.28})`;
          }
        }
        ctx.fill();

        // Draw ambient halo glow for closer, prominent particles
        if (isDark && radius > 2.8 && opacity > 0.55) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * 2.8, 0, Math.PI * 2);
          if (pt.colorType === 0) {
            ctx.fillStyle = `rgba(255, 106, 77, 0.08)`;
          } else {
            ctx.fillStyle = `rgba(255, 210, 127, 0.08)`;
          }
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Cleanup listeners and loops
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('mousedown', handleGlobalMouseDown);
    };
  }, [isDark]);

  return (
    <div className="absolute top-0 left-0 right-0 h-[840px] overflow-hidden z-0 pointer-events-none w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-auto"
        style={{ opacity: 0.98 }}
      />
    </div>
  );
}
