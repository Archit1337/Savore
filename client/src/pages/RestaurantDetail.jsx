import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, ShoppingBag, Plus, Minus, AlertTriangle, ShieldCheck, Heart, ArrowLeft, Check } from 'lucide-react';
import { LocationContext } from '../context/LocationContext';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, restaurant: cartRestaurant, total, addToCart, removeFromCart, clearCart, clearAndAddToCart } = useContext(CartContext);
  const { isAuthenticated, user } = useContext(AuthContext);
  const { showToast } = useToast();
  const chefMood = useChefMood();
  const { activeCity } = useContext(LocationContext);

  const [restaurant, setRestaurant] = useState(null);
  const isOwnRestaurant = isAuthenticated && user && restaurant && (restaurant.owner === user._id || restaurant.owner?._id === user._id);
  const isOutOfRegion = restaurant && activeCity && restaurant.city && restaurant.city.toLowerCase().trim() !== activeCity.toLowerCase().trim() && !isOwnRestaurant;
  const isClosed = restaurant && !restaurant.isOpen && !isOwnRestaurant;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSaved, setIsSaved] = useState(false);
  
  // Cross-Restaurant blocker states
  const [crossRestError, setCrossRestError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      try {
        const res = await api.get(`/restaurants/${id}`);
        if (res.data && res.data.success) {
          const restData = res.data.data.restaurant;
          setRestaurant(restData);
          setMenu(res.data.data.menu);
          if (chefMood && chefMood.updateLastVisitedRestaurant) {
            chefMood.updateLastVisitedRestaurant(restData._id, restData.name);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurant details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantDetail();
  }, [id, chefMood.updateLastVisitedRestaurant]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/auth/social');
        if (res.data && res.data.success) {
          const saved = res.data.data.savedRestaurants.some(r => r._id === id);
          setIsSaved(saved);
        }
      } catch (err) {
        console.error('Failed to check if restaurant is saved:', err);
      }
    };
    checkIfSaved();
  }, [id, isAuthenticated]);

  // Lock body scroll when cross-restaurant checkout confirmation is open
  useEffect(() => {
    if (showClearConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showClearConfirm]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/auth/restaurants/${id}/favorite`);
      if (res.data && res.data.success) {
        setIsSaved(res.data.isSaved);
        showToast(res.data.isSaved ? "Saved to your kitchens ❤️" : "Removed from saved kitchens");
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err.message);
    }
  };

  const handleAddItem = (foodItem, e) => {
    try {
      addToCart(foodItem, restaurant);
      chefMood.celebrate('item_added');
      showToast("Added to cart 🍕");

      const id = foodItem._id;
      setAddedItems(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [id]: false }));
      }, 1200);
    } catch (err) {
      setCrossRestError(err.message);
      setPendingItem(foodItem);
      setShowClearConfirm(true);
    }
  };

  const handleConfirmClearCart = () => {
    setShowClearConfirm(false);
    setCrossRestError('');
    
    // Defer heavy updates to prevent thread-blocking during modal close transition
    setTimeout(() => {
      if (pendingItem) {
        clearAndAddToCart(pendingItem, restaurant);
        if (chefMood && chefMood.celebrate) {
          chefMood.celebrate('item_added');
        }
        showToast("Added to cart 🍕");

        const id = pendingItem._id;
        setAddedItems(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setAddedItems(prev => ({ ...prev, [id]: false }));
        }, 1200);

        setPendingItem(null);
      } else {
        clearCart();
      }
    }, 16);
  };

  if (loading) {
    return (
      <div className="container flex-center min-h-[60vh] flex-col gap-4">
        <div className="w-10 h-10 border-[3.5px] border-primary border-t-transparent rounded-full animate-[skeleton-loading_1.2s_infinite_linear]" />
        <p className="text-text-secondary font-semibold">Preparing culinary board...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container flex-center min-h-[60vh]">
        <p className="text-text-secondary">Kitchen profile not found.</p>
      </div>
    );
  }

  // Get distinct categories in menu
  const categories = ['All', ...new Set(menu.map((item) => item.category))];

  // Filter menu items by active category
  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter((item) => item.category === activeCategory);

  return (
    <div className="container fade-in -mt-10 md:-mt-14 pb-[120px]">
      
      {/* 🔙 BACK BUTTON */}
      <div className="flex justify-start mb-4">
        <motion.button
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="btn btn-secondary py-2 px-4 rounded-[14px] flex items-center gap-2 border-[1.5px] border-[var(--border-light)] relative overflow-hidden group transition-shadow duration-300 select-none text-[13px] font-semibold cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[var(--text-secondary)] group-hover:text-primary transition-colors" />
          <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Go Back</span>
        </motion.button>
      </div>
      
      {/* 🎬 RESTAURANT PARALLAX BANNER (Apple-Style Overlay) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-[340px] rounded-[32px] overflow-hidden relative mt-6 mb-8 shadow-[var(--shadow-floating)] border-[1.5px] border-[var(--border-light)]"
      >
        <div className="noise-overlay" />
        <SafeImage 
          src={resolveMediaUrl(restaurant.coverImage)} 
          alt={restaurant.name}
          className="w-full h-full"
        />
        
        {/* Dark readability Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d]/96 via-[#0a0a0d]/35 to-black/10" />

        {/* Content Info overlay */}
        <div className="absolute bottom-8 left-8 right-8 text-left flex justify-between items-end z-10">
          <div>
            <h1 className="text-[46px] text-white mb-2 tracking-[0.01em] font-light">
              {restaurant.name}
            </h1>
            <p className="text-white/85 text-[15.5px] max-w-[640px] leading-[1.55] font-light">
              {restaurant.description}
            </p>
          </div>

          {/* Rating / Speed cards */}
          <div className="flex gap-4">
            <button
              onClick={handleToggleFavorite}
              className="bg-[#0a0a0e]/65 backdrop-blur-[16px] rounded-[20px] p-3.5 border-[1.5px] border-white/15 text-center shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-white cursor-pointer shrink-0"
              title={isSaved ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={20} fill={isSaved ? "var(--primary)" : "none"} stroke={isSaved ? "var(--primary)" : "currentColor"} />
            </button>
            <div className="bg-[#0a0a0e]/65 backdrop-blur-[16px] rounded-[20px] py-3.5 px-[22px] border-[1.5px] border-white/15 text-center shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-1 justify-center">
                <Star size={16} fill="#ffc83b" stroke="#ffc83b" />
                <strong className="text-[20px] text-white font-medium">{restaurant.rating.toFixed(1)}</strong>
              </div>
              <span className="text-[11px] text-white/60 uppercase font-normal tracking-[0.05em]">Rating</span>
            </div>
            <div className="bg-[#0a0a0e]/65 backdrop-blur-[16px] rounded-[20px] py-3.5 px-[22px] border-[1.5px] border-white/15 text-center shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              <div className="text-white text-[20px] font-medium">{restaurant.deliveryTime}m</div>
              <span className="text-[11px] text-white/60 uppercase font-normal tracking-[0.05em]">Delivery</span>
            </div>
          </div>
        </div>
      </motion.div>

      {isClosed && (
        <div className="glass-panel border-red-500/30 bg-red-500/10 p-4 rounded-[20px] mb-6 flex items-center gap-3 text-left relative overflow-hidden animate-fade-in">
          <div className="noise-overlay" />
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <h4 className="text-[14px] font-bold text-text-primary">Kitchen Currently Closed</h4>
            <p className="text-[12.5px] text-text-secondary leading-relaxed">This restaurant is not currently accepting delivery orders. You can browse their menu, but checkout is disabled.</p>
          </div>
        </div>
      )}

      {isOutOfRegion && (
        <div className="glass-panel border-[#ff6a4d]/30 bg-[#ff6a4d]/10 p-4 rounded-[20px] mb-6 flex items-center gap-3 text-left relative overflow-hidden animate-fade-in">
          <div className="noise-overlay" />
          <AlertTriangle className="text-primary shrink-0" size={20} />
          <div>
            <h4 className="text-[14px] font-bold text-text-primary">Outside Active Delivery Zone</h4>
            <p className="text-[12.5px] text-text-secondary leading-relaxed">This restaurant is located in {restaurant.city}. You can browse their menu, but ordering is restricted to your selected region ({activeCity}).</p>
          </div>
        </div>
      )}

      {isOwnRestaurant && (
        <div className="glass-panel border-[#d9a752]/40 bg-[#d9a752]/10 p-4 rounded-[20px] mb-6 flex items-center gap-3 text-left relative overflow-hidden animate-fade-in">
          <div className="noise-overlay" />
          <ShieldCheck className="text-[#d9a752] shrink-0" size={20} />
          <div>
            <h4 className="text-[14px] font-bold text-[#d9a752]">Merchant Simulation Mode</h4>
            <p className="text-[12.5px] text-text-secondary leading-relaxed">You are viewing your own kitchen profile. You can place simulated orders to test the checkout flow, cooking timers, and delivery dashboard live without processing real payments.</p>
          </div>
        </div>
      )}

      {/* CATEGORY SELECTOR TABS */}
      <div className="flex gap-2.5 overflow-x-auto py-2 px-0 pb-4 border-b-[1.5px] border-[var(--border-light)] mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`chip ${activeCategory === cat ? 'active' : ''} text-[13.5px] font-bold`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAIN MENU CONTENT GRID */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8"
        style={{ alignItems: 'start' }}
      >
        {/* Dishes Menu Column */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMenu.length > 0 ? (
              filteredMenu.map((item, index) => {
                const inCartItem = cartItems.find((ci) => ci.foodItem === item._id);
                const isAvailable = item.isAvailable;

                return (
                  <motion.div 
                    key={item._id} 
                    layout
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, borderColor: 'var(--border-glow)' }}
                    className={`glass-card grid grid-cols-[1fr_150px] gap-6 p-[26px] rounded-[28px] border-[1.5px] border-[var(--border-light)] shadow-[var(--shadow-ambient)] relative ${
                      isAvailable ? 'opacity-100' : 'opacity-[0.62]'
                    }`}
                  >
                    <div className="noise-overlay" />

                    {/* Left Metadata details */}
                    <div className="text-left flex flex-col justify-between relative z-[5]">
                      <div>
                        <span className="text-[var(--primary)] text-[12px] font-medium uppercase tracking-[0.06em]">
                          {item.category}
                        </span>
                        <h3 className="text-[21px] my-1 mb-2.5 font-normal">{item.name}</h3>
                        <p className="text-[14px] text-[var(--text-secondary)] leading-[1.55] mb-5">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-[18px]">
                        <span className="text-[23px] font-medium text-[var(--text-primary)] tracking-[-0.02em]">
                          {formatPrice(item.price)}
                        </span>
                        
                        {isAvailable ? (
                          <div className="flex items-center gap-2">
                            {isOutOfRegion ? (
                              <button 
                                disabled 
                                className="btn bg-[var(--surface-bright)] text-[var(--text-muted)] cursor-not-allowed border-none rounded-full px-[18px] py-[9px] text-[13.5px] font-bold opacity-60"
                              >
                                Unavailable in {activeCity}
                              </button>
                            ) : isClosed ? (
                              <button 
                                disabled 
                                className="btn bg-[var(--surface-bright)] text-[var(--text-muted)] cursor-not-allowed border-none rounded-full px-[18px] py-[9px] text-[13.5px] font-bold opacity-60"
                              >
                                Kitchen Closed
                              </button>
                            ) : (
                              <>
                                <motion.button 
                                  whileHover={{ scale: 1.03, y: -1 }}
                                  whileTap={{ scale: 0.92 }}
                                  onClick={(e) => handleAddItem(item, e)}
                                  className={`btn rounded-full px-[18px] py-[9px] text-[13.5px] font-medium transition-all duration-300 w-[148px] shrink-0 select-none cursor-pointer flex items-center justify-center gap-1.5 will-change-[transform,background-color,shadow] transform-gpu ${
                                    addedItems[item._id] 
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-[0_4px_12px_rgba(16,185,129,0.25)]' 
                                      : 'btn-primary btn-pill text-white'
                                  }`}
                                >
                                  <AnimatePresence mode="wait">
                                    <motion.span
                                      key={addedItems[item._id] ? 'added' : 'normal'}
                                      initial={{ y: 8, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -8, opacity: 0 }}
                                      transition={{ duration: 0.16, ease: "easeInOut" }}
                                      className="flex items-center justify-center gap-1 w-full will-change-transform transform-gpu"
                                    >
                                      {addedItems[item._id] ? (
                                        <>
                                          <Check size={14} />
                                          <span>Added!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={14} />
                                          <span>{isOwnRestaurant ? 'Simulate Order' : 'Add To Order'}</span>
                                        </>
                                      )}
                                    </motion.span>
                                  </AnimatePresence>
                                </motion.button>

                                {inCartItem && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-[11px] bg-[var(--surface-bright)] px-3.5 py-1.5 rounded-[20px] border-[1.5px] border-[var(--border-light)]"
                                  >
                                    <button 
                                      onClick={() => removeFromCart(item._id)} 
                                      className="bg-none border-none text-[var(--text-primary)] cursor-pointer flex"
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <strong className="text-[14.5px]">{inCartItem.quantity}</strong>
                                    <button 
                                      onClick={(e) => handleAddItem(item, e)} 
                                      className="bg-none border-none text-[var(--text-primary)] cursor-pointer flex"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </motion.div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span 
                            className="bg-[var(--surface-bright)] text-[var(--text-muted)] px-4 py-1.5 rounded-[10px] text-[12px] font-medium uppercase tracking-[0.05em]"
                          >
                            SOLD OUT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Image */}
                    <div className="h-[150px] rounded-[20px] overflow-hidden relative border border-[var(--border-light)]">
                      <SafeImage 
                        src={resolveMediaUrl(item.image)} 
                        alt={item.name}
                        className="w-full h-full"
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="glass-primary flex-center h-[140px] text-[var(--text-secondary)]">
                <div className="noise-overlay" />
                No dishes found under this category.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column wrapper to let aside align and stick perfectly beneath the category line */}
        <div className="self-stretch">
          {/* 🛍️ STICKY ORDER DRAWER COLUMN (Spring Slide-in enabled!) */}
          <aside 
            className="glass-primary p-[30px] text-left sticky-cart shadow-[var(--shadow-glow)] border-[1.5px] border-[var(--border-glow)]"
          >
            <div className="noise-overlay" />

            <div className="flex items-center gap-2 mb-[22px] border-b border-[var(--border-light)] pb-3.5 relative z-[5]">
              <ShoppingBag size={18} className="text-[var(--primary)]" />
              <h3 className="text-[19px] font-normal tracking-[0.01em]">Your Order</h3>
            </div>

            <AnimatePresence mode="wait">
              {cartItems.length > 0 ? (
                <motion.div
                  key="cart-active"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="relative z-[5]"
                >
                  {/* Items List */}
                  <div className="flex flex-col gap-4 mb-6 max-h-[250px] overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.foodItem} className="flex justify-between text-[14.5px] items-center">
                        <div className="flex-1">
                          <div className="font-normal text-[var(--text-primary)]">{item.name}</div>
                          <div className="text-[var(--text-muted)] text-[12px] mt-0.5 font-normal">
                            {item.quantity} x {formatPrice(item.price)}
                          </div>
                        </div>
                        <strong className="ml-3 text-[var(--text-primary)]">
                          {formatPrice(item.price * item.quantity)}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Running Total */}
                  <div className="border-t border-dashed border-[var(--border-light)] pt-4 flex justify-between text-[17px] font-normal mb-6">
                    <span>Subtotal:</span>
                    <span className="text-[var(--primary)] text-[18px] font-medium">{formatPrice(total)}</span>
                  </div>

                  <motion.button 
                    whileHover={isOutOfRegion || isClosed ? {} : { scale: 1.02 }}
                    whileTap={isOutOfRegion || isClosed ? {} : { scale: 0.98 }}
                    onClick={isOutOfRegion || isClosed ? null : () => navigate('/checkout')}
                    disabled={isOutOfRegion || isClosed}
                    className={`btn w-full p-3.5 rounded-[14px] font-medium transition-all ${
                      isOutOfRegion || isClosed
                        ? 'bg-[var(--surface-bright)] text-[var(--text-muted)] cursor-not-allowed opacity-60 border-none'
                        : 'btn-primary cursor-pointer'
                    }`}
                  >
                    {isOutOfRegion ? 'Outside Active Zone' : isClosed ? 'Kitchen Closed' : isOwnRestaurant ? 'Simulate Checkout' : 'Proceed To Checkout'}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  key="cart-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-[30px] text-[var(--text-secondary)] relative z-[5]"
                >
                  <p className="text-[14.5px] leading-[1.6] font-medium">
                    Your order is currently empty. Add delicious dishes to get started!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>

      {/* ⚠️ CROSS-RESTAURANT BLOCK MODAL (Physical exit animation resolved!) */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex-center fixed inset-0 bg-[#050508]/78 backdrop-blur-[12px] z-[1000]"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="glass-floating max-w-[450px] p-9 rounded-[28px] border-[1.5px] border-[var(--primary)] text-center mx-6 shadow-[var(--shadow-floating),_0_0_50px_rgba(255,107,53,0.2)]"
            >
              <div className="noise-overlay" />
              
              <AlertTriangle size={52} className="text-[var(--primary)] mb-[18px] filter drop-shadow-[0_4px_10px_rgba(255,107,53,0.3)]" />
              <h3 className="text-[23px] mb-3.5 font-light tracking-[0.01em]">
                Clear Cart and Order Here?
              </h3>
              <p className="text-[var(--text-secondary)] text-[14.5px] leading-[1.6] mb-7 font-medium">
                {crossRestError}
              </p>

              <div className="flex gap-3.5 relative z-10">
                <button 
                  onClick={handleConfirmClearCart} 
                  className="btn btn-primary flex-1 p-3.25 rounded-[12px] font-bold"
                >
                  Yes, Empty & Add
                </button>
                <button 
                  onClick={() => {
                    setShowClearConfirm(false);
                    // Defer clearing the pending item to allow immediate close of the modal
                    setTimeout(() => {
                      setPendingItem(null);
                    }, 50);
                  }} 
                  className="btn btn-secondary flex-1 p-3.25 rounded-[12px] font-bold border border-[var(--border-light)]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
