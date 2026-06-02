import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Volume2, VolumeX, Send, ArrowLeft, ArrowUp, ArrowDown, ShoppingBag, AlertTriangle, RefreshCw, Check, Sparkles, Search, X } from 'lucide-react';
import { ReelsContext } from '../context/ReelsContext';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';
import { ThemeContext } from '../context/ThemeContext';
import { LocationContext } from '../context/LocationContext';
import { soundController } from '../components/ChefSystem/SoundController';
import FlyToCartPortal from '../components/ChefSystem/FlyToCartPortal';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeAvatar from '../components/SafeAvatar';

export default function ReelsFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    reels, 
    feeds,
    currentFeedKey,
    setCurrentFeedKey,
    loading, 
    fetchReelsFeed, 
    preloadRegionFeed,
    toggleLikeReel, 
    commentOnReel, 
    logReelView, 
    logReelOrderClick 
  } = useContext(ReelsContext);
  const { addToCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const chefMood = useChefMood();
  const { theme } = useContext(ThemeContext);
  const { activeCity } = useContext(LocationContext);

  const isReelsDark = theme === 'dark';
  // Sidebar panels (left kitchen card, right comments board) — opaque enough to read comfortably
  const reelsGlassStyle = {
    backgroundColor: isReelsDark ? 'rgba(18, 18, 20, 0.72)' : 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: isReelsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)'
  };
  // In-video overlays (bottom description panel + action rail pill) — ultra-transparent so video is fully prioritized
  const reelsOverlayGlassStyle = {
    backgroundColor: 'rgba(12, 12, 14, 0.42)', // Consistent dark translucent glass for superb contrast
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [linkedDishes, setLinkedDishes] = useState({});
  const [showCenterHeart, setShowCenterHeart] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyPressed, setFlyPressed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const failedVideoIds = useRef(new Set());
  const videoRefs = useRef([]);
  const bgVideoRefs = useRef([]);
  const containerRef = useRef(null);
  const orderBtnRef = useRef(null);
  const lastActiveIndexChangeTime = useRef(Date.now());
  const hasAutoScrolled = useRef(false);

  // Load initial feed on mount
  useEffect(() => {
    fetchReelsFeed(true);
    if (chefMood && chefMood.setBubbleText) {
      chefMood.setBubbleText("Exploring all-India food reels! Infinite culinary journeys await, mon ami! 🌍✨");
    }
  }, []);

  // Stamp body class so navbar CSS can switch to position:fixed while on this page
  useEffect(() => {
    document.body.classList.add('reels-page');
    return () => {
      document.body.classList.remove('reels-page');
    };
  }, []);

  const activeReel = (reels && reels.length > 0) ? (reels[activeIndex] || reels[0]) : null;

  // Resolve activeDishObj dynamically from backend-populated properties, falling back to client-side cache
  const activeDishObj = activeReel?.featuredDish && typeof activeReel.featuredDish === 'object' && activeReel?.restaurantDetails
    ? { dish: activeReel.featuredDish, restaurant: activeReel.restaurantDetails }
    : linkedDishes[activeReel?._id] || null;

  // Auto-scroll to selected initial reel from location state
  useEffect(() => {
    const initialReelId = location.state?.initialReelId;
    if (initialReelId && reels.length > 0 && !hasAutoScrolled.current) {
      const targetIdx = reels.findIndex(r => r._id === initialReelId || r._id.startsWith(initialReelId));
      if (targetIdx !== -1) {
        hasAutoScrolled.current = true;
        setActiveIndex(targetIdx);
        // Clear location state after navigation so it doesn't snap back on state updates
        window.history.replaceState({}, document.title);
      }
    }
  }, [reels, location.state]);

  // 1. Fetch linked dishes for the active restaurant as a backup fallback if not populated by backend
  useEffect(() => {
    const fetchReelDish = async () => {
      if (activeReel && activeReel.restaurant && !activeReel.featuredDish && !linkedDishes[activeReel._id]) {
        try {
          const res = await api.get(`/restaurants/${activeReel.restaurant}`);
          if (res.data && res.data.success) {
            const menu = res.data.data.menu;
            const restaurant = res.data.data.restaurant;
            
            const matchingDish = menu[0];
            if (matchingDish) {
              setLinkedDishes((prev) => ({
                ...prev,
                [activeReel._id]: { dish: matchingDish, restaurant },
              }));
            }
          }
        } catch (err) {
          console.warn('Failed to resolve linked food dish for reel, trying client-side fallback:', err.message);
          if (activeReel.fallbackDish && activeReel.fallbackRestaurant) {
            setLinkedDishes((prev) => ({
              ...prev,
              [activeReel._id]: {
                dish: activeReel.fallbackDish,
                restaurant: activeReel.fallbackRestaurant
              }
            }));
          }
        }
      }
    };

    fetchReelDish();
  }, [activeIndex, reels]);

  // 2. Log reel view and update Chef Mood engine context - run only when active reel or dish resolves/changes
  useEffect(() => {
    if (activeReel) {
      logReelView(activeReel._id);
      if (chefMood && chefMood.updateLastViewedReel) {
        chefMood.updateLastViewedReel(activeReel, activeDishObj?.dish);
      }
    }
  }, [activeIndex, activeDishObj?.dish?._id, chefMood.updateLastViewedReel]);

  // Autoplay control for both foreground and background blurred video
  useEffect(() => {
    // Pause and clean up all other video players to ensure resource release
    videoRefs.current.forEach((vid, idx) => {
      if (idx !== activeIndex && vid) {
        try {
          vid.pause();
          vid.currentTime = 0;
        } catch (e) {
          console.warn('Error pausing inactive video:', e.message);
        }
      }
    });

    bgVideoRefs.current.forEach((vid, idx) => {
      if (idx !== activeIndex && vid) {
        try {
          vid.pause();
          vid.currentTime = 0;
        } catch (e) {
          console.warn('Error pausing inactive bg video:', e.message);
        }
      }
    });

    const playCurrentVideo = () => {
      const vid = videoRefs.current[activeIndex];
      if (vid) {
        vid.play().catch((err) => console.log('Video play interrupted:', err.message));
      }
      
      const bgVid = bgVideoRefs.current[activeIndex];
      if (bgVid) {
        bgVid.play().catch((err) => console.log('BG Video play interrupted:', err.message));
      }
    };

    // Play immediately when activeIndex or isMuted changes
    playCurrentVideo();

    // Cleanup hook on unmount
    return () => {
      videoRefs.current.forEach((vid) => {
        if (vid) {
          try { vid.pause(); } catch(e) {}
        }
      });
      bgVideoRefs.current.forEach((vid) => {
        if (vid) {
          try { vid.pause(); } catch(e) {}
        }
      });
    };
  }, [activeIndex, reels, isMuted]);

  const handleNextReel = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
      // Preload next batch much earlier (when 4 or fewer items are left in the queue)
      if (reels.length - activeIndex <= 4) {
        fetchReelsFeed(false, activeCity);
      }
    }
  };

  const handlePrevReel = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleLikeClick = async (e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const currentlyLiked = activeReel?.likes?.includes(user?._id);
    await toggleLikeReel(activeReel._id, user?._id);
    if (!currentlyLiked) {
      chefMood.celebrate('reel_liked');
      showToast("Liked ❤️");
    }
  };

  // Single Tap Triggering Play/Pause Cinematic Toggles
  const handleVideoTap = (e) => {
    if (e) e.stopPropagation();

    // Tap guard: Ignore taps immediately after swiping/changing reels to prevent accidental play/pause toggle toasts
    if (Date.now() - lastActiveIndexChangeTime.current < 450) {
      console.log("Tap guard active. Ignoring tap right after swiping.");
      return;
    }

    const mainVid = videoRefs.current[activeIndex];
    const bgVid = bgVideoRefs.current[activeIndex];

    if (mainVid) {
      if (isPlaying) {
        mainVid.pause();
        if (bgVid) bgVid.pause();
        setIsPlaying(false);
        showToast("Paused ⏸️");
      } else {
        mainVid.play().catch(() => {});
        if (bgVid) bgVid.play().catch(() => {});
        setIsPlaying(true);
        showToast("Playing ▶️");
      }
    }
  };

  // Double Click / Double Tap Triggering Premium Center Pulse
  const handleVideoDoubleClick = (e) => {
    e.stopPropagation();
    
    // Trigger like if not already liked
    const isLiked = activeReel?.likes?.includes(user?._id);
    if (!isLiked) {
      handleLikeClick();
    }

    setShowCenterHeart(true);
    // Remove center heart overlay after animation completes
    setTimeout(() => {
      setShowCenterHeart(false);
    }, 800);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (commentText.trim()) {
      await commentOnReel(activeReel._id, commentText.trim());
      setCommentText('');
    }
  };

  // Reset fly state when active reel changes
  useEffect(() => {
    setIsFlying(false);
    setFlyPressed(false);
    setIsPlaying(true); // Newly swiped reel starts playing automatically
    lastActiveIndexChangeTime.current = Date.now();
    // Reset per-reel buffering/error state on navigation
    setIsBuffering(false);
    // Check if the newly active reel's video has already been confirmed to fail
    if (activeReel && failedVideoIds.current.has(activeReel._id)) {
      setHasVideoError(true);
    } else {
      setHasVideoError(false);
    }
  }, [activeIndex]);

  const handleOrderNow = async (e) => {
    e.stopPropagation();
    if (!activeReel || flyPressed) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isOutOfRegion = activeReel?.city && activeCity && activeReel.city.toLowerCase() !== activeCity.toLowerCase();
    if (isOutOfRegion) {
      showToast(`This restaurant is outside your active delivery zone (${activeCity})`);
      return;
    }

    logReelOrderClick(activeReel._id);

    const match = activeDishObj;
    if (!match) {
      // Fallback — no dish resolved yet, navigate to restaurant
      navigate(`/restaurant/${activeReel.restaurant}`);
      return;
    }

    setFlyPressed(true);

    try {
      addToCart(match.dish, match.restaurant, 1);
      window.dispatchEvent(new CustomEvent('cart-added'));
      soundController.playWhoosh();
      setIsFlying(true);
    } catch (err) {
      // Cross-restaurant block
      showToast(`⚠️ ${err.message}`);
      setFlyPressed(false);
    }
  };

  const handleFlyComplete = () => {
    setIsFlying(false);
    soundController.playPlate();
    const dishName = activeDishObj?.dish?.name || 'Dish';
    showToast(`${dishName} added to cart ✓`);
    chefMood.celebrate('item_added');
    // Re-enable button after a short delay
    setTimeout(() => setFlyPressed(false), 1200);
  };

  // Handle vertical swipe gestures
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 60;
    if (info.offset.y < -swipeThreshold) {
      handleNextReel();
    } else if (info.offset.y > swipeThreshold) {
      handlePrevReel();
    }
  };

  if (loading && reels.length === 0) {
    return (
      <div className="container flex-center min-h-[80vh] flex-col gap-4">
        <div className="w-10 h-10 border-[3.5px] border-solid border-primary border-t-transparent rounded-full animate-[skeleton-loading_1.2s_infinite_linear]" />
        <p className="text-text-secondary font-semibold">Buffering premium reels feed...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="container flex-center min-h-[80vh] flex-col gap-4">
        <p className="text-text-secondary">No video reels uploaded yet.</p>
      </div>
    );
  }

  const isLiked = activeReel?.likes?.includes(user?._id);

  return (
    <>
      {/* Fly-to-cart portal — renders at document.body level */}
      <FlyToCartPortal
        isFlying={isFlying}
        imageUrl={activeDishObj?.dish?.image}
        dishName={activeDishObj?.dish?.name}
        sourceRef={orderBtnRef}
        onComplete={handleFlyComplete}
      />



      <div
        className="flex justify-center items-center fade-in reels-player-container fixed inset-0 h-screen w-screen overflow-hidden z-[1] pt-[96px] md:pt-[112px] pb-[max(20px,env(safe-area-inset-bottom,20px))] px-6 pointer-events-none"
      >
        {/* 🎬 REAL-TIME EDGE BLUR AMBIENT VIDEO LAYER BACKGROUND */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] z-0 pointer-events-none transition-all duration-500 overflow-hidden"
          style={{
            filter: 'blur(55px) brightness(0.68)',
            opacity: isReelsDark ? 0.42 : 0.32,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.video 
              key={activeIndex}
              ref={(el) => {
                bgVideoRefs.current[activeIndex] = el;
                if (el) {
                   el.play().catch((err) => {
                    console.warn('BG Video playback on mount failed:', err.message);
                  });
                }
              }}
              src={resolveMediaUrl(activeReel.videoUrl)}
              loop
              muted
              playsInline
              preload="metadata"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="reel-video-element w-full h-full object-cover pointer-events-none"
            />
          </AnimatePresence>
        </div>

        {/* 🎬 CINEMATIC THREE-COLUMN GRID CONTAINER (Desktop only sideboards, center on all viewports) */}
        <div className="flex justify-center items-center gap-8 w-full max-w-[1320px] h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] max-h-[860px] min-h-[540px] relative z-[2] pointer-events-none">

          {/* 🍽️ LEFT COLUMN: ACTIVE KITCHEN PROFILE & CULINARY HIGHLIGHTS (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-5 w-[310px] h-full justify-center shrink-0 pointer-events-auto">
            {/* Restaurant profile glass card */}
            <motion.div 
              style={reelsGlassStyle}
              whileHover={{ y: -4, scale: 1.015, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-6 rounded-[28px] text-left text-text-primary relative overflow-hidden flex flex-col justify-between"
            >
              <div className="noise-overlay" />
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Active Kitchen
                </h4>
                
                {activeReel.restaurantDetails?.coverImage && (
                  <div className="w-full h-[130px] rounded-[20px] overflow-hidden mb-4 border border-[var(--border-light)] shadow-md group relative">
                    <img 
                      src={resolveMediaUrl(activeReel.restaurantDetails.coverImage)} 
                      alt={activeReel.restaurantDetails.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>
                )}
                
                <h3 
                  onClick={() => navigate(`/restaurant/${activeReel.restaurant}`)}
                  className="text-[18px] font-bold cursor-pointer hover:text-primary transition-colors mb-1.5 flex items-center gap-1.5 text-text-primary tracking-tight"
                >
                  @{activeReel.restaurantDetails?.name || 'Chef Gastronomy'}
                </h3>
                <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3 mb-5">
                  {activeReel.restaurantDetails?.description || 'Experience handcrafted recipe Reels and track every culinary detail instantly.'}
                </p>
              </div>
              <button 
                onClick={() => navigate(`/restaurant/${activeReel.restaurant}`)}
                className="w-full py-3 px-4 rounded-xl text-[12px] font-bold border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white hover:border-transparent text-primary transition-all duration-300 cursor-pointer shadow-sm active:scale-98"
              >
                Visit Full Menu →
              </button>
            </motion.div>

            {/* Featured Recipe info card */}
            {activeDishObj && (
              <motion.div 
                style={reelsGlassStyle}
                whileHover={{ y: -4, scale: 1.015, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="p-5 rounded-[28px] text-left text-text-primary relative overflow-hidden"
              >
                <div className="noise-overlay" />
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#FF8A72] font-bold mb-3.5 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[#FF8A72]" />
                  Featured Recipe
                </h4>
                <div className="flex items-center gap-4">
                  {activeDishObj.dish.image && (
                    <div className="w-14 h-14 rounded-[16px] overflow-hidden border border-[var(--border-light)] shrink-0 shadow-sm">
                      <img 
                        src={resolveMediaUrl(activeDishObj.dish.image)} 
                        alt={activeDishObj.dish.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[14.5px] font-bold truncate mb-1 text-text-primary tracking-tight">{activeDishObj.dish.name}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-primary">{formatPrice(activeDishObj.dish.price)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Best Seller</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 🎥 CENTER COLUMN: IMMERSIVE REELS PLAYER VIEWPORT (All Viewports) */}
          <div 
            ref={containerRef}
            className="w-full max-w-[400px] md:max-w-[380px] lg:max-w-[400px] xl:max-w-[420px] h-full rounded-[32px] overflow-hidden relative bg-[#040406] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] shrink-0 z-[1] pointer-events-auto"
          >
            <div className="noise-overlay" />

            {/* Under-video Shimmer Loader */}
            <div 
              className="skeleton-box absolute inset-0 opacity-18 z-0 pointer-events-none" 
            />

            {/* ← Back button — above drag layer, navigate(-1) returns to previous page */}
            <button
              onClick={() => navigate(-1)}
              style={reelsOverlayGlassStyle}
              className="absolute top-5 left-5 w-10 h-10 rounded-full z-[20] flex items-center justify-center text-white border border-white/10 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Go Back"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>

            {/* 🔇 Mute Toggle — above drag layer */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={reelsOverlayGlassStyle}
              className="absolute top-5 right-5 w-10 h-10 rounded-full z-[20] flex items-center justify-center text-white border border-white/10 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>



            {/* Swipe gesture and Double click gesture layer */}
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={handleDragEnd}
              onDoubleClick={handleVideoDoubleClick}
              onTap={handleVideoTap}
              className="w-full h-full relative cursor-grab"
            >
              {/* Main Video Element with Seamless Cinematic Crossfade */}
              <AnimatePresence mode="popLayout">
                <motion.video
                  key={activeReel._id}
                  ref={(el) => {
                    videoRefs.current[activeIndex] = el;
                    if (el) {
                      el.play().catch((err) => {
                        console.warn('Foreground Video playback on mount failed:', err.message);
                      });
                    }
                  }}
                  src={resolveMediaUrl(activeReel.videoUrl)}
                  loop
                  muted={isMuted}
                  playsInline
                  autoPlay
                  preload="metadata"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hasVideoError ? 0 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="reel-video-element absolute inset-0 w-full h-full object-cover pointer-events-none"
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => {
                    setIsBuffering(false);
                    setHasVideoError(false);
                    // Successfully playing — remove from failed set if it was there
                    if (activeReel) failedVideoIds.current.delete(activeReel._id);
                  }}
                  onCanPlay={() => setIsBuffering(false)}
                  onError={() => {
                    setIsBuffering(false);
                    setHasVideoError(true);
                    // Record this reel as a known video failure
                    if (activeReel) failedVideoIds.current.add(activeReel._id);
                  }}
                />
              </AnimatePresence>



              {/* ⏳ Next/Prev Multi-Video Preload Queue (Concurrent Caching for Lag-free Swiping) */}
              <div className="absolute w-[1px] h-[1px] opacity-[0.001] pointer-events-none hidden">
                {/* Immediate previous video */}
                {activeIndex > 0 && reels[activeIndex - 1] && (
                  <video
                    key={`preload-prev-${reels[activeIndex - 1]._id}`}
                    src={resolveMediaUrl(reels[activeIndex - 1].videoUrl)}
                    preload="auto"
                    muted
                    playsInline
                  />
                )}
                {/* Next video (N+1) */}
                {activeIndex < reels.length - 1 && reels[activeIndex + 1] && (
                  <video
                    key={`preload-next1-${reels[activeIndex + 1]._id}`}
                    src={resolveMediaUrl(reels[activeIndex + 1].videoUrl)}
                    preload="auto"
                    muted
                    playsInline
                  />
                )}
                {/* Second next video (N+2) */}
                {activeIndex < reels.length - 2 && reels[activeIndex + 2] && (
                  <video
                    key={`preload-next2-${reels[activeIndex + 2]._id}`}
                    src={resolveMediaUrl(reels[activeIndex + 2].videoUrl)}
                    preload="auto"
                    muted
                    playsInline
                  />
                )}
              </div>

              {/* 🌀 Premium Glass Buffering Overlay */}
              {isBuffering && !hasVideoError && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-[#040406]/45 z-10 pointer-events-none backdrop-blur-[6px]"
                >
                  <div className="flex flex-col items-center gap-3.5">
                    <div 
                      className="w-11 h-11 border-[3px] border-solid border-primary/15 border-t-primary rounded-full animate-[skeleton-loading_1.1s_infinite_linear]"
                    />
                    <span className="text-[11px] text-primary font-bold uppercase tracking-[0.18em]">
                      Buffering Selection
                    </span>
                  </div>
                </div>
              )}

              {/* 🚨 Cinematic Image Poster Fallback — shown when video fails to load */}
              {hasVideoError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-[5] overflow-hidden"
                >
                  {/* Full blurred restaurant cover as atmospheric background */}
                  {activeReel.restaurantDetails?.coverImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-[22px] brightness-[0.55] scale-[1.08] pointer-events-none"
                      style={{
                        backgroundImage: `url(${resolveMediaUrl(activeReel.restaurantDetails.coverImage)})`,
                      }}
                    />
                  )}
                  {/* Full-cover crisp restaurant image as the poster */}
                  {activeReel.restaurantDetails?.coverImage && (
                    <img
                      src={resolveMediaUrl(activeReel.restaurantDetails.coverImage)}
                      alt={activeReel.restaurantDetails?.name || 'Culinary'}
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.82]"
                    />
                  )}
                  {/* Gradient vignette for text legibility */}
                  <div
                    className="absolute inset-0 pointer-events-none z-[2] bg-gradient-to-t from-white/72 via-white/12 to-white/2 dark:from-[#0B0F14]/90 dark:via-[#0B0F14]/40 dark:to-transparent"
                  />

                  {/* 🚨 Center Matte Glass Error Card */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 z-[6]"
                  >
                    <div 
                      className="glass-floating py-[30px] px-6 rounded-[24px] max-w-[320px] text-center flex flex-col items-center gap-4 bg-white/75 dark:bg-[#141419]/72 border border-black/8 dark:border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[16px]"
                    >
                      <div 
                        className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary"
                      >
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-text-primary mb-2">
                          Culinary Stream Offline
                        </h4>
                        <p className="text-[12.5px] text-text-secondary leading-normal">
                          High-fidelity culinary stream temporarily unavailable. Please check your connection or retry buffering the chef's culinary feed.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsBuffering(true);
                          setHasVideoError(false);
                          const mainVid = videoRefs.current[activeIndex];
                          if (mainVid) {
                            try {
                              mainVid.load();
                              mainVid.play().catch(err => {
                                console.warn("Retry playback failed:", err.message);
                                setIsBuffering(false);
                                setHasVideoError(true);
                              });
                            } catch(e) {
                              setIsBuffering(false);
                              setHasVideoError(true);
                            }
                          }
                          const bgVid = bgVideoRefs.current[activeIndex];
                          if (bgVid) {
                            try {
                              bgVid.load();
                              bgVid.play().catch(() => {});
                            } catch(e) {}
                          }
                        }}
                        className="btn btn-primary py-2.5 px-[18px] rounded-xl text-[12.5px] flex items-center gap-2 cursor-pointer border-none font-semibold"
                      >
                        <RefreshCw size={14} className={isBuffering ? "spin-animation" : ""} />
                        <span>Retry Streaming</span>
                      </button>
                    </div>
                  </div>

                  {/* Silent retry — reloads video in background so it can take over if it loads */}
                  <video
                    key={`retry-${activeReel._id}`}
                    src={resolveMediaUrl(activeReel.videoUrl)}
                    muted
                    playsInline
                    preload="auto"
                    className="hidden"
                    onCanPlay={(e) => {
                      // Video loaded on retry — clear error state and let it play
                      failedVideoIds.current.delete(activeReel._id);
                      setHasVideoError(false);
                      const mainVid = videoRefs.current[activeIndex];
                      if (mainVid) mainVid.play().catch(() => {});
                    }}
                  />
                </motion.div>
              )}

              {/* Double Tap Center Spring Pulse */}
              <AnimatePresence>
                {showCenterHeart && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
                    animate={{ 
                      opacity: [0, 0.9, 0.9, 0], 
                      scale: [0.5, 1.2, 1, 0.8],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary pointer-events-none z-[12]"
                  >
                    <Heart size={80} fill="var(--primary)" className="filter drop-shadow-[0_4px_20px_rgba(255,106,77,0.45)]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top gradient vignette for back and mute buttons */}
              <div 
                className="absolute top-0 left-0 right-0 h-[18%] pointer-events-none z-[2] bg-[linear-gradient(to_bottom,_rgba(0,0,0,0.45)_0%,_transparent_100%)]"
              />

              {/* Gradient readability Vignette */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[42%] pointer-events-none z-[2] bg-[linear-gradient(to_top,_rgba(0,0,0,0.85)_0%,_rgba(0,0,0,0.45)_40%,_transparent_100%)]"
              />

              {/* Bottom Integrated Cinematic Glass Panel */}
              <div 
                style={reelsOverlayGlassStyle}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-4 left-3.5 right-11 p-3 rounded-[20px] z-[3] text-left transition-all duration-300 text-text-primary animate-fade-in"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <SafeAvatar 
                    src={resolveMediaUrl(activeReel.restaurantDetails?.coverImage)} 
                    alt={activeReel.restaurantDetails?.name}
                    size={26}
                    className="border border-[var(--border-light)] shadow-sm shrink-0"
                  />
                  <h3 
                    onClick={() => navigate(`/restaurant/${activeReel.restaurant}`)}
                    className="text-[13.5px] font-semibold cursor-pointer inline-flex items-center gap-1.5 text-white hover:text-primary transition-colors"
                  >
                    @{activeReel.restaurantDetails?.name || 'Chef Gastronomy'}
                    <span className="text-[7px] bg-primary text-white py-0.5 px-1 rounded-[5px] font-extrabold tracking-wider shrink-0 uppercase animate-pulse">VERIFIED</span>
                  </h3>
                </div>
                
                <p 
                  className="text-[11.5px] leading-normal mb-2.5 text-white/80 line-clamp-2 hover:line-clamp-none transition-all duration-300 cursor-help"
                >
                  {activeReel.caption}
                </p>

                {/* Cinematic Add-to-Cart Order Now Button */}
                {activeDishObj && (() => {
                  const isOutOfRegion = activeReel?.city && activeCity && activeReel.city.toLowerCase() !== activeCity.toLowerCase();
                  return (
                    <motion.button
                      ref={orderBtnRef}
                      id="reel-order-now-btn"
                      whileTap={isOutOfRegion ? {} : { scale: 0.97 }}
                      onClick={isOutOfRegion ? null : handleOrderNow}
                      disabled={flyPressed || isOutOfRegion}
                      className={`w-full flex items-center justify-center gap-1.5 text-[11.5px] font-bold py-2 px-3 rounded-[12px] transition-all duration-300 min-h-[36px] border-none ${
                        isOutOfRegion
                          ? 'bg-white/10 text-white/50 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-hover active:bg-primary-pressed text-white shadow-[0_3px_10px_rgba(255,90,60,0.25)] cursor-pointer'
                      }`}
                    >
                      <ShoppingBag size={13} className="shrink-0" />
                      <span className="truncate">
                        {isOutOfRegion
                          ? `Unavailable in ${activeCity}`
                          : flyPressed
                          ? 'Adding…'
                          : `Order ${activeDishObj.dish.name} · ${formatPrice(activeDishObj.dish.price)}`}
                      </span>
                    </motion.button>
                  );
                })()}
              </div>

              {/* Right Floating Actions (Translucent Frosted Glass Sidebar Pill - Lifted to top-[38%] to avoid layout collisions) */}
              <div 
                style={reelsOverlayGlassStyle}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-[38%] -translate-y-1/2 right-3 flex flex-col items-center gap-3 py-2.5 px-1.5 rounded-[20px] z-[4]"
              >
                {/* Like Heart Button */}
                <div className="text-center flex flex-col items-center">
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleLikeClick}
                    className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 cursor-pointer ${
                      isLiked 
                        ? 'bg-primary text-white shadow-[0_0_12px_rgba(255,90,60,0.45)] border-transparent' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                    title={isLiked ? "Unlike recipe" : "Like recipe"}
                  >
                    <motion.div 
                      animate={{ scale: isLiked ? [1, 1.25, 1] : 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="flex"
                    >
                      <Heart size={16} fill={isLiked ? "white" : "none"} />
                    </motion.div>
                  </motion.button>
                  <span className="text-[9.5px] font-semibold mt-1 text-white/80">
                    {activeReel.likes?.length || 0}
                  </span>
                </div>
     
                {/* Slide Comment Drawer Trigger */}
                <div className="text-center flex flex-col items-center">
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all duration-300 border border-white/10 cursor-pointer"
                    title="View comments"
                  >
                    <MessageSquare size={16} />
                  </motion.button>
                  <span className="text-[9.5px] font-semibold mt-1 text-white/80">
                    {activeReel.comments?.length || 0}
                  </span>
                </div>

                {/* Scroll/Swipe indicators */}
                <div 
                  className="flex flex-col gap-1.5 pt-2 border-t border-white/10"
                >
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => { e.stopPropagation(); handlePrevReel(); }} 
                    disabled={activeIndex === 0}
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-300 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white border border-white/10 cursor-pointer"
                    title="Previous Reel"
                  >
                    <ArrowUp size={12} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => { e.stopPropagation(); handleNextReel(); }} 
                    disabled={activeIndex === reels.length - 1}
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-300 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white border border-white/10 cursor-pointer"
                    title="Next Reel"
                  >
                    <ArrowDown size={12} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 💬 RIGHT COLUMN: INLINE COMMENT BOARD (Desktop Only) */}
          <div className="hidden lg:flex flex-col w-[310px] h-full justify-center shrink-0 pointer-events-auto">
            <div 
              style={reelsGlassStyle}
              className="p-5 rounded-[28px] text-left text-text-primary shadow-2xl h-full flex flex-col relative overflow-hidden"
            >
              <div className="noise-overlay" />
              <h4 className="text-[13px] font-normal text-text-primary mb-3 pb-2.5 border-b border-[var(--border-light)]">
                Comments ({activeReel.comments?.length || 0})
              </h4>
              
              {/* Inline Comments List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1 mb-4 custom-scrollbar">
                {activeReel.comments && activeReel.comments.length > 0 ? (
                  activeReel.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2.5 text-[12px] items-start">
                      <SafeAvatar 
                        src={resolveMediaUrl(comment.user?.profilePicture)} 
                        alt={comment.user?.username || 'Diner'} 
                        size={26}
                        className="border border-[var(--border-light)] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary truncate mb-0.5">
                          @{comment.user?.username || 'Diner'}
                        </div>
                        <p className="text-text-secondary leading-relaxed break-words">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-text-muted text-[12.5px]">
                    Be the first to comment on this recipe!
                  </div>
                )}
              </div>

              {/* Inline comment submission form */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-3 border-t border-[var(--border-light)] relative z-10">
                <input 
                  type="text" 
                  className="w-full bg-surface-bright focus:bg-surface border border-[var(--border-light)] rounded-xl px-3 h-10 text-[12.5px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors" 
                  placeholder={isAuthenticated ? "Add comment..." : "Login to comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isAuthenticated}
                />
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl w-10 h-10 flex items-center justify-center shrink-0 border-none cursor-pointer transition-colors"
                  disabled={!isAuthenticated || !commentText.trim()}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* FLOATING GLASS SLIDE-UP COMMENTS PANEL (Drag-to-Dismiss enabled!) */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 110) {
                  setShowComments(false);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 h-[62%] rounded-t-[28px] z-[15] p-6 text-left flex flex-col backdrop-blur-[25px] bg-white/90 border-t-[1.5px] border-t-black/6 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] dark:bg-[#0c0c12]/86 dark:border-t-white/15 dark:shadow-[0_-15px_40px_rgba(0,0,0,0.6)] pointer-events-auto"
            >
              <div className="noise-overlay" />

              {/* Drag Handle Bar */}
              <div className="w-10 h-1.5 bg-text-muted rounded-full mx-auto mb-4 opacity-70" />

              {/* Header */}
              <div className="flex justify-between items-center mb-4 border-b border-solid border-[var(--border-light)] pb-3 relative z-10">
                <h4 className="text-lg font-normal text-text-primary">
                  Comments ({activeReel.comments?.length || 0})
                </h4>
                <button 
                  onClick={() => setShowComments(false)}
                  className="bg-none border-none text-text-muted text-[13px] font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Comments Scroller */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pb-3 relative z-10">
                {activeReel.comments && activeReel.comments.length > 0 ? (
                  activeReel.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2.5 text-[13px]">
                      <SafeAvatar 
                        src={resolveMediaUrl(comment.user?.profilePicture)} 
                        alt={comment.user?.username || 'Diner'} 
                        size={28}
                        className="border border-solid border-[var(--border-light)]"
                      />
                      <div className="flex-1">
                        <div className="font-normal text-text-primary mb-0.5">
                          @{comment.user?.username || 'Diner'}
                        </div>
                        <p className="text-text-secondary leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-7.5 text-text-muted text-[13px]">
                    Be the first to comment on this recipe!
                  </div>
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 border-t border-solid border-[var(--border-light)] pt-3 relative z-10">
                <input 
                  type="text" 
                  className="glass-input rounded-[14px] text-[13.5px] h-11" 
                  placeholder={isAuthenticated ? "Write a comment..." : "Login to write comment..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isAuthenticated}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-[14px] px-[18px] h-11"
                  disabled={!isAuthenticated || !commentText.trim()}
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
