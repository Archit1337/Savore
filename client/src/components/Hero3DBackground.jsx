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

  // Arrays to hold space stars and floating mini food items that persist across renders
  const starsRef = useRef([]);
  const foodsRef = useRef([]);
  const shootingStarRef = useRef({ active: false });

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

    // Seed stars array if not already initialized
    if (starsRef.current.length === 0) {
      const tempStars = [];
      // 250 deep-space static stars (Milky Way background dust texture)
      for (let i = 0; i < 250; i++) {
        tempStars.push({
          x: Math.random(),
          y: Math.random(),
          size: 0.15 + Math.random() * 0.45,
          twinkleSpeed: 0, // completely static
          phase: 0,
          colorType: 1 // white
        });
      }
      // 120 twinkling foreground stars (larger, colored)
      for (let i = 0; i < 120; i++) {
        tempStars.push({
          x: Math.random(),
          y: Math.random(),
          size: 0.5 + Math.random() * 1.1,
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2,
          colorType: Math.floor(Math.random() * 3) // 0 = gold, 1 = white, 2 = cool blue
        });
      }
      starsRef.current = tempStars;
    }

    // Seed floating mini food items if not already initialized (using 3D depth system)
    if (foodsRef.current.length === 0) {
      const tempFoods = [];
      for (let i = 0; i < 20; i++) {
        const zDepth = 0.15 + Math.random() * 0.85; // 0.15 (far back) to 1.0 (very close)
        tempFoods.push({
          x: Math.random(),
          y: Math.random(),
          zDepth,
          size: (6 + Math.random() * 6) * zDepth + 4, // Far items are tiny, near items are bigger
          type: Math.floor(Math.random() * 7), // 7 distinct shape templates
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.012 * zDepth,
          driftX: (Math.random() - 0.5) * 0.0005 * zDepth,
          driftY: (Math.random() - 0.5) * 0.0005 * zDepth,
          // Foreground items are blurred to simulate a premium depth-of-field lens effect
          blur: zDepth > 0.72 ? (zDepth - 0.72) * 8 : 0
        });
      }
      foodsRef.current = tempFoods;
    }
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

        // ── Shape 1: Sizzling Cast Iron Skillet with a Fried Egg ──
        let pX = 0, pY = 0, pZ = 0;
        if (r < 6) {
          // Skillet Pan (Flat Base & Angled Walls)
          if (r < 4) {
            pY = 30; // Flat bottom
            const radius = R * 0.65 * (r / 3);
            pX = radius * Math.cos(phi);
            pZ = radius * Math.sin(phi);
          } else {
            pY = 30 - ((r - 3) / 2) * 15; // Sloped walls rising to Y=15
            const radius = R * 0.65 + ((r - 3) / 2) * R * 0.05;
            pX = radius * Math.cos(phi);
            pZ = radius * Math.sin(phi);
          }
        } else if (r < 10) {
          // Skillet Handle (Protruding along the X-axis)
          const t = (r - 6) / 3; // 0 to 1
          const handleLength = R * 0.85;
          const centerX = R * 0.70 + t * handleLength; 
          const handleR = R * 0.06 * (1 - t * 0.2); // Tapers slightly towards the end
          
          pX = centerX;
          pY = 15 + handleR * Math.cos(phi); // Forms a tube along X-axis
          pZ = handleR * Math.sin(phi);
        } else if (r < 18) {
          // Egg White (Sizzling organic flat shape lying inside the pan)
          const t = (r - 9) / 8; // 1/8 to 1
          const maxRadius = R * 0.45 + Math.sin(phi * 4) * 15 + Math.cos(phi * 7) * 10;
          const radius = maxRadius * t; 
          
          pY = 28; // Resting just above the pan base
          pX = radius * Math.cos(phi);
          pZ = radius * Math.sin(phi);
        } else {
          // Egg Yolk (Plump 3D dome, sitting slightly off-center)
          const t = (r - 17) / 6; // 1/6 to 1
          const yolkR = R * 0.15;
          const radius = yolkR * Math.cos(t * Math.PI / 2); // Curves to a point
          
          pY = 28 - yolkR * Math.sin(t * Math.PI / 2); // Pops upwards
          pX = R * 0.12 + radius * Math.cos(phi); // Shifted slightly right
          pZ = -R * 0.08 + radius * Math.sin(phi); // Shifted slightly back
        }

        // ── Shape 2: Mortar and Pestle ──
        let gX = 0, gY = 0, gZ = 0;
        if (r < 16) {
          // Mortar (Heavy Stone Bowl)
          let mRadius = 0;
          if (r < 3) {
            // Thick Base
            mRadius = R * 0.35;
            gY = 45 - r * 5;
          } else if (r < 14) {
            // Heavy Sloping Body
            const t = (r - 2) / 11; 
            mRadius = R * 0.35 + Math.pow(t, 1.5) * R * 0.45;
            gY = 30 - t * 65; 
          } else {
            // Thick Lip
            mRadius = R * 0.80 - (r - 13) * 8;
            gY = -35 - (r - 13) * 2;
          }
          gX = mRadius * Math.cos(phi);
          gZ = mRadius * Math.sin(phi);
        } else {
          // Pestle (Grinding Club protruding diagonally)
          const t = (r - 16) / 7; // 0 to 1
          
          let pestleR = R * 0.08;
          if (r < 18) pestleR = R * 0.16; // Grinding head
          if (r === 23) pestleR = R * 0.12; // Handle pommel
          
          // Angled extrusion matrix hack
          const pCenterX = -R * 0.2 + t * R * 1.1; 
          const pCenterY = 10 - t * 130; 
          const pCenterZ = -R * 0.1 + t * R * 0.4;
          
          gX = pCenterX + pestleR * Math.cos(phi);
          gY = pCenterY;
          gZ = pCenterZ + pestleR * Math.sin(phi);
        }

        // ── Shape 3: Japanese Ramen Bowl (With Noodles inside!) ──
        let bX = 0, bY = 0, bZ = 0;
        if (r < 3) {
          // Wooden Foot Base
          const radius = R * 0.25;
          bX = radius * Math.cos(phi);
          bY = 35 - (r / 2) * 10; // 35 to 25
          bZ = radius * Math.sin(phi);
        } else if (r < 16) {
          // Sloping Bowl Exterior
          const theta = ((r - 3) / 12) * (Math.PI / 2);
          const radius = R * 0.25 + R * 0.65 * Math.sin(theta);
          bX = radius * Math.cos(phi);
          bY = 25 - R * 0.55 * Math.sin(theta);
          bZ = radius * Math.sin(phi);
        } else if (r === 16) {
          // Thick Rim
          const radius = R * 0.90 + 3;
          bX = radius * Math.cos(phi);
          bY = 25 - R * 0.55;
          bZ = radius * Math.sin(phi);
        } else {
          // Ramen Noodles Inside the Bowl (r=17 to 23)
          // Creates a chaotic, wavy interior surface mound sitting below the rim
          const innerRadius = R * 0.85 * ((23 - r) / 6); 
          const noodleWobble = Math.sin(phi * 12 + r * 3) * 12; // Curly sine waves
          const noodleHeight = (25 - R * 0.55) + 15 + Math.cos(phi * 8) * 8 + ((23 - r) / 6) * -15; // Mounded slightly
          
          bX = (innerRadius + noodleWobble) * Math.cos(phi);
          bY = noodleHeight;
          bZ = (innerRadius + noodleWobble) * Math.sin(phi);
        }

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

        const dX = (Math.random() - 0.5) * 800;
        const dY = (Math.random() - 0.5) * 600;
        const dZ = (Math.random() - 0.5) * 400;

        particles.push({
          isMesh: true,
          x: cX + (Math.random() - 0.5) * 200,
          y: cY + (Math.random() - 0.5) * 200,
          z: cZ + (Math.random() - 0.5) * 200,
          pos0: { x: cX, y: cY, z: cZ },
          pos1: { x: pX, y: pY, z: pZ },
          pos2: { x: gX, y: gY, z: gZ },
          pos3: { x: bX, y: bY, z: bZ },
          posLogo: { x: sX, y: sY, z: sZ },
          posDispersed: { x: dX, y: dY, z: dZ },
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

      // ── DRAW DEEP SPACE VOID WITH CELESTIAL DETAILS ──
      ctx.clearRect(0, 0, width, height);
      // Base background color matching Savoré's theme palettes
      ctx.fillStyle = isDark ? '#05070c' : '#faf9f5';
      ctx.fillRect(0, 0, width, height);

      // Deep space atmospheric nebulas (extremely faint gas clouds)
      const nebulas = [
        { x: width * 0.3, y: height * 0.4, r: 400, color: isDark ? 'rgba(255, 106, 77, 0.03)' : 'rgba(255, 182, 193, 0.07)' },
        { x: width * 0.7, y: height * 0.6, r: 500, color: isDark ? 'rgba(255, 210, 127, 0.035)' : 'rgba(245, 222, 179, 0.07)' },
        { x: width * 0.5, y: height * 0.3, r: 350, color: isDark ? 'rgba(139, 92, 246, 0.025)' : 'rgba(230, 230, 250, 0.07)' }
      ];
      nebulas.forEach((neb, idx) => {
        const driftX = Math.sin(time * 0.15 + idx) * 30;
        const driftY = Math.cos(time * 0.12 + idx) * 30;
        const grad = ctx.createRadialGradient(neb.x + driftX, neb.y + driftY, 0, neb.x + driftX, neb.y + driftY, neb.r);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x + driftX, neb.y + driftY, neb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Draw Twinkling & Static Stars (Sugar Crystals / Gold Flecks) ──
      if (starsRef.current && starsRef.current.length > 0) {
        starsRef.current.forEach((star) => {
          // If twinkleSpeed is 0, star stays static (Milky Way background dust)
          const twinkle = star.twinkleSpeed === 0 
            ? 0.5 
            : 0.2 + 0.8 * Math.sin(time * star.twinkleSpeed * 50 + star.phase);
            
          const starX = star.x * width;
          const starY = star.y * height;
          
          ctx.beginPath();
          ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
          
          let starColor = 'rgba(255,255,255,';
          if (star.colorType === 0) {
            starColor = isDark ? 'rgba(255, 220, 150, ' : 'rgba(210, 150, 80, ';
          } else if (star.colorType === 1) {
            starColor = isDark ? 'rgba(255, 255, 255, ' : 'rgba(130, 120, 110, ';
          } else {
            starColor = isDark ? 'rgba(180, 220, 255, ' : 'rgba(110, 160, 220, ';
          }
          
          ctx.fillStyle = starColor + (twinkle * (star.twinkleSpeed === 0 ? 0.45 : 0.75)) + ')';
          ctx.fill();
        });
      }

      // ── Draw Procedural Shooting Stars (Meteors) ──
      if (isDark) {
        // Occasionally trigger a shooting star randomly
        if (Math.random() < 0.006 && !shootingStarRef.current.active) {
          shootingStarRef.current = {
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.3,
            dx: 8 + Math.random() * 8,
            dy: 4 + Math.random() * 5,
            length: 90 + Math.random() * 80,
            opacity: 0.85,
            active: true
          };
        }
        
        const ss = shootingStarRef.current;
        if (ss.active) {
          ctx.save();
          const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.dx * 1.5, ss.y - ss.dy * 1.5);
          grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - ss.dx * 2, ss.y - ss.dy * 2);
          ctx.stroke();
          ctx.restore();

          // Move meteor frame
          ss.x += ss.dx;
          ss.y += ss.dy;
          ss.opacity -= 0.022; // Fade out slowly
          
          if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
            ss.active = false;
          }
        }
      }

      // ── Draw & Animate Floating Mini Food Items ──
      if (foodsRef.current && foodsRef.current.length > 0) {
        foodsRef.current.forEach((food) => {
          // Update positions with slow drift
          food.x += food.driftX;
          food.y += food.driftY;
          food.angle += food.rotSpeed;

          // Screen wrapping
          if (food.x < -0.1) food.x = 1.1;
          if (food.x > 1.1) food.x = -0.1;
          if (food.y < -0.1) food.y = 1.1;
          if (food.y > 1.1) food.y = -0.1;

          // Multi-plane parallax offset: foreground elements respond more to scroll/mouse
          const parallaxX = mouse.x * 25 * food.zDepth;
          const parallaxY = mouse.y * 25 * food.zDepth - (scroll.y * 120 * food.zDepth);

          const foodX = food.x * width + parallaxX;
          const foodY = food.y * height + parallaxY;

          ctx.save();
          ctx.translate(foodX, foodY);
          ctx.rotate(food.angle);
          
          // Apply hardware-accelerated Depth of Field blur to foreground elements
          if (food.blur > 0.5) {
            ctx.filter = `blur(${food.blur}px)`;
          }

          // Render with elegant transparency based on depth
          ctx.globalAlpha = isDark ? (0.15 + food.zDepth * 0.30) : (0.1 + food.zDepth * 0.22);
          drawMiniFoodItem(ctx, food.type, food.size, isDark);
          
          ctx.restore();
        });
        ctx.globalAlpha = 1.0; // Reset canvas alpha
        ctx.filter = 'none'; // Reset canvas filter
      }

      // ── CHEF VISIBILITY SIZZLE/FADE LERP ──
      const targetSizzleFade = prevChefVisibleRef.current ? 1.0 : 0.0;
      chefSizzleFadeRef.current += (targetSizzleFade - chefSizzleFadeRef.current) * 0.05;
      const globalFade = 1.0 - chefSizzleFadeRef.current;

      // ── MORPHING CALCULATIONS & DRAWING ──
      const fov = 380; // Perspective zoom field of view
      // Dynamic Z knockback: as you scroll down, push the 3D constellation deeper into the screen
      const zOffset = 380 + (scroll.y * 220); 

      const projected = new Array(particles.length);
      const currentProjected = [];

      // Center point (offset to the right on desktop to frame the mascot chef)
      const centerX = width > 768 ? width * 0.68 : width * 0.5;
      const centerY = height * 0.50; // Shifted slightly upwards

      // ── TIME-BASED AUTO-MORPHING LOGIC ──
      const SHAPE_COUNT = 4;
      const INTERVAL = 5.0; // 5 seconds per shape
      const currentCycle = Math.max(0, time / INTERVAL);
      const shapeIndex = Math.floor(currentCycle) % SHAPE_COUNT;
      const nextShapeIndex = (shapeIndex + 1) % SHAPE_COUNT;
      
      const cycleProgress = currentCycle % 1.0;
      let morphEase = 0;
      // Morph during the final 1.5 seconds (0.7 to 1.0 of the cycle)
      if (cycleProgress > 0.7) {
        const tMorph = (cycleProgress - 0.7) / 0.3;
        morphEase = tMorph * tMorph * (3 - 2 * tMorph); // Smoothstep
      }

      particles.forEach((p, idx) => {
        // 1. Calculate Target Position based on Click State (Logo override) or Auto-Morph
        let tx, ty, tz;
        
        if (isLogoActiveRef.current) {
          // Fallback initialization for Hot Module Replacement (HMR) to prevent NaN crashes
          if (!p.posDispersed) {
            p.posDispersed = {
              x: (Math.random() - 0.5) * 800,
              y: (Math.random() - 0.5) * 600,
              z: (Math.random() - 0.5) * 400
            };
          }
          
          // Savoré S Logo: Retains its dramatic scroll-based burst dispersion!
          const ease = scroll.y * scroll.y * (3 - 2 * scroll.y);
          tx = p.posLogo.x + (p.posDispersed.x - p.posLogo.x) * ease;
          ty = p.posLogo.y + (p.posDispersed.y - p.posLogo.y) * ease;
          tz = p.posLogo.z + (p.posDispersed.z - p.posLogo.z) * ease;
        } else {
          // Helper to fetch shape position
          const getPos = (i) => {
            if (i === 0) return p.pos0;
            if (i === 1) return p.pos1;
            if (i === 2) return p.pos2;
            if (i === 3) return p.pos3;
            return p.pos0;
          };
          
          const posCurrent = getPos(shapeIndex);
          const posNext = getPos(nextShapeIndex);
          
          tx = posCurrent.x + (posNext.x - posCurrent.x) * morphEase;
          ty = posCurrent.y + (posNext.y - posCurrent.y) * morphEase;
          tz = posCurrent.z + (posNext.z - posCurrent.z) * morphEase;
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
          // As you scroll down, heavily spin the 3D mesh to simulate tumbling through space
          const autoSpinAngleY = time * 0.24 + (scroll.y * Math.PI * 1.5);
          rotP = rotateY(p.x, p.y, p.z, autoSpinAngleY);

          const mouseAngleY = mouse.x * 0.24;
          // Apply a default baseline tilt, plus an aggressive scroll tilt to reveal top/bottom perspectives
          const mouseAngleX = 0.20 - mouse.y * 0.15 + (scroll.y * Math.PI * 0.35);
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

      const targetCursor = isHoveringParticle ? 'pointer' : 'default';
      if (canvas.style.cursor !== targetCursor) {
        canvas.style.cursor = targetCursor;
      }

      // ── DRAW MESH CONNECTION LINES (Hologram grid) ──
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = '#FF6A4D'; // Glowing orange mesh lines
      
      lines.forEach(([u, v]) => {
        const p1 = projected[u];
        const p2 = projected[v];

        if (p1 && p2) {
          const avgZ = (p1.z + p2.z) / 2;
          
          // Fades out lines when scrolling deep into the dispersed steam phase
          const fade = Math.max(0, 1.2 - avgZ / 580) * Math.max(0, 1.0 - (scroll.y - 0.7) * 3) * globalFade;
          
          if (fade > 0.01) {
            ctx.globalAlpha = isDark ? fade * 0.14 : fade * 0.08;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
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
            ctx.globalAlpha = opacity * 0.75;
            ctx.fillStyle = '#FF6A4D'; // Restored orange glow
          } else if (pt.colorType === 1) {
            ctx.globalAlpha = opacity * 0.90;
            ctx.fillStyle = '#FFD27F'; // Restored gold glow
          } else {
            ctx.globalAlpha = opacity * 0.40;
            ctx.fillStyle = '#FAF6EE'; // Restored cream
          }
        } else {
          if (pt.colorType === 0) {
            ctx.globalAlpha = opacity * 0.45;
            ctx.fillStyle = '#FF6A4D';
          } else if (pt.colorType === 1) {
            ctx.globalAlpha = opacity * 0.50;
            ctx.fillStyle = '#DC9B41';
          } else {
            ctx.globalAlpha = opacity * 0.28;
            ctx.fillStyle = '#827869';
          }
        }
        ctx.fill();

        // Draw ambient halo glow for closer, prominent particles
        if (isDark && radius > 2.8 && opacity > 0.55) {
          ctx.globalAlpha = 0.08;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * 2.8, 0, Math.PI * 2);
          if (pt.colorType === 0) {
            ctx.fillStyle = '#FF6A4D';
          } else {
            ctx.fillStyle = '#FFD27F';
          }
          ctx.fill();
        }
      });
      
      ctx.globalAlpha = 1.0; // Reset alpha for the next frame

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

// ── MINIMALIST STYLIZED CULINARY SPACE DEBRIS ENGINE ──
function drawMiniFoodItem(ctx, type, size, isDark) {
  ctx.save();
  
  // Setup premium styling matching Savoré's outline constellation aesthetic
  const strokeColor = isDark ? 'rgba(255, 210, 127, 0.65)' : 'rgba(24, 22, 21, 0.45)';
  const accentColor = isDark ? '#FF6A4D' : '#FF5A3C'; // Warm coral
  
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.3;
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  
  switch(type) {
    case 0: // 🍩 Donut (Glowing rings & tiny nodes)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      
      // Accent stars/dots representing frosting sprinkles
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(-size * 0.4, -size * 0.3, 1.5, 0, Math.PI * 2);
      ctx.arc(size * 0.4, size * 0.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 1: // 🍕 Pizza (Minimalist structural triangle)
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.6);
      ctx.lineTo(size * 0.7, -size * 0.6);
      ctx.lineTo(0, size * 0.85);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
      // Crust double line
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.48);
      ctx.lineTo(size * 0.7, -size * 0.48);
      ctx.stroke();
      
      // Accent pepperoni points
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, -size * 0.1, 1.8, 0, Math.PI * 2);
      ctx.arc(-size * 0.2, -size * 0.3, 1.5, 0, Math.PI * 2);
      ctx.arc(size * 0.15, size * 0.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 2: // 🍣 Sushi (Nested geometric nodes)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 3: // 🍔 Tiny Hamburger (Architectural layered line slices)
      const h = size * 0.25;
      // Bun Top Dome
      ctx.beginPath();
      ctx.arc(0, -h * 0.2, size * 0.75, Math.PI, 0);
      ctx.stroke();
      ctx.fill();
      
      // Slices
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, h * 0.1);
      ctx.lineTo(size * 0.8, h * 0.1);
      ctx.moveTo(-size * 0.8, h * 0.5);
      ctx.lineTo(size * 0.8, h * 0.5);
      ctx.stroke();
      
      // Bun Bottom
      ctx.beginPath();
      // Simple round rectangle using lines
      ctx.arc(-size * 0.6, h * 1.1, size * 0.15, Math.PI * 0.5, Math.PI);
      ctx.lineTo(-size * 0.75, h * 0.8);
      ctx.lineTo(size * 0.75, h * 0.8);
      ctx.arc(size * 0.6, h * 1.1, size * 0.15, 0, Math.PI * 0.5);
      ctx.lineTo(-size * 0.6, h * 1.25);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      break;

    case 4: // 🍊 Orange Slice (Radial segment lines)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      // Inner rind ring
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      
      // Spokes
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.7 * Math.cos(angle), size * 0.7 * Math.sin(angle));
        ctx.stroke();
      }
      break;

    case 5: // 🥐 Croissant (Sweeping crescent lines)
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, Math.PI * 0.1, Math.PI * 1.9);
      ctx.quadraticCurveTo(-size * 0.2, 0, 0, -size * 0.8);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
      // Inner wrap details
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, Math.PI * 0.25, Math.PI * 1.75);
      ctx.stroke();
      break;

    case 6: // 🍦 Soft Serve Ice Cream
      // Cone
      ctx.beginPath();
      ctx.moveTo(-size * 0.45, 0);
      ctx.lineTo(size * 0.45, 0);
      ctx.lineTo(0, size * 0.95);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      
      // Scoop
      ctx.beginPath();
      ctx.arc(0, -size * 0.15, size * 0.5, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
      ctx.fill();
      
      // Cherry Node
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, -size * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    default:
      break;
  }

  ctx.restore();
}
