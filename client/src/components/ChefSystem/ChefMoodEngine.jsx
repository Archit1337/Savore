// Savoré — Centralized Chef Mood Engine

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChefMessageController } from './ChefMessageController';
import { soundController } from './SoundController';
import { useToast } from '../../context/ToastContext';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { LocationContext } from '../../context/LocationContext';
import api from '../../utils/api';

const ChefMoodContext = createContext();

export const ChefMoodProvider = ({ children }) => {
  const location = useLocation();
  const { showToast } = useToast();
  const { itemsCount, cartItems } = useContext(CartContext) || { itemsCount: 0, cartItems: [] };
  const { user } = useContext(AuthContext) || { user: null };
  const { activeCity, activeLocality } = useContext(LocationContext) || { activeCity: 'Mumbai', activeLocality: 'Bandra' };
  
  const [currentMood, setCurrentMood] = useState('idle'); // idle, hover, active, celebration, thinking
  const [bubbleText, setBubbleText] = useState("Your perfect meal is just a click away 🍽️");
  const [commentType, setCommentType] = useState("common");
  const [showBubble, setShowBubble] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem('chef_sounds') === 'true';
  });
  
  // Custom AI-Powered State Extensions
  const [recommendation, setRecommendation] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // [{ sender: 'user' | 'chef', text: string }]
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Context-History Tracking States
  const [lastActivePage, setLastActivePage] = useState('Home');
  const [lastVisitedRestaurant, setLastVisitedRestaurant] = useState(null); // { id, name }
  const [lastViewedReel, setLastViewedReel] = useState(null); // { id, dish }

  const updateLastVisitedRestaurant = useCallback((id, name) => {
    setLastVisitedRestaurant((prev) => {
      if (prev && prev.id === id && prev.name === name) {
        return prev;
      }
      console.log(`🏨 [Chef Savoré Context] User visiting restaurant: ${name} (${id})`);
      return { id, name };
    });
  }, []);

  const updateLastViewedReel = useCallback((reel, dish) => {
    setLastViewedReel((prev) => {
      const dishId = dish?._id || null;
      if (prev && prev.id === reel._id && prev.dishId === dishId) {
        return prev;
      }
      console.log(`🎬 [Chef Savoré Context] User watching reel for dish: ${dish?.name || 'Unknown'}`);
      return {
        id: reel._id,
        dishName: dish?.name,
        dishId: dishId,
        price: dish?.price,
        image: dish?.image,
        restaurant: reel.restaurantDetails?.name
      };
    });
  }, []);
  
  const messageController = useRef(new ChefMessageController());
  const rotationTimer = useRef(null);

  // Sync sound controller state
  useEffect(() => {
    soundController.toggle(isSoundEnabled);
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      soundController.toggle(next);
      return next;
    });
    soundController.playClick();
  };

  // State Machine Operations
  const hoverStart = () => {
    if (currentMood === 'idle') {
      setCurrentMood('hover');
    }
  };

  const hoverEnd = () => {
    if (currentMood === 'hover') {
      setCurrentMood('idle');
    }
  };

  // Helper to construct context payload for backend
  const getActiveContext = () => {
    const match = location.pathname.match(/\/restaurant\/([a-fA-F0-9]+)/);
    const activeRestaurantId = match ? match[1] : (lastVisitedRestaurant ? lastVisitedRestaurant.id : null);
    const activeRestaurantName = match ? null : (lastVisitedRestaurant ? lastVisitedRestaurant.name : null);

    // Detect time of day dynamically
    const hour = new Date().getHours();
    let timeOfDay = 'evening';
    if (hour >= 5 && hour < 11) {
      timeOfDay = 'morning';
    } else if (hour >= 11 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'late-night';
    }

    return {
      currentPath: location.pathname,
      lastActivePage: lastActivePage,
      cartItems: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      restaurantId: activeRestaurantId,
      restaurantName: activeRestaurantName,
      lastVisitedRestaurant,
      lastViewedReel,
      activeCity,
      activeLocality,
      timeOfDay,
      userPreferences: user?.preferences || {}
    };
  };

  // Dynamic AI-powered recommendation click trigger
  const triggerRecommendation = async () => {
    if (currentMood === 'thinking' || currentMood === 'celebration' || isAIThinking) return;

    soundController.playClick();
    setCurrentMood('thinking');
    setIsAIThinking(true);
    setRecommendation(null);
    setBubbleText("👨‍🍳 Ooh la la... let me consult my culinary instincts!");
    setCommentType('thinking');

    // After 5s still thinking — show a reassuring update so user knows it's working
    const thinkingTimer = setTimeout(() => {
      setIsAIThinking(prev => {
        if (prev) setBubbleText("👨‍🍳 Almost ready... selecting the most exquisite dish just for you!");
        return prev;
      });
    }, 5000);

    try {
      const response = await api.post('/chef/recommend', { 
        context: getActiveContext(),
        history: chatHistory.slice(-6)
      });
      clearTimeout(thinkingTimer);
      const data = response.data;

      if (data.success) {
        let finalRec = data.recommendation;
        let finalReply = data.reply;

        const isLocationMatch = finalRec && 
          finalRec.restaurantObj && 
          finalRec.restaurantObj.city && 
          activeCity && 
          finalRec.restaurantObj.city.toLowerCase().trim() === activeCity.toLowerCase().trim();

        if (!isLocationMatch) {
          finalRec = null;
        }

        if (!finalRec) {
          console.log(`📡 [Chef Local Fallback] Recommendation is out of zone (${activeCity}). Selecting local menu...`);
          // Fetch restaurants matching activeCity dynamically
          const restRes = await api.get(`/restaurants?city=${encodeURIComponent(activeCity)}&limit=100`);
          const localRests = restRes.data?.data || [];
          const cityRests = localRests.filter(r => r.city && r.city.toLowerCase().trim() === activeCity.toLowerCase().trim());

          if (cityRests.length > 0) {
            const selectedRest = cityRests[Math.floor(Math.random() * cityRests.length)];
            const menuRes = await api.get(`/restaurants/${selectedRest._id}`);
            const menuItems = menuRes.data?.data?.menu || [];

            if (menuItems.length > 0) {
              const selectedDish = menuItems[Math.floor(Math.random() * menuItems.length)];

              // Obtain michelin-star review text from chat endpoint
              const chatRes = await api.post('/chef/chat', {
                message: `Act as Chef Savoré. In under 12 words, describe passionately with French flair why the user should order '${selectedDish.name}' from '${selectedRest.name}'.`,
                context: getActiveContext(),
                history: []
              });

              const chefMessage = chatRes.data?.reply || `Ah, mon ami! You must experience the delectable '${selectedDish.name}' from the master chefs at '${selectedRest.name}' today!`;
              
              finalRec = {
                _id: selectedDish._id,
                dish: selectedDish.name,
                price: selectedDish.price,
                image: selectedDish.image,
                quote: chefMessage,
                restaurant: selectedRest.name,
                restaurantObj: selectedRest
              };
              finalReply = chefMessage;
            }
          }
        }

        if (finalRec) {
          setRecommendation(finalRec);
          setCurrentMood('active');
          setBubbleText(finalReply || "Voilà! Here is my special recommendation for you today! 🍕");
          setCommentType('rare');
          soundController.playPop();
        } else {
          setBubbleText("Mon dieu! I couldn’t select a unique dish from our curated menus in your area today!");
          setCurrentMood('idle');
          setCommentType('common');
        }
      } else {
        throw new Error(data.error || 'Failed to get recommendation');
      }
    } catch (err) {
      clearTimeout(thinkingTimer);
      console.error('Chef Recommendation Error:', err);
      setBubbleText("Chef Savoré is preparing something wonderful — try again in a moment! 👨‍🍳");
      setCurrentMood('idle');
      setCommentType('common');
    } finally {
      setIsAIThinking(false);
    }
  };

  // Conversational AI chat handler
  const sendMessageToChef = async (messageText) => {
    if (!messageText || messageText.trim() === '' || isAIThinking) return;

    const userMessage = messageText.trim();
    // 1. Add user message to history
    const updatedHistory = [...chatHistory, { sender: 'user', text: userMessage }];
    setChatHistory(updatedHistory);
    
    // 2. Adjust state to thinking
    soundController.playClick();
    setIsAIThinking(true);
    setCurrentMood('thinking');
    setBubbleText("👨‍🍳 Ah, let me think... standard-setting culinary ideas take a moment...");
    setCommentType('thinking');

    try {
      const response = await api.post('/chef/chat', {
        message: userMessage,
        context: getActiveContext(),
        history: chatHistory.slice(-6) // Send last 6 messages to keep context window light and fast
      });
      const data = response.data;

      if (data.success) {
        // 3. Add Chef reply to history
        setChatHistory(prev => [...prev, { sender: 'chef', text: data.reply }]);
        setBubbleText(data.reply);
        
        let finalChatRec = data.recommendation;
        const isChatLocationMatch = finalChatRec && 
          finalChatRec.restaurantObj && 
          finalChatRec.restaurantObj.city && 
          activeCity && 
          finalChatRec.restaurantObj.city.toLowerCase().trim() === activeCity.toLowerCase().trim();

        if (finalChatRec && !isChatLocationMatch) {
          finalChatRec = null;
        }

        if (finalChatRec) {
          setRecommendation(finalChatRec);
          setCurrentMood('active');
          setCommentType('rare');
          soundController.playPop();
        } else {
          setRecommendation(null);
          setCurrentMood('idle');
          setCommentType('common');
          soundController.playWhoosh();
        }
      } else {
        throw new Error(data.error || 'Failed to get reply');
      }
    } catch (err) {
      console.error('Chef Chat Error:', err);
      const errorMessage = "Chef Savoré is temporarily unavailable. Please try again shortly.";
      setChatHistory(prev => [...prev, { sender: 'chef', text: errorMessage }]);
      setBubbleText(errorMessage);
      setCurrentMood('idle');
      setCommentType('common');
    } finally {
      setIsAIThinking(false);
    }
  };

  // Celebration Action trigger
  const celebrate = (eventContext) => {
    if (currentMood === 'thinking') return;
    
    // Play correct synthesized sounds
    if (eventContext === 'item_added') {
      soundController.playPop();
      setBubbleText("Great choice! Added to your order! 🔥🍲");
    } else if (eventContext === 'reel_liked') {
      soundController.playClick();
      setBubbleText("Delicious choice! Sending love to the kitchen ❤️");
    } else if (eventContext === 'order_placed') {
      soundController.playChime();
      setBubbleText("Fabulous! Order placed successfully! Chef is ecstatic! 🎉🥂");
    }

    setCurrentMood('celebration');
    setCommentType('celebration');
    setShowBubble(true);

    // Sparkle Particle Event Dispatcher
    window.dispatchEvent(new CustomEvent('chef-sparkle'));

    // Revert back to idle after 3.5s
    setTimeout(() => {
      setCurrentMood('idle');
      setRecommendation(null);
      rotateMessage();
    }, 3500);
  };

  const resetBubble = () => {
    soundController.playClick();
    setCurrentMood('idle');
    setRecommendation(null);
    rotateMessage();
  };

  const clearChefConversation = () => {
    console.log("🗑️ [Chef Savoré] Triggering clearChefConversation...");
    soundController.playClick();
    
    // Clear chat state immutably
    setChatHistory([]);
    setRecommendation(null);
    setBubbleText("How can Chef Savoré assist you today?");
    setCommentType("common");
    setCurrentMood("idle");
    setIsAIThinking(false);
    
    // Clear localStorage values if any
    localStorage.removeItem('chef_chat_history'); 
    
    console.log("✅ [Chef Savoré] Conversation successfully cleared.");
  };

  const clearChat = clearChefConversation;


  // Rotate messages randomly every 3.5 - 6s (only if not currently chatting)
  const rotateMessage = (forcedContext = null) => {
    if (currentMood === 'active' || currentMood === 'thinking' || currentMood === 'celebration' || isChatExpanded || chatHistory.length > 0) return;
    
    const chosen = messageController.current.getNextMessage(forcedContext);
    setBubbleText(chosen.text);
    setCommentType(chosen.category);
    setShowBubble(true);

    if (forcedContext) {
      soundController.playWhoosh();
    } else {
      // 35% chance to trigger subtle dynamic ambient cooking sounds in the background
      if (Math.random() < 0.35) {
        const ambienceSounds = [
          () => soundController.playUtensilTap(),
          () => soundController.playPlate(),
          () => soundController.playSizzle()
        ];
        const randomAmbience = ambienceSounds[Math.floor(Math.random() * ambienceSounds.length)];
        randomAmbience();
      }
    }
  };

  // Coordinate Rotation Timer loops
  useEffect(() => {
    if (currentMood !== 'idle' && currentMood !== 'hover' || isChatExpanded || chatHistory.length > 0) {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      return;
    }

    const startRotationLoop = () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      
      const delay = Math.floor(Math.random() * 2500) + 3500; // 3.5s to 6s
      rotationTimer.current = setTimeout(() => {
        rotateMessage();
        startRotationLoop();
      }, delay);
    };

    startRotationLoop();

    return () => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    };
  }, [currentMood, isChatExpanded, chatHistory]);

  // Context-Aware Routing Listener
  useEffect(() => {
    const path = location.pathname;
    let contextName = null;

    if (path === '/') {
      contextName = itemsCount > 0 ? 'FULL_CART' : 'HOME';
    } else {
      // Record any other page as the last active page
      setLastActivePage(path);
      if (path === '/discover') {
        contextName = itemsCount > 0 ? 'FULL_CART' : 'DISCOVER';
      } else if (path === '/checkout') {
        contextName = itemsCount === 0 ? 'EMPTY_CART' : 'CHECKOUT';
      } else if (path === '/reels') {
        contextName = 'REELS';
      }
    }

    if (contextName) {
      rotateMessage(contextName);
    }
  }, [location.pathname, itemsCount]);

  return (
    <ChefMoodContext.Provider value={{
      currentMood,
      bubbleText,
      setBubbleText,
      setCurrentMood,
      commentType,
      setCommentType,
      showBubble,
      recommendation,
      isSoundEnabled,
      toggleSound,
      hoverStart,
      hoverEnd,
      triggerRecommendation,
      celebrate,
      resetBubble,
      rotateMessage,
      
      // Conversational AI States & Functions
      chatHistory,
      isAIThinking,
      isChatExpanded,
      setIsChatExpanded,
      sendMessageToChef,
      clearChat,
      clearChefConversation,

      // Context history extensions
      lastActivePage,
      lastVisitedRestaurant,
      lastViewedReel,
      updateLastVisitedRestaurant,
      updateLastViewedReel
    }}>
      {children}
    </ChefMoodContext.Provider>
  );
};

export const useChefMood = () => {
  const context = useContext(ChefMoodContext);
  if (!context) {
    throw new Error('useChefMood must be used within a ChefMoodProvider');
  }
  return context;
};
