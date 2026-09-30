import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, MapPin, CreditCard, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, QrCode, Minus, Plus, Trash2 } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { LocationContext } from '../context/LocationContext';
import { AuthContext } from '../context/AuthContext';
import { OrderContext } from '../context/OrderContext';
import { usePolling } from '../hooks/usePolling';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';

// Premium simulated interactive delivery tracking map
function DeliveryMapSimulator({ orderId, onDeliveryComplete }) {
  const progressKey = `delivery_progress_${orderId}`;
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(progressKey);
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    if (progress >= 100) {
      onDeliveryComplete();
      localStorage.removeItem(progressKey);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1, 100);
        localStorage.setItem(progressKey, next.toString());
        return next;
      });
    }, 400); // 100 * 400ms = 40 seconds

    return () => clearInterval(timer);
  }, [progress, orderId, onDeliveryComplete]);

  // Compute current position along 5 straight segments
  const getCoordinatesAtProgress = (p) => {
    const total = 460;
    const d = (p / 100) * total;
    
    if (d <= 70) {
      const ratio = d / 70;
      return { x: 50 + ratio * 70, y: 150, angle: 0 };
    } else if (d <= 160) {
      const ratio = (d - 70) / 90;
      return { x: 120, y: 150 - ratio * 90, angle: -90 };
    } else if (d <= 300) {
      const ratio = (d - 160) / 140;
      return { x: 120 + ratio * 140, y: 60, angle: 0 };
    } else if (d <= 370) {
      const ratio = (d - 300) / 70;
      return { x: 260, y: 60 + ratio * 70, angle: 90 };
    } else {
      const ratio = (d - 370) / 90;
      return { x: 260 + ratio * 90, y: 130, angle: 0 };
    }
  };

  const { x, y, angle } = getCoordinatesAtProgress(progress);
  const remainingSeconds = Math.max(0, Math.ceil((100 - progress) * 0.4));
  const remainingMeters = Math.max(0, Math.ceil((100 - progress) * 8.5));

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mb-6 text-left select-none relative overflow-hidden backdrop-blur-md">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary">Simulated Live Delivery Router</h4>
          <p className="text-[12px] text-text-secondary">GPS Transit tracking (3PL Webhook simulator)</p>
        </div>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {progress}% Completed
        </span>
      </div>

      {/* Map Board */}
      <div className="w-full h-48 bg-background-primary border border-white/[0.04] rounded-xl relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <radialGradient id="rest-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="home-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Dotted Delivery Route */}
          <path 
            d="M 50 150 L 120 150 L 120 60 L 260 60 L 260 130 L 350 130" 
            fill="none" 
            stroke="var(--border-light)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeDasharray="4,5"
          />

          {/* Active Visited Route (Solid Coral line) */}
          <path 
            d="M 50 150 L 120 150 L 120 60 L 260 60 L 260 130 L 350 130" 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeDasharray="460"
            strokeDashoffset={460 - (progress / 100) * 460}
            style={{ transition: 'stroke-dashoffset 400ms linear' }}
          />

          {/* Landmarks / Blocks */}
          <rect x="150" y="90" width="80" height="30" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
          <text x="190" y="108" textAnchor="middle" className="text-[8px] fill-text-muted font-semibold">City Block A</text>

          <rect x="290" y="25" width="60" height="25" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
          <text x="320" y="40" textAnchor="middle" className="text-[8px] fill-text-muted font-semibold">Central Park</text>

          {/* Restaurant Marker (Start) */}
          <circle cx="50" cy="150" r="16" fill="url(#rest-glow)" />
          <circle cx="50" cy="150" r="5" fill="var(--primary)" />
          <text x="50" y="174" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Kitchen</text>

          {/* Home Marker (End) */}
          <circle cx="350" cy="130" r="16" fill="url(#home-glow)" />
          <circle cx="350" cy="130" r="5" fill="var(--accent)" />
          <text x="350" y="154" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Customer</text>

          {/* Moving Delivery Rider */}
          <g transform={`translate(${x}, ${y}) rotate(${angle})`} style={{ transition: 'transform 400ms linear' }}>
            {/* Pulsing Aura */}
            <circle cx="0" cy="0" r="10" fill="var(--primary)" className="animate-ping" style={{ opacity: 0.15 }} />
            <circle cx="0" cy="0" r="8" fill="var(--primary)" />
            {/* Mini Bike icon (facing right relative to group rotation) */}
            <g transform="translate(-5, -5) scale(0.45)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="18.5" cy="17.5" r="2.5"/>
                <path d="M3 6h5l3 7h6l3-7"/>
                <path d="M12 6.5L9.5 10"/>
              </svg>
            </g>
          </g>
        </svg>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mt-3 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 text-center">
        <div>
          <span className="text-[10px] text-text-muted block font-semibold uppercase tracking-wider">Remaining</span>
          <span className="text-[13px] font-bold text-text-primary">{remainingSeconds} sec</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block font-semibold uppercase tracking-wider">Distance</span>
          <span className="text-[13px] font-bold text-text-primary">{remainingMeters} meters</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block font-semibold uppercase tracking-wider">Rider Status</span>
          <span className="text-[13px] font-bold text-[var(--accent)]">In Transit</span>
        </div>
      </div>
    </div>
  );
}

const CITY_PINCODE_PREFIXES = {
  mumbai: ['400'],
  bombay: ['400'],
  delhi: ['11'],
  'new delhi': ['11'],
  bengaluru: ['560'],
  bangalore: ['560'],
  hyderabad: ['500'],
  secunderabad: ['500'],
  chennai: ['600'],
  madras: ['600'],
  kolkata: ['700'],
  calcutta: ['700'],
  pune: ['411', '412'],
  ahmedabad: ['380', '382'],
  jaipur: ['302'],
  chandigarh: ['160'],
  goa: ['403'],
  kochi: ['682'],
  cochin: ['682'],
  lucknow: ['226'],
  indore: ['452'],
  surat: ['395']
};

const getCityAliases = (city) => {
  if (!city) return [];
  const c = city.toLowerCase().trim();
  if (c === 'bengaluru' || c === 'bangalore') {
    return ['bengaluru', 'bangalore'];
  }
  if (c === 'mumbai' || c === 'bombay') {
    return ['mumbai', 'bombay'];
  }
  if (c === 'delhi' || c === 'new delhi') {
    return ['delhi', 'new delhi'];
  }
  if (c === 'kolkata' || c === 'calcutta') {
    return ['kolkata', 'calcutta'];
  }
  if (c === 'chennai' || c === 'madras') {
    return ['chennai', 'madras'];
  }
  if (c === 'hyderabad' || c === 'secunderabad') {
    return ['hyderabad', 'secunderabad'];
  }
  if (c === 'kochi' || c === 'cochin') {
    return ['kochi', 'cochin'];
  }
  return [c];
};

const getCityPrefixes = (city) => {
  if (!city) return null;
  const aliases = getCityAliases(city);
  for (const alias of aliases) {
    if (CITY_PINCODE_PREFIXES[alias]) {
      return CITY_PINCODE_PREFIXES[alias];
    }
  }
  return null;
};

const isPincodeValidForCity = (pin, city) => {
  if (!pin || !city) return false;
  const prefixes = getCityPrefixes(city);
  if (!prefixes) return true;
  
  const cleanPin = pin.trim();
  if (cleanPin.length !== 6 || isNaN(cleanPin)) return false;
  
  return prefixes.some(pref => cleanPin.startsWith(pref));
};

const isAddressMatchingCity = (addressStr, city) => {
  if (!addressStr || !city) return false;
  const addr = addressStr.toLowerCase().trim();
  const aliases = getCityAliases(city);
  return aliases.some(alias => addr.includes(alias));
};

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, restaurant, subtotal, deliveryFee, tax, total, deleteItemRow, removeFromCart, addToCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { placeOrder, activeOrder, getOrderDetails, setActiveOrder, updateOrderStatus } = useContext(OrderContext);
  const { activeCity, savedAddresses, addSavedAddress } = useContext(LocationContext);
  const isOwnRestaurant = isAuthenticated && user && restaurant && (restaurant.owner === user._id || restaurant.owner?._id === user._id);
  const isOutOfRegion = restaurant && activeCity && restaurant.city && restaurant.city.toLowerCase().trim() !== activeCity.toLowerCase().trim() && !isOwnRestaurant;

  const [step, setStep] = useState(1); // Stepper: 1 - Cart Review, 2 - Delivery, 3 - Payment/Status
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(isOwnRestaurant ? 'SIMULATED' : 'COD'); // COD or CARD or SIMULATED
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Prefill address based on restaurant city matching
  useEffect(() => {
    if (!restaurant) return;

    // 0. If in Merchant Simulation mode, prefill test address and matching pincode automatically
    if (isOwnRestaurant) {
      setAddress(`[Simulation] Owner Kitchen HQ, ${restaurant.city}`);
      const prefixes = getCityPrefixes(restaurant.city);
      const prefix = (prefixes && prefixes[0]) || '560';
      setPincode(prefix.padEnd(6, '0'));
      return;
    }

    // 1. Check for default saved address matching the restaurant's city
    const matchedDefault = savedAddresses.find(
      (addr) => addr.isDefault && addr.city && addr.city.toLowerCase().trim() === restaurant.city.toLowerCase().trim()
    );

    if (matchedDefault) {
      const formatted = [
        matchedDefault.houseNumber,
        matchedDefault.street,
        matchedDefault.area,
        matchedDefault.landmark ? `(Near ${matchedDefault.landmark})` : '',
        matchedDefault.state
      ].filter(Boolean).join(', ');
      setAddress(formatted);
      setPincode(matchedDefault.pincode || '');
      return;
    }

    // 2. Check for any saved address matching the restaurant's city
    const matchedAny = savedAddresses.find(
      (addr) => addr.city && addr.city.toLowerCase().trim() === restaurant.city.toLowerCase().trim()
    );

    if (matchedAny) {
      const formatted = [
        matchedAny.houseNumber,
        matchedAny.street,
        matchedAny.area,
        matchedAny.landmark ? `(Near ${matchedAny.landmark})` : '',
        matchedAny.state
      ].filter(Boolean).join(', ');
      setAddress(formatted);
      setPincode(matchedAny.pincode || '');
      return;
    }

    // 3. Fallback to profile user.address if it contains the city name
    if (user && user.address && isAddressMatchingCity(user.address, restaurant.city)) {
      setAddress(user.address);
      const pins = user.address.match(/\b\d{6}\b/);
      setPincode(pins ? pins[0] : '');
      return;
    }

    // 4. Default to empty if no city match
    setAddress('');
    setPincode('');
  }, [user, savedAddresses, restaurant, isOwnRestaurant]);

  // Handle Merchant Simulation payment method lock
  useEffect(() => {
    if (isOwnRestaurant) {
      setPaymentMethod('SIMULATED');
    }
  }, [isOwnRestaurant]);

  // Status Polling for the successfully placed COD order (every 5 seconds)
  // Active only if successOrder is placed and has a status to track
  usePolling(
    async () => {
      if (successOrder && successOrder._id) {
        try {
          const updated = await getOrderDetails(successOrder._id);
          setSuccessOrder(updated);
        } catch (err) {
          console.warn('Status polling tick failed:', err.message);
        }
      }
    },
    5000,
    !!successOrder && successOrder.status !== 'delivered' && successOrder.status !== 'cancelled'
  );

  // Restore step and successOrder if activeOrder or location state (redirect from payment) is present
  useEffect(() => {
    // If user just cancelled card payment, clear stale state and stay at Step 1
    if (location.state?.fromPaymentCancel) {
      setActiveOrder(null);
      window.history.replaceState({}, document.title);
      return;
    }

    const orderId = location.state?.orderId || activeOrder?._id;
    if (orderId) {
      const fetchAndRestore = async () => {
        try {
          const ord = await getOrderDetails(orderId);
          // Only restore to Step 3 if the order is genuinely successful:
          // - For CARD payments: only if paymentStatus is 'paid'
          // - For COD/SIMULATED: always valid if order exists and isn't cancelled
          const isCardPending = ord.paymentMethod === 'CARD' && ord.paymentStatus !== 'paid';
          const isCancelled = ord.status === 'cancelled';
          if (!isCardPending && !isCancelled) {
            setSuccessOrder(ord);
            setStep(3);
          } else {
            // Stale/cancelled/unpaid order — don't restore, clear context
            setActiveOrder(null);
          }
        } catch (err) {
          console.warn('Failed to load redirect order details:', err.message);
        }
      };
      fetchAndRestore();
      // Clear location state to prevent re-triggering on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, activeOrder, getOrderDetails]);

  const handlePlaceOrderSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please specify a delivery address.');
      return;
    }

    if (!pincode.trim() || pincode.trim().length !== 6 || isNaN(pincode.trim())) {
      setErrorMsg('Please specify a valid 6-digit pincode.');
      return;
    }

    if (restaurant && restaurant.city && !isPincodeValidForCity(pincode, restaurant.city)) {
      setErrorMsg(`Your delivery pincode (${pincode}) does not match the restaurant's operating city (${restaurant.city}).`);
      return;
    }

    setIsPlacing(true);
    setErrorMsg('');

    // Optionally save address to profile if checked
    if (saveAddressToProfile) {
      try {
        const stateFallback = {
          mumbai: 'Maharashtra',
          bombay: 'Maharashtra',
          delhi: 'Delhi',
          'new delhi': 'Delhi',
          bengaluru: 'Karnataka',
          bangalore: 'Karnataka',
          hyderabad: 'Telangana',
          secunderabad: 'Telangana',
          chennai: 'Tamil Nadu',
          madras: 'Tamil Nadu',
          kolkata: 'West Bengal',
          calcutta: 'West Bengal',
          pune: 'Maharashtra',
          ahmedabad: 'Gujarat',
          jaipur: 'Rajasthan',
          chandigarh: 'Chandigarh',
          goa: 'Goa',
          kochi: 'Kerala',
          cochin: 'Kerala',
          lucknow: 'Uttar Pradesh',
          indore: 'Madhya Pradesh',
          surat: 'Gujarat'
        };
        const normalizedCity = restaurant.city ? restaurant.city.toLowerCase().trim() : '';
        const detectedState = stateFallback[normalizedCity] || 'India';

        await addSavedAddress({
          houseNumber: '',
          street: address.trim(),
          area: restaurant.locality || '',
          landmark: '',
          city: restaurant.city || activeCity,
          state: detectedState,
          pincode: pincode.trim(),
          addressType: 'Home',
          isDefault: false
        });
      } catch (saveErr) {
        console.warn('Failed to save address to profile:', saveErr.message);
      }
    }

    const transactionId = paymentMethod === 'CARD' 
      ? `pi_mock_${Date.now()}` 
      : paymentMethod === 'UPI' 
      ? `upi_mock_${Date.now()}` 
      : undefined;

    const orderPayload = {
      restaurant: restaurant._id,
      items: cartItems.map((item) => ({
        foodItem: item.foodItem,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod,
      deliveryAddress: `${address.trim()} - ${pincode.trim()}`,
      transactionId,
    };

    try {
      const placed = await placeOrder(orderPayload);
      if (paymentMethod === 'CARD' || paymentMethod === 'UPI') {
        // Redirect to Payment Gateway passing transactionId / client secret mock details
        navigate('/payment-gateway', { 
          state: { 
            orderId: placed._id,
            total,
            transactionId,
            paymentMethod
          } 
        });
      } else {
        // Cash on Delivery triggers success order tracking immediately
        setSuccessOrder(placed);
        setStep(3); // Go to Status tracking step
      }
    } catch (err) {
      setErrorMsg(err.message || 'Order submission failed, please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleResetCheckout = () => {
    setSuccessOrder(null);
    setActiveOrder(null);
    setStep(1);
    navigate('/');
  };

  const getStepHeaderClass = (targetStep) => {
    const colorClass = step === targetStep 
      ? 'text-primary' 
      : step > targetStep 
      ? 'text-[var(--accent)]' 
      : 'text-text-muted';
    return `flex items-center gap-2 font-bold text-[15px] ${colorClass}`;
  };

  const userDefaultAddressCity = user?.address ? (
    Object.keys(CITY_PINCODE_PREFIXES).find(c => user.address.toLowerCase().includes(c))
  ) : null;

  const hasCityMismatch = restaurant && restaurant.city && userDefaultAddressCity && 
    !isAddressMatchingCity(user.address, restaurant.city);

  const isAlreadySaved = savedAddresses.some(addr => {
    const formatted = [
      addr.houseNumber,
      addr.street,
      addr.area,
      addr.landmark ? `(Near ${addr.landmark})` : '',
      addr.state
    ].filter(Boolean).join(', ').trim();
    
    return address.trim() === formatted && pincode.trim() === addr.pincode.trim();
  });

  return (
    <div className="container fade-in px-6 text-left" style={{ marginTop: '-6.5rem', paddingTop: '0.5rem', paddingBottom: '6rem', minHeight: 'calc(100vh - 320px)' }}>
      
      {/* Checkout Stepper Header */}
      <div className="glass-panel flex justify-between py-4 px-8 rounded-[16px] mb-8 items-center">
        <div className={getStepHeaderClass(1)}>
          <span className={`w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[11px] text-white ${step === 1 ? 'bg-primary' : 'bg-[var(--accent)]'}`}>1</span>
          Review Items
        </div>
        <ChevronRight size={16} className="text-text-muted" />
        <div className={getStepHeaderClass(2)}>
          <span className={`w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[11px] text-white ${step === 2 ? 'bg-primary' : step > 2 ? 'bg-[var(--accent)]' : 'bg-text-muted'}`}>2</span>
          Delivery & Payment
        </div>
        <ChevronRight size={16} className="text-text-muted" />
        <div className={getStepHeaderClass(3)}>
          <span className={`w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[11px] text-white ${step === 3 ? 'bg-primary' : 'bg-text-muted'}`}>3</span>
          Live Tracker
        </div>
      </div>

      {/* ERROR MSG BANNER */}
      {errorMsg && (
        <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error)] text-[var(--error)] rounded-[8px] py-3 px-4 flex items-center gap-2.5 mb-6 text-[14px]">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: CART REVIEW */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          {/* Cart Items List */}
          <div className="glass-panel p-8">
            <h3 className="text-[22px] mb-6 flex items-center gap-2.5">
              <ShoppingBag size={20} className="text-primary" />
              Shopping Cart Items
            </h3>

            {hasCityMismatch && !isOutOfRegion && (
              <div className="bg-[rgba(217,167,82,0.1)] border border-[#d9a752]/40 text-[#d9a752] rounded-[12px] py-4 px-5 flex items-start gap-3 mb-6 text-[14px] relative overflow-hidden backdrop-blur-md">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[15px] font-bold mb-1 text-[#d9a752]">Delivery City Mismatch Notice</strong>
                  <span className="leading-relaxed text-text-secondary">
                    Your default profile address is in <strong>{userDefaultAddressCity.charAt(0).toUpperCase() + userDefaultAddressCity.slice(1)}</strong>, but you are ordering from a restaurant in <strong>{restaurant.city}</strong>. You will need to specify a valid {restaurant.city} address and pincode in the next step.
                  </span>
                </div>
              </div>
            )}

            {isOutOfRegion && (
              <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error)] text-[var(--error)] rounded-[8px] py-3 px-4 flex items-center gap-2.5 mb-6 text-[14px] animate-pulse">
                <AlertCircle size={16} className="shrink-0" />
                <span>The restaurant ({restaurant.name}) is outside your current delivery region ({activeCity}). Please change your location or clear your cart to proceed.</span>
              </div>
            )}

            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-5">
                {cartItems.map((item) => (
                  <div 
                    key={item.foodItem} 
                    className="grid grid-cols-[80px_1fr_auto] gap-5 items-center border-b border-[var(--border-light)] pb-5"
                  >
                    <SafeImage 
                      src={resolveMediaUrl(item.image)} 
                      alt={item.name} 
                      className="w-20 h-15 object-cover rounded-[8px]"
                    />
                    <div>
                      <h4 className="text-[16px] font-semibold">{item.name}</h4>
                      <p className="text-[13px] text-text-muted mt-1">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <strong className="text-[16px]">
                        {formatPrice(item.price * item.quantity)}
                      </strong>
                      <div className="flex items-center gap-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-0 border border-[var(--border-light)] rounded-xl overflow-hidden">
                          <button
                            onClick={() => removeFromCart(item.foodItem)}
                            className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-white/[0.06] text-text-secondary hover:text-primary transition-colors cursor-pointer border-none"
                            title="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-[13px] font-bold text-text-primary select-none border-x border-[var(--border-light)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart({ _id: item.foodItem, name: item.name, price: item.price, image: item.image }, restaurant, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-white/[0.06] text-text-secondary hover:text-primary transition-colors cursor-pointer border-none"
                            title="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        {/* Delete entire row */}
                        <button 
                          onClick={() => deleteItemRow(item.foodItem)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors cursor-pointer border border-[var(--border-light)]"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-right mt-4">
                  <button 
                    onClick={isOutOfRegion ? null : () => setStep(2)} 
                    disabled={isOutOfRegion}
                    className={`btn ${isOutOfRegion ? 'bg-[var(--surface-bright)] text-[var(--text-muted)] cursor-not-allowed opacity-60 border-none' : 'btn-primary'}`}
                  >
                    Next Step: Address & Pay
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-0 text-text-secondary">
                <p className="text-[15px]">Your cart is empty. Add menu items from menu details page first.</p>
                <button onClick={() => navigate('/discover')} className="btn btn-secondary btn-pill mt-4">
                  Browse Kitchens
                </button>
              </div>
            )}
          </div>

          {/* Pricing breakdown summary */}
          <aside className="glass-panel p-7">
            <h3 className="text-[18px] mb-5 border-b border-[var(--border-light)] pb-3">
              Order Breakdown
            </h3>
            {restaurant && (
              <div className="text-[13px] text-text-secondary mb-4">
                Ordering from: <strong>{restaurant.name}</strong>
              </div>
            )}
            <div className="flex flex-col gap-3 text-[14px] mb-5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10% VAT):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-light)] pt-3 font-bold text-[16px] text-text-primary">
                <span>Grand Total:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 2: ADDRESS & PAYMENT DETAILS */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
          
          <div className="glass-panel p-8">
            <h3 className="text-[22px] mb-6 flex items-center gap-2.5">
              <MapPin size={20} className="text-primary" />
              Delivery Details
            </h3>

            {/* Matching Saved Addresses */}
            {restaurant && savedAddresses.filter(addr => addr.city && addr.city.toLowerCase().trim() === restaurant.city.toLowerCase().trim()).length > 0 && (
              <div className="mb-6">
                <span className="block text-[13px] font-semibold text-text-secondary mb-3">
                  Saved Addresses in {restaurant.city}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses
                    .filter(addr => addr.city && addr.city.toLowerCase().trim() === restaurant.city.toLowerCase().trim())
                    .map((addr) => {
                      const formatted = [
                        addr.houseNumber,
                        addr.street,
                        addr.area,
                        addr.landmark ? `(Near ${addr.landmark})` : '',
                        addr.state
                      ].filter(Boolean).join(', ');
                      
                      const isSelected = address.trim() === formatted.trim() && pincode.trim() === addr.pincode.trim();
                      
                      return (
                        <div 
                          key={addr._id}
                          onClick={() => {
                            setAddress(formatted);
                            setPincode(addr.pincode || '');
                          }}
                          className={`glass-card p-4 rounded-xl cursor-pointer border-[1.5px] text-left transition-all duration-200 ${
                            isSelected 
                              ? '!border-primary !shadow-[var(--shadow-glow)] bg-primary/5' 
                              : '!border-[var(--border-light)] hover:border-primary/45 bg-white/[0.01]'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {addr.addressType || 'Home'} {addr.isDefault && '(Default)'}
                          </span>
                          <p className="text-[13px] font-semibold text-text-primary mt-1 truncate">
                            {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5 truncate">
                            {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Address & Pincode Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 mb-4">
              <div>
                <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                  Delivery Address
                </label>
                <textarea 
                  className="glass-input resize-none rounded-[12px] w-full" 
                  rows="3"
                  placeholder="Specify street address, apartment, building number..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                  6-Digit Pincode
                </label>
                <input 
                  type="text"
                  maxLength="6"
                  className="glass-input rounded-[12px] w-full h-[76px] text-[18px] text-center tracking-widest font-mono" 
                  placeholder="560034"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* Save Address Checkbox */}
            {isAuthenticated && !isAlreadySaved && (
              <div className="flex items-center gap-2 mb-8 select-none">
                <input 
                  type="checkbox"
                  id="saveAddressCheckbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="saveAddressCheckbox" className="text-[13px] text-text-secondary cursor-pointer">
                  Save this address to my profile for future orders
                </label>
              </div>
            )}

            {isOwnRestaurant && (
              <div className="glass-panel border-[#d9a752]/40 bg-[#d9a752]/10 p-4 rounded-[20px] mb-6 flex items-center gap-3 text-left relative overflow-hidden animate-fade-in">
                <div className="noise-overlay" />
                <ShieldCheck className="text-[#d9a752] shrink-0" size={20} />
                <div>
                  <h4 className="text-[14px] font-bold text-[#d9a752]">Merchant Simulation Mode</h4>
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">
                    Placing a simulated order at your own kitchen. This allows you to test checkout, receipts, status tracking, and merchant alerts end-to-end.
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-[22px] mb-6 flex items-center gap-2.5">
              <CreditCard size={20} className="text-[var(--accent)]" />
              Payment Methods
            </h3>

            {/* Payment selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {isOwnRestaurant ? (
                <div 
                  className="glass-card flex-center flex-col gap-3 p-6 border-primary shadow-[var(--shadow-glow)] border-[1.5px] cursor-default w-full col-span-2"
                >
                  <ShieldCheck size={28} className="text-[#d9a752]" />
                  <div className="font-extrabold text-[18px] text-[#d9a752]">Merchant Simulation (Free)</div>
                  <div className="text-[13px] text-text-secondary">Fully functional order simulation. No payment required.</div>
                </div>
              ) : (
                <>
                  <div 
                    className={`glass-card flex-center flex-col gap-3 p-6 cursor-pointer border-[1.5px] transition-all duration-200 ${
                      paymentMethod === 'COD' 
                        ? '!border-primary !shadow-[var(--shadow-glow)] bg-primary/5' 
                        : '!border-[var(--border-light)] shadow-none bg-white/[0.01]'
                    }`}
                    onClick={() => setPaymentMethod('COD')}
                  >
                    <div className="font-extrabold text-[18px] text-primary">COD</div>
                    <div className="text-[13px] text-text-secondary">Cash On Delivery</div>
                  </div>

                  <div 
                    className={`glass-card flex-center flex-col gap-3 p-6 cursor-pointer border-[1.5px] transition-all duration-200 ${
                      paymentMethod === 'CARD' 
                        ? '!border-primary !shadow-[var(--shadow-glow)] bg-primary/5' 
                        : '!border-[var(--border-light)] shadow-none bg-white/[0.01]'
                    }`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={28} className="text-[var(--accent)]" />
                    <div className="text-[13px] text-text-secondary">Credit Card (Stripe)</div>
                  </div>

                  <div 
                    className={`glass-card flex-center flex-col gap-3 p-6 cursor-pointer border-[1.5px] transition-all duration-200 ${
                      paymentMethod === 'UPI' 
                        ? '!border-primary !shadow-[var(--shadow-glow)] bg-primary/5' 
                        : '!border-[var(--border-light)] shadow-none bg-white/[0.01]'
                    }`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    <QrCode size={28} className="text-[var(--accent)]" />
                    <div className="text-[13px] text-text-secondary">UPI / QR Code</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                Back To Review
              </button>
              <button 
                onClick={handlePlaceOrderSubmit} 
                className={`btn btn-primary ${isPlacing ? 'btn-disabled' : ''}`}
                disabled={isPlacing}
              >
                {isPlacing ? 'Placing Order...' : isOwnRestaurant ? 'Place Test Order' : 'Place Order'}
              </button>
            </div>
          </div>

          {/* Review items sidebar */}
          <aside className="glass-panel p-7">
            <h3 className="text-[18px] mb-5 border-b border-[var(--border-light)] pb-3">
              Items Summary
            </h3>
            <div className="flex flex-col gap-2.5 text-[13px] text-text-secondary mb-5">
              {cartItems.map((item) => (
                <div key={item.foodItem} className="flex justify-between">
                  <span>{item.quantity} x {item.name}</span>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border-light)] pt-3 text-[15px] font-bold flex justify-between">
              <span>Grand Total:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 3: LIVE STATUS TRACKER FOR PLACED ORDERS */}
      {step === 3 && successOrder && (
        <div className="flex-center w-full">
          <div className="glass-panel fade-in w-full max-w-[560px] p-10 text-center shadow-[var(--shadow-glow)] border border-primary">
            <CheckCircle2 size={56} className="text-[var(--accent)] mb-4" />
            
            <h2 className="text-[28px] mb-2 tracking-tight">
              Order Placed Successfully!
            </h2>
            <p className="text-text-secondary text-[14px] mb-8">
              Your order from <strong>{restaurant?.name}</strong> has been received successfully. Below is the live preparation tracker.
            </p>

            {/* LIVE TRACKER CHART */}
            <div className="flex flex-col gap-4 bg-[var(--surface-container)] p-6 rounded-[16px] border border-[var(--border-light)] text-left mb-8">
              <div className="flex justify-between items-center border-b border-[var(--border-light)] pb-3 mb-2">
                <span className="text-[13px] text-text-muted">Order ID: {successOrder._id}</span>
                <span className="bg-[var(--border-glow)] text-primary text-[11px] font-extrabold py-1 px-2.5 rounded-[8px] uppercase flex items-center gap-1">
                  <RefreshCw size={11} className="animate-stir" />
                  Live Polling (5s)
                </span>
              </div>

              {successOrder.status === 'out_for_delivery' && (
                <DeliveryMapSimulator
                  orderId={successOrder._id}
                  onDeliveryComplete={async () => {
                    try {
                      await updateOrderStatus(successOrder._id, 'delivered');
                      const updated = await getOrderDetails(successOrder._id);
                      setSuccessOrder(updated);
                    } catch (err) {
                      console.error('Failed to trigger simulated delivery update:', err.message);
                    }
                  }}
                />
              )}

              {/* Status steps */}
              {[
                { key: 'pending', label: 'Order Confirmed', desc: 'Awaiting kitchen acknowledgment' },
                { key: 'preparing', label: 'Preparing Dishes', desc: 'Our head chefs are cooking your meal' },
                { key: 'ready', label: 'Ready for Pickup', desc: 'Dishes are packed & sealed' },
                { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is carrying your warm delivery' },
                { key: 'delivered', label: 'Delivered', desc: 'Enjoy your elite dining experience!' }
              ].map((st, index, arr) => {
                const statuses = arr.map(a => a.key);
                const activeIndex = statuses.indexOf(successOrder.status);
                const isPassed = index < activeIndex;
                const isActive = successOrder.status === st.key;
                
                return (
                  <div key={st.key} className="flex gap-4 relative">
                    
                    {/* Visual dot line */}
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-[18px] h-[18px] rounded-full z-[2] transition-all duration-300 ${
                          isActive 
                            ? 'bg-primary shadow-[0_0_10px_var(--primary)] border-none' 
                            : isPassed 
                            ? 'bg-[var(--accent)] border-none' 
                            : 'bg-background-primary border-2 border-text-muted'
                        }`}
                      />
                      {index < arr.length - 1 && (
                        <div 
                          className={`w-[2px] h-[36px] z-[1] ${
                            isPassed ? 'bg-[var(--accent)]' : 'bg-[var(--border-light)]'
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <h4 className={`text-[15px] ${isActive ? 'text-primary font-bold' : isPassed ? 'text-text-primary font-bold' : 'text-text-muted font-medium'}`}>
                        {st.label}
                      </h4>
                      <p className="text-[12px] text-text-muted mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleResetCheckout} className="btn btn-primary w-full p-3 rounded-[12px]">
              Return To Home Screen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
