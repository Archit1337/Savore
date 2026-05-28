// Savoré — FlyToCartPortal: Cinematic plate-to-cart microinteraction
// Renders as a React Portal at the root so it can animate across the full viewport.

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../utils/mediaResolver';
import SafeImage from '../SafeImage';

/**
 * FlyToCartPortal
 * @param {boolean}  isFlying     — triggers the animation
 * @param {string}   imageUrl     — dish thumbnail
 * @param {string}   dishName     — dish name (for aria / alt)
 * @param {object}   sourceRef    — ref of the element the plate flies FROM
 * @param {function} onComplete   — called when animation finishes
 */
export default function FlyToCartPortal({ isFlying, imageUrl, dishName, sourceRef, onComplete }) {
  const [coords, setCoords] = useState(null);
  const [targetCoords, setTargetCoords] = useState(null);

  useEffect(() => {
    if (!isFlying) return;

    // Resolve source position (bubble "Add to Cart" button)
    let srcX = window.innerWidth / 2;
    let srcY = window.innerHeight * 0.55;
    if (sourceRef?.current) {
      const r = sourceRef.current.getBoundingClientRect();
      srcX = r.left + r.width / 2;
      srcY = r.top + r.height / 2;
    }

    // Resolve target position (cart icon in navbar)
    let tgtX = window.innerWidth - 80;
    let tgtY = 32;
    const cartEl = document.getElementById('shopping-cart-nav-icon');
    if (cartEl) {
      const r = cartEl.getBoundingClientRect();
      tgtX = r.left + r.width / 2;
      tgtY = r.top + r.height / 2;
    }

    setCoords({ x: srcX, y: srcY });
    setTargetCoords({ x: tgtX, y: tgtY });
  }, [isFlying]);

  if (!coords || !targetCoords) return null;

  const dx = targetCoords.x - coords.x;
  const dy = targetCoords.y - coords.y;

  // Slight arc: control point offset
  const arcY = Math.min(dy * 0.4, -60);

  return createPortal(
    <AnimatePresence>
      {isFlying && coords && (
        <motion.div
          key="fly-plate"
          aria-hidden="true"
          className="fixed w-16 h-16 rounded-full overflow-hidden z-[9999] pointer-events-none shadow-[0_8px_24px_rgba(0,0,0,0.22)] border-2 border-white/[0.18] will-change-[transform,opacity]"
          style={{
            top: coords.y - 32,
            left: coords.x - 32,
          }}
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            x: [0, dx * 0.5 + arcY * 0.3, dx],
            y: [0, arcY, dy],
            scale: [1, 0.88, 0.42],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.45, 1],
          }}
          onAnimationComplete={onComplete}
        >
          {imageUrl ? (
            <SafeImage
              src={resolveMediaUrl(imageUrl)}
              alt={dishName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            // Fallback: elegant coloured disc
            <div
              className="w-full h-full bg-[radial-gradient(circle_at_35%_35%,_#FF8A72,_#FF5A3C)]"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
