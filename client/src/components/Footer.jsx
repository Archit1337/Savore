import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building, Heart, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { soundController } from './ChefSystem/SoundController';

export default function Footer() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/reels')) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false); // Reset so it floats again on scroll revisit
        }
      },
      { threshold: 0.05 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, [location.pathname]);

  // Do not render footer on Reels page to prevent visual clash with full screen scroll
  if (location.pathname.startsWith('/reels')) {
    return null;
  }

  const isPartnerPage = location.pathname.startsWith('/partner');

  const handlePartnerClick = () => {
    soundController?.playClick();
    if (isPartnerPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please sign in to submit a partnership application.' } });
      return;
    }

    if (user.role === 'customer') {
      navigate('/partner');
    } else if (user.role === 'restaurant' || user.role === 'admin') {
      navigate('/dashboard');
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer 
      ref={footerRef}
      className={`w-full mt-auto relative z-20 border-t border-[var(--border-light)] bg-white/[0.01] dark:bg-black/[0.15] backdrop-blur-md select-none overflow-hidden footer-reveal-container ${isVisible ? 'footer-reveal-active' : ''}`}
    >
      {/* Scoped CSS for Option 2: Glassmorphic Floating Reveal (Slide & Fade) */}
      <style>{`
        .footer-reveal-container {
          opacity: 0;
          transform: translateY(12px) translate3d(0, 0, 0);
          transition: opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), transform 800ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          will-change: opacity, transform;
        }
        .footer-reveal-active {
          opacity: 1 !important;
          transform: translateY(0) translate3d(0, 0, 0) !important;
        }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 py-8 md:py-10 text-left max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Pitch */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 group max-w-fit">
              <span className="text-xl font-black tracking-tighter text-[var(--text-primary)] bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                SAVORÉ
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              Bridging haute culinary artistry with cutting-edge SaaS utility. Seamlessly discover premium regional menus, preview signature recipes via zero-buffer vertical Reels, and track delivery parameters.
            </p>
          </div>

          {/* Site Pathways */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest mb-1">Explore Pathways</h4>
            <Link to="/" className="text-sm text-[var(--text-secondary)] hover:text-primary hover:translate-x-0.5 transition-all max-w-fit font-medium">Home Feed</Link>
            <Link to="/discover" className="text-sm text-[var(--text-secondary)] hover:text-primary hover:translate-x-0.5 transition-all max-w-fit font-medium">Discover Menu</Link>
            <Link to="/reels" className="text-sm text-[var(--text-secondary)] hover:text-primary hover:translate-x-0.5 transition-all max-w-fit font-medium">Video Reels</Link>
          </div>

          {/* Partnership CTA card */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest mb-1">Merchant Portal</h4>
            <div className="glass-panel p-5 rounded-2xl border border-[var(--border-light)] hover:border-primary/30 transition-all group flex flex-col gap-3.5">
              <div>
                <h5 className="text-[13px] font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Building size={14} className="text-primary group-hover:scale-110 transition-transform" />
                  Become a Partner
                </h5>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  List your kitchens, stream vertical video reels, and access realtime analytics.
                </p>
              </div>
              
              {isPartnerPage ? (
                <button 
                  onClick={handlePartnerClick}
                  className="w-full py-2 px-4 bg-white/5 border border-white/10 text-text-muted cursor-pointer rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 select-none transition-all active:scale-[0.98]"
                >
                  Onboarding Form Active 📝
                </button>
              ) : (
                <button 
                  onClick={handlePartnerClick}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white border-none rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1 transition-all hover:shadow-[0_0_15px_rgba(255,106,77,0.25)] active:scale-[0.98]"
                >
                  {user?.role === 'restaurant' || user?.role === 'admin' ? 'Open Dashboard' : 'Apply to Partner'}
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Bottom copyright and metadata */}
        <div className="mt-8 pt-6 border-t border-[var(--border-light)]/45 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-secondary)] font-semibold">
          <div className="flex items-center gap-2">
            <span>© {currentYear} Savoré Inc. All culinary rights reserved.</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted">
            <span>Made with</span>
            <Heart size={10} className="text-red-500 fill-red-500 animate-stir" />
            <span>in India</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
