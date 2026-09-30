// Savoré — Modular Chef Speech Bubble & Conversational Chat UI

import React, { useContext, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Flame, Award, Volume2, VolumeX, ShoppingBag, X, 
  Send, MessageSquare, Trash2, ChevronDown, RefreshCw 
} from 'lucide-react';
import { useChefMood } from './ChefMoodEngine';
import { formatPrice } from '../../utils/priceFormatter';
import { useToast } from '../../context/ToastContext';
import { CartContext } from '../../context/CartContext';
import { soundController } from './SoundController';
import FlyToCartPortal from './FlyToCartPortal';
import { resolveMediaUrl } from '../../utils/mediaResolver';
import SafeImage from '../SafeImage';

const highlightKeywords = (text) => {
  if (!text) return text;
  
  const keywords = [
    "white truffles", "mandoline", "Naan", "tandoor clay ovens",
    "Edo-style sushi", "sushi", "pasta sauces", "pasta water",
    "soufflés", "egg whites", "duck breast", "crispy finish",
    "comfort food", "spicy", "special", "fresh flavors",
    "culinary art", "aromatic masterpiece", "comfort", "sublime freshness", "heaven",
    "Sakura Sushi", "Sakura", "Sakura's", "L'Ambroisie", "Saffron Bistro"
  ];
  
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  
  return parts.map((part, index) => {
    const isMatch = keywords.some(k => k.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return <span key={index} className="text-[#FF8A72] font-semibold">{part}</span>;
    }
    return part;
  });
};

const ChefHatIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 18V17a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" />
    <path d="M5 14c-1.5-1.5-1-4 .5-5 .8-.5 1.7-.5 2.5 0M19 14c1.5-1.5 1-4-.5-5-.8-.5-1.7-.5-2.5 0" />
    <path d="M8 9a4 4 0 0 1 8 0" />
    <rect x="7" y="17" width="10" height="3" rx="1.5" />
  </svg>
);

const SushiIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="12" rx="9" ry="5" />
    <ellipse cx="12" cy="12" rx="5" ry="2.5" />
    <ellipse cx="12" cy="10" rx="2" ry="1" />
    <path d="M3 12v3.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5V12" />
  </svg>
);

const PizzaIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM11 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M20 3.7c-.5-.3-1.1-.3-1.6 0L4 12.2c-.6.3-.9.9-.9 1.6 0 .7.4 1.3.9 1.6 1.7 1 3.7 1.6 5.8 1.6 2.3 0 4.5-.6 6.3-1.7l3-1.8c.6-.3.9-.9.9-1.6 0-.7-.4-1.3-.9-1.6L20 3.7z" />
    <path d="M4.3 12.6c3.2-1.9 6.8-2.9 10.5-2.9h.2" />
  </svg>
);

const WineIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12v7c0 3.3-2.7 6-6 6s-6-2.7-6-6V3z" />
    <path d="M12 16v5M8 21h8" />
  </svg>
);

const ClocheIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4V3M5 17h14c1.1 0 2-.9 2-2 0-5.5-4.5-10-10-10S2 9.5 2 15c0 1.1.9 2 2 2zM2 20h20" />
  </svg>
);

const FlameIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const DiningBowlIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 10h20M2 10a10 10 0 0 0 20 0M6 10c0-3.5 2.5-6 6-6s6 2.5 6 6" />
    <path d="M12 2v2M8 4c.5 1 1.5 2 4 2s3.5-1 4-2" />
  </svg>
);

const LAUNCH_ICONS = [
  ChefHatIcon,
  SushiIcon,
  PizzaIcon,
  WineIcon,
  ClocheIcon,
  FlameIcon,
  DiningBowlIcon
];

const getLoaderIconForText = (text) => {
  if (!text) return 0;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % LAUNCH_ICONS.length;
};

export default function ChefSpeechBubble() {
  const {
    showBubble, bubbleText, commentType, recommendation,
    isSoundEnabled, toggleSound, resetBubble, celebrate, currentMood,
    
    // AI Conversational bindings
    chatHistory, isAIThinking, isChatExpanded, setIsChatExpanded,
    sendMessageToChef, clearChefConversation
  } = useChefMood();

  const navigate = useNavigate();

  const handleRestaurantNavigation = (e) => {
    e.stopPropagation();
    const restId = recommendation?.restaurantObj?._id || recommendation?.restaurantObj?.id;
    if (restId) {
      soundController.playClick();
      navigate(`/restaurant/${restId}`);
      resetBubble();
    }
  };

  const { showToast } = useToast();
  const { addToCart } = useContext(CartContext);

  const [layoutMode, setLayoutMode] = useState('layout-tablet-above');
  const [isFlying, setIsFlying] = useState(false);
  const [ctaPressed, setCtaPressed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const addToCartBtnRef = useRef(null);
  const wrapperRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  // Responsive layout calibration
  useLayoutEffect(() => {
    const repositionBubble = () => {
      const width = window.innerWidth;
      setLayoutMode(width <= 768 ? 'layout-mobile-above' : 'layout-tablet-above');
    };
    repositionBubble();
    window.addEventListener('resize', repositionBubble, { passive: true });
    return () => window.removeEventListener('resize', repositionBubble);
  }, [showBubble, bubbleText, recommendation]);

  // Auto-scroll conversation thread to bottom inside the container only (preventing main window scrolls)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isAIThinking, isChatExpanded]);

  // Auto-focus chat input when expanded
  useEffect(() => {
    if (isChatExpanded) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isChatExpanded]);

  // Reset checkout indicators when recommendation changes
  useEffect(() => {
    setIsFlying(false);
    setCtaPressed(false);
  }, [recommendation]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!recommendation || ctaPressed) return;

    setCtaPressed(true);

    const foodItem = {
      _id:   recommendation._id   || `chef-rec-${Date.now()}`,
      name:  recommendation.dish,
      price: recommendation.price,
      image: recommendation.image || '',
    };

    const restaurantObj = recommendation.restaurantObj || {
      _id:         `rest-${Date.now()}`,
      name:        recommendation.restaurant,
      deliveryFee: 0,
    };

    try {
      addToCart(foodItem, restaurantObj, 1);
      window.dispatchEvent(new CustomEvent('cart-added'));
      setIsFlying(true);
      soundController.playWhoosh();
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      setCtaPressed(false);
    }
  };

  const handleFlyComplete = () => {
    setIsFlying(false);
    soundController.playPlate();
    showToast(`${recommendation?.dish} added to cart ✓`);
    celebrate('item_added');
    resetBubble();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputValue || inputValue.trim() === '' || isAIThinking) return;
    sendMessageToChef(inputValue);
    setInputValue('');
  };

  const toggleExpandChat = (e) => {
    e.stopPropagation();
    soundController.playClick();
    setIsChatExpanded(!isChatExpanded);
  };

  return (
    <>
      <FlyToCartPortal
        isFlying={isFlying}
        imageUrl={recommendation?.image}
        dishName={recommendation?.dish}
        sourceRef={addToCartBtnRef}
        onComplete={handleFlyComplete}
      />

      <AnimatePresence>
        {showBubble && (
          <motion.div
            ref={wrapperRef}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`chef-speech-bubble-wrapper ${layoutMode} ${
              recommendation ? ' has-recommendation' : ''
            } ${isChatExpanded ? ' chat-expanded' : ''} z-[45] pointer-events-auto`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } 
            }}
            exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.25 } }}
          >
            <div className={`chef-speech-bubble flex flex-col ${isChatExpanded ? 'h-[440px] md:h-[480px] !p-0 overflow-hidden' : ''}`}>

              {/* 🏆 Glassmorphic Header */}
              <div className={`flex justify-between items-center ${isChatExpanded ? 'p-3.5 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] rounded-t-[28px]' : 'mb-2'}`}>
                <div className="flex items-center gap-1.5 text-primary">
                  {(() => {
                    const iconIdx = getLoaderIconForText(bubbleText);
                    const SelectedIcon = LAUNCH_ICONS[iconIdx];
                    return (
                      <SelectedIcon 
                        className={`w-3.5 h-3.5 shrink-0 ${
                          commentType === 'thinking' ? 'animate-pulse text-[#ffb300]' : 'text-[#FF8A72]'
                        }`} 
                      />
                    );
                  })()}
                  <span className="text-[10px] uppercase tracking-[0.08em] font-bold font-sans opacity-85">
                    {isChatExpanded 
                      ? 'Chef Savoré'
                      : commentType === 'thinking'
                      ? 'Deliberating...'
                      : recommendation
                      ? "Chef's Recommendation"
                      : commentType === 'secret'
                      ? 'Culinary Wisdom'
                      : commentType === 'rare'
                      ? 'Signature Secret'
                      : "Chef's Friendly Tip"}
                  </span>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-2">
                  {/* sound toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                    className="chef-sound-toggle"
                    title={isSoundEnabled ? "Mute sounds" : "Unmute sounds"}
                  >
                    {isSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  </button>

                  {/* Expand / Minimize Toggle */}
                  <button
                    onClick={toggleExpandChat}
                    className="chef-expand-toggle flex items-center justify-center w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 text-text-primary transition-colors border border-white/5"
                    title={isChatExpanded ? "Collapse chat" : "Expand to chat"}
                  >
                    {isChatExpanded ? <ChevronDown size={12} /> : <MessageSquare size={11} />}
                  </button>
                </div>
              </div>

              {/* 🗣️ Chat Expanded Conversation Thread View */}
              {isChatExpanded ? (
                <div className="flex-1 flex flex-col min-h-0 bg-black/10 rounded-b-[28px]">
                  {/* Messages Viewport */}
                  <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar scroll-smooth">
                    
                    {chatHistory.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.96, filter: 'blur(3px)' }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full flex flex-col items-center justify-center py-16 px-4 text-center my-auto select-none"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] dark:bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.06] flex items-center justify-center text-[#FF8A72] mb-4 shadow-sm backdrop-blur-md">
                          <MessageSquare size={18} />
                        </div>
                        <h4 className="text-[13px] font-sans font-bold text-text-primary mb-1">
                          How can Chef Savoré assist you today?
                        </h4>
                        <p className="text-[10.5px] font-sans text-text-secondary max-w-[210px] leading-relaxed opacity-75">
                          Ask about pairings, menus, or culinary secrets.
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        {/* Welcome message */}
                        <div className="flex justify-start">
                          <div className="chef-chat-msg chef max-w-[85%] rounded-[15px] rounded-tl-none p-3 text-[12.5px] leading-[1.5] text-left bg-white/5 border border-white/5 shadow-sm text-text-primary">
                            Bonjour! I am <strong>Chef Savoré</strong>. Ask me anything about wine pairings, culinary techniques, or let me recommend a spectacular dish based on your taste! 🧑‍🍳🍷
                          </div>
                        </div>

                        {/* Conversation log */}
                        <AnimatePresence>
                          {chatHistory.map((msg, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, scale: 0.95, filter: 'blur(3px)' }}
                              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                              exit={{ 
                                opacity: 0, 
                                scale: 0.95, 
                                filter: 'blur(3px)',
                                transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } 
                              }}
                              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                            >
                              <div 
                                className={`chef-chat-msg ${msg.sender} max-w-[85%] rounded-[15px] p-3 text-[12.5px] leading-[1.5] text-left shadow-sm ${
                                  msg.sender === 'user' 
                                    ? 'rounded-tr-none bg-gradient-to-r from-[#FF6A4E] to-[#FF8A72] text-white font-medium' 
                                    : 'rounded-tl-none bg-white/5 border border-white/5 text-text-primary'
                                }`}
                              >
                                {msg.sender === 'user' ? msg.text : highlightKeywords(msg.text)}
                                {msg.isAuthPrompt && (
                                  <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => navigate('/login')}
                                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF6A4E] to-[#FF8A72] hover:brightness-105 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                                    >
                                      Log In
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate('/register')}
                                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-text-primary text-[11px] font-bold border border-white/10 transition-all cursor-pointer"
                                    >
                                      Sign Up
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </>
                    )}

                    {/* AI Thinking spinner loader */}
                    {isAIThinking && (
                      <div className="flex justify-start">
                        <div className="chef-chat-msg chef max-w-[85%] rounded-[15px] rounded-tl-none p-3 bg-white/5 border border-white/5 shadow-sm flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A72] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A72] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A72] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-[10px] tracking-wide text-text-secondary uppercase font-semibold">Chef Savoré is preparing a recommendation...</span>
                        </div>
                      </div>
                    )}

                    {/* In-Line Recommendation Card */}
                    {recommendation && !isAIThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="chef-recommendation-card border border-[#FF8A72]/20 bg-[#FF8A72]/5 rounded-xl p-3 shadow-md mt-1.5"
                      >
                        <div className="flex items-center gap-2.5 mb-[7px]">
                          {recommendation.image && (
                            <div 
                              onClick={handleRestaurantNavigation}
                              className="chef-rec-thumbnail w-10 h-10 rounded-[8px] overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-white/5 cursor-pointer hover:opacity-90 transition-all"
                              title={`Go to ${recommendation.restaurant}`}
                            >
                              <SafeImage
                                src={resolveMediaUrl(recommendation.image)}
                                alt={recommendation.dish}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 
                              onClick={handleRestaurantNavigation}
                              className="text-[12.5px] font-semibold text-text-primary m-0 mb-0.5 font-sans whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-primary hover:underline transition-all"
                              title={`Go to ${recommendation.restaurant}`}
                            >
                              {recommendation.dish}
                            </h4>
                            <p className="text-text-secondary text-[10.5px] m-0 font-sans">
                              {recommendation.restaurant}
                            </p>
                          </div>
                          <span className="chef-rec-price text-[12.5px] font-bold text-primary whitespace-nowrap font-sans shrink-0">
                            {formatPrice(recommendation.price)}
                          </span>
                        </div>

                        <p className="chef-rec-quote text-text-secondary text-[10px] italic border-l border-primary/50 pl-2 m-0 mb-2.5 leading-[1.4]">
                          "{highlightKeywords(recommendation.quote)}"
                        </p>

                        <div className="flex gap-[7px]">
                          <motion.button
                            ref={addToCartBtnRef}
                            id="chef-add-to-cart-btn"
                            onClick={handleAddToCart}
                            disabled={ctaPressed}
                            className="chef-cta-add-to-cart flex-1 inline-flex items-center justify-center gap-1.5 min-h-[28px] py-1 px-3 bg-[#FF8A72] text-white text-[10px] font-bold rounded-lg hover:brightness-105 shadow-sm transition-all"
                            whileHover={!ctaPressed ? { y: -1 } : {}}
                            whileTap={!ctaPressed ? { scale: 0.97 } : {}}
                          >
                            <ShoppingBag size={11} className="shrink-0" />
                            {ctaPressed ? 'Adding…' : 'Add to Order'}
                          </motion.button>

                          <motion.button
                            onClick={(e) => { e.stopPropagation(); resetBubble(); }}
                            className="chef-cta-dismiss flex-none inline-flex items-center justify-center gap-1 min-h-[28px] px-2.5 border border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5 text-[10px] rounded-lg transition-all"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <X size={10} className="shrink-0" />
                            Dismiss
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                  </div>

                  {/* ⌨️ Rich Glassmorphic Chat Input Bar */}
                  <form 
                    onSubmit={handleFormSubmit}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01] flex gap-2 items-center rounded-b-[28px]"
                  >
                    <button
                      type="button"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        clearChefConversation(); 
                        setInputValue('');
                        showToast("Conversation Cleared ✓");
                      }}
                      className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.04] dark:border-white/[0.08] text-[#FF8A72] hover:text-[#FF6A4D] transition-all duration-280 cubic-bezier-[0.22,1,0.36,1] hover:-translate-y-[1px] active:scale-[0.98] shrink-0"
                      title="Clear history"
                    >
                      <Trash2 size={13} className="transition-transform duration-200" />
                    </button>

                    <input
                      ref={chatInputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isAIThinking}
                      placeholder="Ask Savoré about wine pairings, menus..."
                      className="flex-1 min-w-0 bg-black/20 hover:bg-black/35 focus:bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-[12.5px] text-text-primary focus:outline-none focus:border-[#FF8A72]/40 transition-all font-sans"
                    />

                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isAIThinking}
                      className="p-2 rounded-lg bg-[#FF8A72]/10 text-[#FF8A72] border border-[#FF8A72]/20 hover:bg-[#FF8A72] hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              ) : (
                /* 💬 Mini Speech Bubble Display View (Default Mode) */
                <>
                  {recommendation ? (
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(3px)', y: 4 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="chef-recommendation-card"
                    >
                      {/* Dish card row */}
                      <div className="flex items-center gap-2.5 mb-[7px]">
                        {recommendation.image && (
                          <div 
                            onClick={handleRestaurantNavigation}
                            className="chef-rec-thumbnail w-11 h-11 rounded-[10px] overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-white/5 cursor-pointer hover:opacity-90 transition-all"
                            title={`Go to ${recommendation.restaurant}`}
                          >
                            <SafeImage
                              src={resolveMediaUrl(recommendation.image)}
                              alt={recommendation.dish}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 
                            onClick={handleRestaurantNavigation}
                            className="text-[13px] font-semibold text-inherit m-0 mb-0.5 font-sans whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-primary hover:underline transition-all"
                            title={`Go to ${recommendation.restaurant}`}
                          >
                            {recommendation.dish}
                          </h4>
                          <p className="text-text-secondary text-[11px] m-0 font-sans">
                            {recommendation.restaurant}
                          </p>
                        </div>
                        <span className="chef-rec-price text-[13px] font-bold text-primary whitespace-nowrap font-sans shrink-0">
                          {formatPrice(recommendation.price)}
                        </span>
                      </div>

                      {/* Chef quote */}
                      <p className="chef-rec-quote text-text-secondary text-[11px] italic border-l-2 border-primary pl-2 m-0 mb-2.5 leading-[1.45]">
                        "{highlightKeywords(recommendation.quote)}"
                      </p>

                      {/* Action buttons */}
                      <div className="flex gap-[7px]">
                        <motion.button
                          ref={addToCartBtnRef}
                          id="chef-add-to-cart-btn"
                          onClick={handleAddToCart}
                          disabled={ctaPressed}
                          className="chef-cta-add-to-cart"
                          whileHover={!ctaPressed ? { y: -1 } : {}}
                          whileTap={!ctaPressed ? { scale: 0.97 } : {}}
                        >
                          <ShoppingBag size={12} className="shrink-0" />
                          {ctaPressed ? 'Adding…' : 'Add to Cart'}
                        </motion.button>

                        <motion.button
                          onClick={(e) => { e.stopPropagation(); resetBubble(); }}
                          className="chef-cta-dismiss"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <X size={11} className="shrink-0" />
                          Dismiss
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    /* General Rotating Speech Bubble */
                    <div className="break-words font-normal text-[14px] tracking-[-0.02em] leading-[1.5] text-inherit font-sans text-left flex flex-col gap-2.5">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={bubbleText}
                          initial={{ opacity: 0, filter: 'blur(3px)', y: 4 }}
                          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                          exit={{ opacity: 0, filter: 'blur(3px)', y: -4 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          className="chef-bubble-text"
                        >
                          {highlightKeywords(bubbleText)}
                        </motion.div>
                      </AnimatePresence>

                      {/* Small Quick-Input Call to Action */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setIsChatExpanded(true); }}
                        className="mt-1 flex items-center justify-between gap-2 p-1.5 pl-3 pr-2 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5 text-[11.5px] text-text-secondary hover:text-text-primary transition-all font-sans"
                      >
                        <span className="opacity-80">Ask Chef Savoré anything...</span>
                        <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#FF8A72]/15 text-[#FF8A72]">
                          <Send size={10} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* pointer triangle */}
                  <div className="chef-speech-bubble-pointer" />
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
