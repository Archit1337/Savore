import React, { useContext, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Film, User, LogOut, LayoutDashboard, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { resolveMediaUrl } from '../utils/mediaResolver';

import InteractiveLogo from './InteractiveLogo';
import SafeImage from './SafeImage';
import SafeAvatar from './SafeAvatar';

function AnimatedNavLink({ to, children, className, style, icon }) {
  const [isHovered, setIsHovered] = useState(false);
  const text = typeof children === 'string' ? children : '';
  const characters = text.split('');

  const char1Variants = {
    initial: { y: 0 },
    hover: (i) => ({
      y: '100%',
      transition: {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.022,
      },
    }),
    exit: (i) => ({
      y: 0,
      transition: {
        duration: 0.46,
        ease: [0.22, 1, 0.36, 1],
        delay: (characters.length - 1 - i) * 0.015,
      },
    }),
  };

  const char2Variants = {
    initial: { y: '-100%' },
    hover: (i) => ({
      y: 0,
      transition: {
        duration: 0.46,
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.022 + 0.018,
      },
    }),
    exit: (i) => ({
      y: '-100%',
      transition: {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
        delay: (characters.length - 1 - i) * 0.015,
      },
    }),
  };

  return (
    <NavLink
      to={to}
      style={style}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="flex items-center gap-1.5 relative py-0.5">
        {icon && <span className="flex items-center shrink-0">{icon}</span>}
        <span className="relative block overflow-hidden">
          {/* Row 1: Original text */}
          <span className="flex whitespace-nowrap">
            {characters.map((char, index) => (
              <motion.span
                key={index}
                variants={char1Variants}
                custom={index}
                animate={isHovered ? 'hover' : 'exit'}
                initial="initial"
                className="inline-block"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </span>

          {/* Row 2: Hover duplicate text */}
          <span className="absolute top-0 left-0 flex whitespace-nowrap" aria-hidden="true">
            {characters.map((char, index) => (
              <motion.span
                key={index}
                variants={char2Variants}
                custom={index}
                animate={isHovered ? 'hover' : 'exit'}
                initial="initial"
                className="inline-block"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </span>
        </span>
        {/* Running underline */}
        <motion.span
          className="absolute -bottom-1 left-0 right-0 h-[1px] bg-primary pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{
            duration: isHovered ? 0.52 : 0.45,
            ease: [0.22, 1, 0.36, 1],
            delay: isHovered ? 0.09 : 0,
          }}
          style={{
            originX: isHovered ? 0 : 1,
          }}
        />
      </span>
    </NavLink>
  );
}

export default function Navbar() {
  const { theme, toggleTheme, isDark } = useContext(ThemeContext);
  const { user, logoutUser, isAuthenticated } = useContext(AuthContext);
  const { itemsCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  // On the reels page, the ReelsFeed renders a fixed inset-0 overlay that covers
  // the entire viewport. Sticky positioning collapses behind it, so we force fixed.
  const isReelsPage = location.pathname.startsWith('/reels');

  const [cartPulse, setCartPulse] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleCartPulse = () => {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    };
    window.addEventListener('cart-added', handleCartPulse);
    return () => window.removeEventListener('cart-added', handleCartPulse);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <header 
      className={`glass-panel glass-navbar-premium ${isScrolled ? 'shrunk' : ''} ${isReelsPage ? 'reels-navbar-fixed' : ''} flex items-center justify-between relative overflow-hidden`}
    >
      {/* Looping video background */}
      <video
        src="/ratatouille.mp4"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-all duration-300 [transform:translate3d(0,0,0)] [will-change:transform] ${
          isDark 
            ? 'opacity-[0.32] mix-blend-overlay' 
            : 'opacity-[0.48] mix-blend-multiply'
        }`}
        muted
        loop
        playsInline
        autoPlay
      />

      {/* Brand Logo */}
      <div style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : { position: 'relative', zIndex: 10 }}>
        <InteractiveLogo />
      </div>

      <nav className="flex gap-6 items-center" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : { position: 'relative', zIndex: 10 }}>
        <AnimatedNavLink 
          to="/" 
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
          className={({ isActive }) => 
            `nav-link-premium no-underline text-[15px] ${
              isActive ? 'active-highlight' : 'inactive'
            }`
          }
        >
          Home
        </AnimatedNavLink>
        <AnimatedNavLink 
          to="/discover" 
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
          className={({ isActive }) => 
            `nav-link-premium no-underline text-[15px] ${
              isActive ? 'active-highlight' : 'inactive'
            }`
          }
        >
          Discover
        </AnimatedNavLink>
        <AnimatedNavLink 
          to="/reels" 
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
          className={({ isActive }) => 
            `nav-link-premium no-underline text-[15px] ${
              isActive ? 'active-highlight' : 'inactive'
            }`
          }
          icon={<Film size={15} />}
        >
          Social Reels
        </AnimatedNavLink>
      </nav>

      {/* Action Utilities */}
      <div className="flex items-center gap-4" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : { position: 'relative', zIndex: 10 }}>
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="btn-icon"
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Shopping Cart Button */}
        <Link 
          to="/checkout"
          id="shopping-cart-nav-icon"
          className="btn-icon btn-circle"
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
          title="Shopping Cart"
        >
          <motion.div
            animate={cartPulse ? { scale: [1, 1.28, 0.95, 1], rotate: [0, -6, 6, 0] } : { scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex relative"
          >
            <ShoppingCart size={20} />
            {cartPulse && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 rounded-full border-2 border-primary pointer-events-none"
              />
            )}
          </motion.div>
          {itemsCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-[10px] font-extrabold w-[18px] h-[18px] flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
            >
              {itemsCount}
            </span>
          )}
        </Link>

        {/* User Session profile dropdown / buttons */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2.5" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}>
            {/* Dashboard shortcut based on roles */}
            {user.role !== 'customer' && (
              <Link 
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
                className="text-primary flex items-center gap-1.5 no-underline text-sm font-semibold"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            )}

            <Link 
              to="/profile" 
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="flex items-center gap-1.5 no-underline hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <SafeAvatar 
                src={resolveMediaUrl(user.profilePicture)} 
                alt={user.username}
                size={28}
                className="border border-primary"
              />
              <span className="text-sm font-semibold text-text-primary hover:text-primary transition-colors">
                {user.username}
              </span>
            </Link>

            <button 
              onClick={handleLogout}
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="bg-none border-none text-text-muted cursor-pointer flex items-center justify-center p-1.5 rounded-full"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}>
            <Link 
              to="/login" 
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="btn btn-secondary btn-pill"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="btn btn-primary btn-pill"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
