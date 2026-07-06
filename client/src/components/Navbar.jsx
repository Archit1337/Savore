import React, { useContext, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, Film, User, LogOut, LayoutDashboard, Globe, ChevronDown, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleOutsideClick = (e) => {
      const container = document.getElementById('profile-menu-container');
      if (container && !container.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [profileDropdownOpen]);

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
      className={`glass-panel glass-navbar-premium ${isScrolled ? 'shrunk' : ''} ${isReelsPage ? 'reels-navbar-fixed' : ''} flex items-center justify-between relative`}
    >
      <style>{`
        .profile-capsule-trigger {
          width: 38px;
          height: 38px;
          padding: 4px;
          transition: width 0.28s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s, border-color 0.2s !important;
        }
        .profile-capsule-trigger.expanded {
          width: 145px;
          padding-right: 12px;
        }
        .profile-text-wrapper {
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .profile-capsule-trigger.expanded .profile-text-wrapper {
          opacity: 1;
          visibility: visible;
          transition-delay: 0.08s;
        }
      `}</style>
      {/* Looping video background */}
      {!isReelsPage && (
        <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
          <video
            src="/ratatouille.mp4"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 [transform:translate3d(0,0,0)] [will-change:transform] ${
              isDark 
                ? 'opacity-[0.32] mix-blend-overlay' 
                : 'opacity-[0.48] mix-blend-multiply'
            }`}
            muted
            loop
            playsInline
            autoPlay
          />
        </div>
      )}

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
        <motion.div
          variants={{
            hover: { y: -2, scale: 1.05 },
            tap: { scale: 0.92, y: 1 }
          }}
          whileHover="hover"
          whileTap="tap"
          transition={{ type: "spring", stiffness: 600, damping: 14 }}
          className="btn-icon btn-circle p-0"
          style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
        >
          <Link 
            to="/checkout"
            id="shopping-cart-nav-icon"
            className="w-full h-full flex items-center justify-center text-[var(--text-primary)] relative"
            title="Shopping Cart"
          >
            <motion.div
              animate={cartPulse ? { scale: [1, 1.28, 0.95, 1], rotate: [0, -6, 6, 0] } : { scale: 1, rotate: 0 }}
              variants={{
                hover: { rotate: [0, -16, 12, -8, 4, 0], transition: { duration: 0.5, ease: "easeInOut" } },
                tap: { scaleY: 0.8, scaleX: 1.15, transition: { type: "spring", stiffness: 600, damping: 12 } }
              }}
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
        </motion.div>

        {/* User Session profile dropdown / buttons */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2.5" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}>


            <div 
              id="profile-menu-container" 
              className="relative"
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
            >
              {/* Collapsible Trigger Capsule */}
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                onMouseEnter={() => setIsProfileHovered(true)}
                onMouseLeave={() => setIsProfileHovered(false)}
                className={`profile-capsule-trigger flex items-center bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/10 shadow-sm rounded-full cursor-pointer select-none active:scale-[0.98] overflow-hidden relative shrink-0 ${
                  isProfileHovered || profileDropdownOpen ? 'expanded' : ''
                }`}
              >
                <SafeAvatar 
                  src={resolveMediaUrl(user.profilePicture)} 
                  alt={user.username}
                  size={28}
                  className="border border-primary rounded-full object-cover shrink-0 w-7 h-7"
                />
                
                {/* Expandable Content wrapper */}
                <div className="profile-text-wrapper">
                  <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[70px]">
                    {user.username}
                  </span>
                  <motion.span
                    animate={{ rotate: profileDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="text-text-muted flex items-center shrink-0"
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </div>
              </div>


              {/* Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-3.5 w-64 rounded-[20px] border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#12161c]/95 backdrop-blur-md p-4 shadow-2xl z-50 text-left"
                    style={{ transformOrigin: 'top right' }}
                  >
                    {/* User Card Header */}
                    <div className="flex gap-3 items-center mb-3.5 pb-3 border-b border-black/10 dark:border-white/10">
                      <SafeAvatar 
                        src={resolveMediaUrl(user.profilePicture)} 
                        alt={user.username}
                        size={40}
                        className="border border-primary rounded-full object-cover shrink-0 w-10 h-10"
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-[14px] font-bold text-text-primary truncate leading-tight">
                          {user.username}
                        </h4>
                        <p className="text-[11.5px] text-text-muted truncate leading-relaxed">
                          {user.email}
                        </p>
                        {/* Custom Role Badge */}
                        <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mt-2 leading-none border ${
                          user.role === 'admin' ? 'bg-red-500/15 text-red-500 border-red-500/25' :
                          user.role === 'restaurant' ? 'bg-orange-500/15 text-primary border-primary/25' :
                          'bg-green-500/15 text-green-400 border-green-500/25'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'restaurant' ? 'Merchant' : 'Foodie'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="flex flex-col gap-1 text-[13px] font-semibold text-text-secondary">
                      <Link 
                        to="/profile" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary transition-all duration-200 no-underline text-inherit"
                      >
                        <User size={15} className="text-text-muted" />
                        <span>Profile Settings</span>
                      </Link>

                      {user.role !== 'customer' && (
                        <Link 
                          to={user.role === 'admin' ? '/admin' : '/dashboard'}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 no-underline text-inherit"
                        >
                          <LayoutDashboard size={15} className="text-primary" />
                          <span>{user.role === 'admin' ? 'Admin Panel' : 'Merchant Portal'}</span>
                        </Link>
                      )}

                    </div>

                    {/* Separator */}
                    <div className="my-2 border-b border-black/10 dark:border-white/10" />

                    {/* Logout Action */}
                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-all duration-200 bg-transparent border-none text-[13px] font-semibold cursor-pointer text-left"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex gap-2" style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}>
            <Link 
              to="/login" 
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="btn btn-secondary btn-pill relative overflow-hidden group border-[1.5px] border-[var(--border-light)] hover:border-[var(--text-primary)] transition-colors duration-300 select-none cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full bg-[var(--text-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
              <span className="relative z-10 group-hover:text-background-primary transition-colors duration-300">
                Login
              </span>
            </Link>
            <Link 
              to="/register" 
              style={isReelsPage ? { pointerEvents: 'auto', zIndex: 100002, position: 'relative' } : {}}
              className="btn btn-primary btn-pill relative overflow-hidden group border border-transparent select-none cursor-pointer bg-primary text-white"
            >
              <span className="absolute inset-0 w-full h-full bg-[var(--text-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
              <span className="relative z-10 group-hover:text-background-primary transition-colors duration-300">
                Sign Up
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
