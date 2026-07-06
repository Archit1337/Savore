import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Volume2, VolumeX, Send, ArrowLeft, ArrowUp, ArrowDown, ShoppingBag, AlertTriangle, RefreshCw, Check, Sparkles, Search, X, ChevronDown, ShieldAlert, EyeOff, UserX, Copyright, HelpCircle, Utensils, Trash2 } from 'lucide-react';
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
    deleteCommentFromReel,
    logReelView, 
    logReelOrderClick,
    reportReel
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
  }, []);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportedReelsList, setReportedReelsList] = useState(() => {
    try {
      const saved = localStorage.getItem('savore_reported_reels');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [revealedReels, setRevealedReels] = useState(new Set());


  
  const failedVideoIds = useRef(new Set());
  const videoRefs = useRef([]);
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

  // Calculate if the active video has already been flagged (by current customer user session)
  const isReelReported = activeReel && (
    reportedReelsList.includes(activeReel._id) ||
    (isAuthenticated && (
      (user?._id && activeReel.reports?.some(r => r && r.user && r.user.toString() === user._id.toString()))
    ))
  );

  const handleReportSubmit = async () => {
    if (!activeReel) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Safety check: Prevent owners from reporting their own restaurant's reels
    if (user && activeReel.restaurantDetails && activeReel.restaurantDetails.owner === user._id) {
      showToast("Access Denied: You cannot report video reels posted by your own restaurant.");
      setShowReportModal(false);
      setIsReasonDropdownOpen(false);
      return;
    }

    setIsSubmittingReport(true);
    try {
      await reportReel(activeReel._id, reportReason, reportDescription);
      
      // Update local storage and state to prevent spamming
      const updatedList = [...reportedReelsList, activeReel._id];
      setReportedReelsList(updatedList);
      localStorage.setItem('savore_reported_reels', JSON.stringify(updatedList));
      
      showToast("Report submitted. Thank you!");
      if (chefMood && chefMood.celebrate) {
        chefMood.celebrate('reel_flagged');
      }

      // Reset fields
      setReportReason('Spam');
      setReportDescription('');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
      setShowReportModal(false);
      setIsReasonDropdownOpen(false);
    }
  };

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

  // Autoplay control for the foreground video
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

    const playCurrentVideo = () => {
      const vid = videoRefs.current[activeIndex];
      if (vid) {
        if (isReelReported) {
          try { vid.pause(); } catch (e) {}
        } else {
          vid.play().catch((err) => console.log('Video play interrupted:', err.message));
        }
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
    };
  }, [activeIndex, reels, isMuted, isReelReported]);

  // Safety-net: proactively prefetch when the user is near the end of loaded reels
  useEffect(() => {
    if (reels.length > 0 && reels.length - activeIndex <= 5) {
      fetchReelsFeed(false, activeCity);
    }
  }, [activeIndex, reels.length]);

  const handleNextReel = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
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
    if (isReelReported) return;

    // Tap guard: Ignore taps immediately after swiping/changing reels to prevent accidental play/pause toggle toasts
    if (Date.now() - lastActiveIndexChangeTime.current < 450) {
      console.log("Tap guard active. Ignoring tap right after swiping.");
      return;
    }

    const mainVid = videoRefs.current[activeIndex];

    if (mainVid) {
      if (isPlaying) {
        mainVid.pause();
        setIsPlaying(false);
        showToast("Paused ⏸️");
      } else {
        mainVid.play().catch(() => {});
        setIsPlaying(true);
        showToast("Playing ▶️");
      }
    }
  };

  // Double Click / Double Tap Triggering Premium Center Pulse
  const handleVideoDoubleClick = (e) => {
    e.stopPropagation();
    if (isReelReported) return;
    
    if (!isAuthenticated) {
      showToast("Sign in to like this reel ❤️");
      return;
    }
    
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

  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);

  const handleDeleteCommentClick = (commentId) => {
    setCommentDeleteTarget(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!commentDeleteTarget) return;
    try {
      await deleteCommentFromReel(activeReel._id, commentDeleteTarget);
      showToast('Comment deleted successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete comment', 'error');
    } finally {
      setCommentDeleteTarget(null);
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
  const reportReasonsList = [
    { value: 'Spam', label: 'Spam or Scam', icon: ShieldAlert, desc: 'Unwanted promotional posts or fraudulent offers' },
    { value: 'Inappropriate', label: 'Inappropriate Content', icon: EyeOff, desc: 'Sensitive, explicit, or offensive cooking streams' },
    { value: 'Harassment', label: 'Harassment or Hate Speech', icon: UserX, desc: 'Hostile interactions or offensive commentary' },
    { value: 'Copyright', label: 'Intellectual Property Violation', icon: Copyright, desc: 'Stolen recipe clips or unlicensed media use' },
    { value: 'Other', label: 'Other Reason', icon: HelpCircle, desc: 'Any other violation not listed above' }
  ];

  const selectedReasonObj = reportReasonsList.find(r => r.value === reportReason) || reportReasonsList[0];
  const SelectedIcon = selectedReasonObj.icon;

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
        className="flex justify-center items-center fade-in reels-player-container fixed inset-0 h-screen w-screen overflow-hidden z-[1] pt-[96px] md:pt-[112px] pb-[max(20px,env(safe-area-inset-bottom,20px))] px-10 pointer-events-none"
      >
        {/* 🎬 DYNAMIC FROSTED AMBIENT GLASS BACKDROP */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] z-0 pointer-events-none transition-all duration-500 overflow-hidden"
          style={{
            opacity: isReelsDark ? 0.38 : 0.28,
          }}
        >
          <AnimatePresence mode="wait">
            {activeReel.restaurantDetails?.coverImage ? (
              <motion.div
                key={`bg-image-${activeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${resolveMediaUrl(activeReel.restaurantDetails.coverImage)})`,
                  filter: 'blur(50px) brightness(0.6)',
                  transform: 'scale(1.08)',
                }}
              />
            ) : (
              <motion.div
                key="bg-gradient"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full bg-gradient-to-tr from-[#0F0C20] via-[#15102A] to-[#06040A]"
                style={{
                  filter: 'blur(50px)',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 🎬 CINEMATIC THREE-COLUMN GRID CONTAINER (Desktop only sideboards, center on all viewports) */}
        <div className="flex justify-center items-center gap-11 w-full max-w-[1440px] h-[calc(100vh-120px)] md:h-[calc(100vh-132px)] max-h-[940px] min-h-[540px] relative z-[2] pointer-events-none">

          {/* 🍽️ LEFT COLUMN: ACTIVE KITCHEN PROFILE & CULINARY HIGHLIGHTS (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-5 w-[280px] xl:w-[300px] h-full justify-center shrink-0 pointer-events-auto">
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
                  <Utensils size={11} className="text-[#FF8A72]" />
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
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={handleDragEnd}
              onDoubleClick={handleVideoDoubleClick}
              onTap={handleVideoTap}
              className={`w-full h-full relative ${isMobile ? 'cursor-grab' : ''}`}
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

              {/* ⏳ Next Multi-Video Preload Queue (Concurrent Caching for Lag-free Swiping) */}
              <div className="absolute w-[1px] h-[1px] opacity-[0.001] pointer-events-none hidden">
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
                          // Background video removed, only main video reloaded
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
     
                {/* Report Content Trigger (Only visible to customers or guests) */}
                {(!user || user.role === 'customer') && (
                  <div className="text-center flex flex-col items-center">
                    <motion.button 
                      whileHover={isReelReported ? {} : { scale: 1.08 }}
                      whileTap={isReelReported ? {} : { scale: 0.92 }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isReelReported) return;
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setShowReportModal(true); 
                      }}
                      className={`w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer ${
                        isReelReported 
                          ? 'bg-amber-500/25 border-amber-500/40 text-amber-500 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                      }`}
                      title={isReelReported ? "You reported this reel" : "Report inappropriate content"}
                      disabled={isReelReported}
                    >
                      <AlertTriangle size={16} className={isReelReported ? "text-amber-500 animate-pulse" : ""} />
                    </motion.button>
                    <span className="text-[9.5px] font-semibold mt-1 text-white/80">
                      {isReelReported ? "Reported" : "Report"}
                    </span>
                  </div>
                )}

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
              
              {/* 🙈 Reported Content Blur Overlay */}
              {isReelReported && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 z-[18] bg-black/85 backdrop-blur-[24px]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col items-center text-center gap-4 max-w-[280px] pointer-events-auto">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-white mb-2">
                        Content Reported
                      </h4>
                      <p className="text-[12px] text-white/70 leading-normal">
                        You have successfully reported this reel. We have hidden this video.
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextReel();
                      }}
                      className="w-full bg-primary hover:bg-primary-hover active:bg-primary-pressed text-white py-2.5 px-4 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer shadow-md border-none"
                    >
                      Swipe Next →
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* 💬 RIGHT COLUMN: INLINE COMMENT BOARD (Desktop Only) */}
          <div className="hidden lg:flex flex-col w-[280px] xl:w-[300px] h-full justify-center shrink-0 pointer-events-auto">
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
                  activeReel.comments.map((comment) => {
                    const isCommentAuthor = user && (comment.user?._id === user._id || comment.user === user._id);
                    const isReelOwner = user?.role === 'restaurant' && activeReel.restaurantDetails?.owner === user._id;
                    const isAdminUser = user?.role === 'admin';
                    const canDelete = isCommentAuthor || isReelOwner || isAdminUser;

                    return (
                      <div key={comment._id} className="flex gap-2.5 text-[12px] items-start group/comment">
                        <SafeAvatar 
                          src={resolveMediaUrl(comment.user?.profilePicture)} 
                          alt={comment.user?.username || 'Diner'} 
                          size={26}
                          className="border border-[var(--border-light)] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-text-primary truncate">
                              @{comment.user?.username || 'Diner'}
                            </span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteCommentClick(comment._id)}
                                className="p-1 rounded text-text-muted hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Delete comment"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-text-secondary leading-relaxed break-words pr-2">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
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
                  activeReel.comments.map((comment) => {
                    const isCommentAuthor = user && (comment.user?._id === user._id || comment.user === user._id);
                    const isReelOwner = user?.role === 'restaurant' && activeReel.restaurantDetails?.owner === user._id;
                    const isAdminUser = user?.role === 'admin';
                    const canDelete = isCommentAuthor || isReelOwner || isAdminUser;

                    return (
                      <div key={comment._id} className="flex gap-2.5 text-[13px] items-start">
                        <SafeAvatar 
                          src={resolveMediaUrl(comment.user?.profilePicture)} 
                          alt={comment.user?.username || 'Diner'} 
                          size={28}
                          className="border border-solid border-[var(--border-light)] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-semibold text-text-primary truncate">
                              @{comment.user?.username || 'Diner'}
                            </span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteCommentClick(comment._id)}
                                className="p-1 rounded text-text-muted hover:text-red-500 transition-colors cursor-pointer shrink-0"
                                title="Delete comment"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="text-text-secondary leading-relaxed break-words pr-1">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
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

        {/* 🚨 PREMIUM GLASSMORPHIC CONTENT REPORT MODAL */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[12px] pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="w-full max-w-[380px] glass-panel p-6 rounded-[28px] text-center text-text-primary border border-white/10 relative bg-white/70 dark:bg-[#0c0c12]/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              >
                <div className="noise-overlay rounded-[28px]" />
                
                {/* Warning Shield Header */}
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} />
                </div>

                <h3 className="text-base font-extrabold mb-2 text-text-primary tracking-tight">
                  Report Culinary Stream?
                </h3>
                
                <p className="text-xs text-text-secondary leading-relaxed mb-4 px-1">
                  Help us keep the Savoré community safe and exquisite. Reporting this reel sends it directly to our moderation queue for review.
                </p>

                {/* Dropdown for Reason */}
                <div className="text-left mb-4 relative">
                  <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Reason for Reporting
                  </label>
                  
                  {/* Premium Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                    className="w-full flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-primary/40 dark:hover:border-primary/45 rounded-xl px-3.5 py-3 text-xs text-text-primary transition-all duration-200 outline-none focus:outline-none focus:border-primary/50 cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/15 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <SelectedIcon size={14} className="stroke-[2.5]" />
                      </div>
                      <span className="font-bold tracking-tight text-left">{selectedReasonObj.label}</span>
                    </div>
                    <ChevronDown 
                      size={14} 
                      className={`text-text-secondary group-hover:text-text-primary transition-transform duration-300 ${isReasonDropdownOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown List Popover */}
                  <AnimatePresence>
                    {isReasonDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-30 cursor-default" 
                          onClick={() => setIsReasonDropdownOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute left-0 right-0 mt-1.5 z-40 bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] max-h-[260px] overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
                        >
                          {reportReasonsList.map((reason) => {
                            const ReasonIcon = reason.icon;
                            const isSelected = reason.value === reportReason;
                            return (
                              <button
                                key={reason.value}
                                type="button"
                                onClick={() => {
                                  setReportReason(reason.value);
                                  setIsReasonDropdownOpen(false);
                                }}
                                className={`w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left cursor-pointer ${
                                  isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                                }`}
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                                  isSelected 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-text-secondary'
                                }`}>
                                  <ReasonIcon size={14} className="stroke-[2.5]" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className={`text-xs font-bold ${
                                    isSelected ? 'text-primary' : 'text-text-primary'
                                  }`}>
                                    {reason.label}
                                  </div>
                                  <div className="text-[10px] text-text-muted mt-0.5 leading-normal">
                                    {reason.desc}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="self-center text-primary flex items-center justify-center pr-1">
                                    <Check size={14} className="stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Description Input */}
                <div className="text-left mb-6">
                  <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider flex justify-between">
                    <span>Description Details</span>
                    <span className="text-[9px] text-text-muted font-normal">{reportDescription.length}/300</span>
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Provide context on why this content is being flagged..."
                    rows={3}
                    maxLength={300}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-all resize-none placeholder-text-muted"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setIsReasonDropdownOpen(false);
                    }}
                    disabled={isSubmittingReport}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-800 bg-transparent text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={isSubmittingReport}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-md shadow-red-500/10"
                  >
                    {isSubmittingReport ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>File Report</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* COMMENT DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {commentDeleteTarget && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6 select-none animate-fade-in pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommentDeleteTarget(null)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#12161c] border border-white/10 rounded-[24px] p-6 max-w-[380px] w-full relative z-10 text-center shadow-2xl text-[var(--text-primary)]"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <ShieldAlert size={22} className="animate-pulse" />
              </div>
              <h4 className="text-md font-bold text-white mb-2">Delete Comment?</h4>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                Are you sure you want to permanently delete this comment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCommentDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/[0.04] cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteComment}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold border-none cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </>
  );
}
