import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, CreditCard, ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, restaurant, subtotal, deliveryFee, tax, total, deleteItemRow } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { placeOrder, activeOrder, getOrderDetails, setActiveOrder, updateOrderStatus } = useContext(OrderContext);
  const { activeCity } = useContext(LocationContext);
  const isOutOfRegion = restaurant && activeCity && restaurant.city && restaurant.city.toLowerCase().trim() !== activeCity.toLowerCase().trim();

  const [step, setStep] = useState(1); // Stepper: 1 - Cart Review, 2 - Delivery, 3 - Payment/Status
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or CARD
  const [errorMsg, setErrorMsg] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Prefill address
  useEffect(() => {
    if (user && user.address) {
      setAddress(user.address);
    }
  }, [user]);

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

  const handlePlaceOrderSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please specify a delivery address.');
      return;
    }

    setIsPlacing(true);
    setErrorMsg('');

    const transactionId = paymentMethod === 'CARD' ? `pi_mock_${Date.now()}` : undefined;

    const orderPayload = {
      restaurant: restaurant._id,
      items: cartItems.map((item) => ({
        foodItem: item.foodItem,
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMethod,
      deliveryAddress: address.trim(),
      transactionId,
    };

    try {
      const placed = await placeOrder(orderPayload);
      if (paymentMethod === 'CARD') {
        // Redirect to Payment Gateway passing transactionId / client secret mock details
        navigate('/payment-gateway', { 
          state: { 
            orderId: placed._id,
            total,
            transactionId
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
                        Qty: {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <strong className="text-[16px] block mb-1.5">
                        {formatPrice(item.price * item.quantity)}
                      </strong>
                      <button 
                        onClick={() => deleteItemRow(item.foodItem)}
                        className="bg-none border-none text-[var(--error,#ffb4ab)] text-[12px] cursor-pointer font-semibold"
                      >
                        Delete
                      </button>
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

            {/* Address input */}
            <div className="mb-8">
              <label className="block text-[13px] font-semibold text-text-secondary mb-2">
                Delivery Address
              </label>
              <textarea 
                className="glass-input resize-none rounded-[12px]" 
                rows="3"
                placeholder="Specify street address, apartment, building number..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <h3 className="text-[22px] mb-6 flex items-center gap-2.5">
              <CreditCard size={20} className="text-[var(--accent)]" />
              Payment Methods
            </h3>

            {/* Payment selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div 
                className={`glass-card flex-center flex-col gap-3 p-6 cursor-pointer border-[1.5px] transition-all duration-200 ${
                  paymentMethod === 'COD' 
                    ? 'border-primary shadow-[var(--shadow-glow)]' 
                    : 'border-[var(--border-light)] shadow-none'
                }`}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className="font-extrabold text-[18px] text-primary">COD</div>
                <div className="text-[13px] text-text-secondary">Cash On Delivery</div>
              </div>

              <div 
                className={`glass-card flex-center flex-col gap-3 p-6 cursor-pointer border-[1.5px] transition-all duration-200 ${
                  paymentMethod === 'CARD' 
                    ? 'border-primary shadow-[var(--shadow-glow)]' 
                    : 'border-[var(--border-light)] shadow-none'
                }`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={28} className="text-[var(--accent)]" />
                <div className="text-[13px] text-text-secondary">Credit Card (Stripe)</div>
              </div>
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
                {isPlacing ? 'Placing Order...' : 'Place Order'}
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
