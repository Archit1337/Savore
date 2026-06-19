import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Calendar, Key, User, ArrowLeft, CheckCircle, RefreshCw, Sparkles, AlertTriangle, QrCode, Smartphone, Copy, Check } from 'lucide-react';
import { OrderContext } from '../context/OrderContext';
import { CartContext } from '../context/CartContext';
import { usePolling } from '../hooks/usePolling';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrder, getOrderDetails, setActiveOrder } = useContext(OrderContext);
  const { clearCart } = useContext(CartContext);
  const chefMood = useChefMood();

  const { orderId, total, transactionId, paymentMethod } = location.state || {};

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  // UPI states
  const [upiId, setUpiId] = useState('');
  const [copied, setCopied] = useState(false);
  const [upiTimer, setUpiTimer] = useState(300); // 5 minutes

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollingOrder, setPollingOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // UPI Countdown timer effect
  useEffect(() => {
    if (paymentMethod !== 'UPI' || success || processing || upiTimer <= 0) return;
    const interval = setInterval(() => {
      setUpiTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, success, processing, upiTimer]);

  const formatUpiTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyUpi = () => {
    const merchantVpa = pollingOrder?.restaurant?.upiVpa || 'savore@ybl';
    const merchantName = encodeURIComponent(pollingOrder?.restaurant?.name || 'Savore Kitchen');
    navigator.clipboard.writeText(`upi://pay?pa=${merchantVpa}&am=${total}&pn=${merchantName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If no order details are passed in navigation state, kick back to discover
  useEffect(() => {
    if (!orderId) {
      navigate('/discover');
    } else {
      // Set initial polling target
      const fetchInitial = async () => {
        try {
          const ord = await getOrderDetails(orderId);
          setPollingOrder(ord);
        } catch (err) {
          console.error('Failed to load order for payment gateway:', err.message);
        }
      };
      fetchInitial();
    }
  }, [orderId, navigate, getOrderDetails]);

  // Poll order status (every 3 seconds) once the mock payment is completed,
  // to show the user the live transition from 'pending' to 'preparing' via the webhook.
  usePolling(
    async () => {
      if (orderId && success) {
        try {
          const updated = await getOrderDetails(orderId);
          setPollingOrder(updated);
          if (updated.paymentStatus === 'paid' && updated.status === 'preparing') {
            // Once verified paid, redirect to checkout tracker step after a brief wow moment
            setTimeout(() => {
              navigate('/checkout', { state: { orderId } });
              // Set the active order in order context so checkout mounts stepper at Step 3
              setActiveOrder(updated);
            }, 3000);
          }
        } catch (err) {
          console.warn('Payment polling error:', err.message);
        }
      }
    },
    3000,
    !!orderId && success && (!pollingOrder || pollingOrder.paymentStatus !== 'paid')
  );

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setExpiry(value.slice(0, 5));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value.slice(0, 3));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setErrorMsg('Please enter a valid 16-digit credit card number.');
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg('Please specify card expiration date (MM/YY).');
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg('Please enter a valid 3-digit CVV code.');
      return;
    }
    if (!cardName.trim()) {
      setErrorMsg('Cardholder name is required.');
      return;
    }

    setProcessing(true);
    setErrorMsg('');

    try {
      // 1. Call the create-intent route securely (database-driven lookup, IDOR protected)
      await api.post('/payment/create-intent', { orderId });

      // 2. Call our secure payment simulation endpoint instead of the public unauthenticated webhook
      const webhookRes = await api.post('/payment/simulate-payment', { orderId });
      
      if (webhookRes.data && webhookRes.data.received) {
        setSuccess(true);
        clearCart();
        if (chefMood && typeof chefMood.celebrate === 'function') {
          chefMood.celebrate('order_placed');
        }
      } else {
        throw new Error('Webhook processing handshake failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment processor handshake failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleUpiSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!upiId.trim() || !upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. username@bank).');
      return;
    }

    setProcessing(true);
    setErrorMsg('');

    try {
      // Call our secure payment simulation endpoint instead of the public unauthenticated webhook
      const webhookRes = await api.post('/payment/simulate-payment', { orderId });
      
      if (webhookRes.data && webhookRes.data.received) {
        setSuccess(true);
        clearCart();
        if (chefMood && typeof chefMood.celebrate === 'function') {
          chefMood.celebrate('order_placed');
        }
      } else {
        throw new Error('Webhook processing handshake failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'UPI Payment handshake failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div 
      className="container fade-in pb-20 px-6 text-left min-h-[calc(100vh-160px)] flex justify-center"
      style={{ marginTop: '-5rem', paddingTop: '0.5rem' }}
    >
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-[1000px] items-start">
        {/* Left Side: Elegant Credit Card Visualization & Form */}
        <div className="glass-panel p-9 rounded-[24px]">
          
          <button 
            onClick={() => { if (!processing && !success) setShowCancelModal(true); }} 
            className="bg-none border-none text-text-muted flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold mb-6 p-0 transition-all duration-300 hover:text-primary active:scale-95 group"
            disabled={processing || success}
          >
            <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" /> Back to Checkout
          </button>

          <h2 className="text-[26px] tracking-tight mb-2">
            {paymentMethod === 'UPI' ? 'UPI Secure Gateway' : 'Secure Checkout Gateway'}
          </h2>
          <p className="text-[13px] text-text-muted mb-8">
            {paymentMethod === 'UPI' 
              ? 'Scan the QR code or enter your VPA ID to verify and complete the transaction.' 
              : 'All transactions are encrypted with state-of-the-art security layer.'}
          </p>

          {errorMsg && (
            <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error)] text-[var(--error)] rounded-[8px] py-3 px-4 mb-6 text-[13px]">
              {errorMsg}
            </div>
          )}

          {paymentMethod === 'UPI' ? (
            <div>
              {/* Dynamic QR Code Interface */}
              <div className="flex flex-col items-center mb-8 bg-white/[0.02] border border-white/[0.04] p-6 rounded-[16px] text-center relative overflow-hidden">
                <div className="relative p-3 bg-white rounded-xl shadow-lg mb-4">
                  {upiTimer <= 0 ? (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col justify-center items-center text-white rounded-xl p-4">
                      <AlertTriangle className="text-[#d9a752] mb-2" size={24} />
                      <span className="text-[11px] font-bold">QR Code Expired</span>
                      <button 
                        type="button"
                        onClick={() => setUpiTimer(300)}
                        className="btn btn-primary btn-pill mt-2 py-1 px-3 text-[10px]"
                      >
                        Regenerate QR
                      </button>
                    </div>
                  ) : null}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=165x165&data=upi://pay?pa=${pollingOrder?.restaurant?.upiVpa || 'savore@ybl'}%26am=${total}%26pn=${encodeURIComponent(pollingOrder?.restaurant?.name || 'Savore Kitchen')}%26tr=${transactionId || 'upi_txn'}`}
                    alt="UPI Payment QR Code"
                    className="w-[165px] h-[165px] block border border-gray-100"
                  />
                </div>
                
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  Awaiting Scan: {formatUpiTime(upiTimer)}
                </span>
                
                <button 
                  type="button"
                  onClick={handleCopyUpi}
                  className="bg-none border-none text-[11px] text-text-muted cursor-pointer flex items-center gap-1 hover:text-primary transition-all duration-200"
                >
                  {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
                  {copied ? 'Copied UPI Intent String!' : 'Copy UPI Intent String'}
                </button>
              </div>

              {/* UPI ID Form */}
              <form onSubmit={handleUpiSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                    Or pay via UPI ID / VPA
                  </label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      className="glass-input !pl-11" 
                      placeholder="e.g. username@bank" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={processing || success || upiTimer <= 0}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`btn btn-primary mt-2 h-12 flex items-center justify-center gap-2.5 ${(processing || success || upiTimer <= 0) ? 'btn-disabled' : ''}`}
                  disabled={processing || success || upiTimer <= 0}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="animate-stir" size={18} /> Processing UPI Payment...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle size={18} /> Payment Verified
                    </>
                  ) : (
                    `Verify & Pay ${formatPrice(total || 0)}`
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              {/* Gorgeous 3D Flipping Card Simulator */}
              <div className="[perspective:1000px] w-full max-w-[380px] h-[220px] mx-auto mb-9 relative">
                <div 
                  className="w-full h-full absolute [transform-style:preserve-3d] transition-transform duration-800 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)]"
                  style={{
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Card Front */}
                  <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-[#1d1e22] to-[#303136] border border-primary shadow-[0_15px_35px_rgba(0,0,0,0.4),var(--shadow-glow)] rounded-[16px] p-6 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-center">
                      <CreditCard size={36} className="text-primary" />
                      <div className="italic font-extrabold text-[18px] text-text-muted">SAVORÉ</div>
                    </div>

                    <div className="text-[20px] tracking-[3px] font-bold font-mono my-5 mt-5 mb-2.5">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[9px] uppercase text-text-muted tracking-[1px]">Card Holder</div>
                        <div className="text-[13px] font-semibold tracking-[0.5px]">{cardName.toUpperCase() || 'YOUR NAME'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-text-muted tracking-[1px]">Expires</div>
                        <div className="text-[13px] font-semibold">{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-[#303136] to-[#1d1e22] border border-primary shadow-[0_15px_35px_rgba(0,0,0,0.4)] rounded-[16px] [transform:rotateY(180deg)] text-white flex flex-col justify-between py-5">
                    <div className="bg-black h-10 w-full"></div>
                    
                    <div className="px-6">
                      <div className="flex justify-end items-center">
                        <div className="bg-white text-black w-[60px] h-[30px] rounded-[4px] flex items-center justify-center font-bold font-mono text-[14px]">
                          {cvv || '•••'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between px-6 items-center">
                      <div className="text-[8px] text-text-muted">SECURE AUTHORIZED TRANSACTION ONLY</div>
                      <Shield size={16} className="text-[var(--accent)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                    Cardholder Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      className="glass-input !pl-11" 
                      placeholder="John Cena" 
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={processing || success}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      className="glass-input !pl-11" 
                      placeholder="4000 1234 5678 9010" 
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      disabled={processing || success}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                      Expiration Date
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input 
                        type="text" 
                        className="glass-input !pl-11" 
                        placeholder="MM/YY" 
                        value={expiry}
                        onChange={handleExpiryChange}
                        disabled={processing || success}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                      CVV / CVC
                    </label>
                    <div className="relative">
                      <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input 
                        type="password" 
                        className="glass-input !pl-11" 
                        placeholder="•••" 
                        value={cvv}
                        onChange={handleCvvChange}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        disabled={processing || success}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`btn btn-primary mt-3 h-12 flex items-center justify-center gap-2.5 ${(processing || success) ? 'btn-disabled' : ''}`}
                  disabled={processing || success}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="animate-stir" size={18} /> Processing Gateway...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle size={18} /> Secure Handshake Verified
                    </>
                  ) : (
                    `Pay ${formatPrice(total || 0)} Now`
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Side: Elegant Order Breakdown and Success Overlay */}
        <div className="flex flex-col gap-6">
          
          <aside className="glass-panel p-7 rounded-[24px]">
            <h3 className="text-[18px] mb-5 border-b border-[var(--border-light)] pb-3 text-text-primary">
              Summary & Security
            </h3>

            {pollingOrder && (
              <div className="text-[13px] text-text-secondary mb-5 flex flex-col gap-2">
                <div>Ordering from: <strong>{pollingOrder.restaurant?.name || 'Curated Kitchen'}</strong></div>
                <div>Status: <span className="text-primary font-bold uppercase">{pollingOrder.paymentStatus}</span></div>
              </div>
            )}

            <div className="flex flex-col gap-3 text-[13px] text-text-secondary mb-5">
              {pollingOrder?.items?.map((item) => (
                <div key={item._id} className="flex justify-between">
                  <span>{item.quantity} x {item.foodItem?.name || 'Chef Specialty Item'}</span>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border-light)] pt-4 flex justify-between text-[16px] font-bold mb-5">
              <span>Grand Total:</span>
              <span className="text-primary">{formatPrice(total || 0)}</span>
            </div>

            <div className="flex gap-3 bg-[var(--surface)] p-4 rounded-[12px] border border-[var(--border-light)]">
              <Shield size={24} className="text-[var(--accent)] shrink-0" />
              <div className="text-[12px] text-text-muted leading-relaxed">
                This is a fully secure, Stripe-ready transaction sandbox. Credit card details are analyzed via MERN security layers, signature verified using raw web buffer parsing, and safely secured.
              </div>
            </div>
          </aside>

          {/* Success Overlay once Payment processes */}
          {success && (
            <div className="glass-panel fade-in p-9 rounded-[24px] text-center border-2 border-[var(--accent)] shadow-[var(--shadow-glow)]">
              <div className="w-[60px] h-[60px] rounded-full bg-[rgba(57,181,74,0.1)] border-2 border-[var(--accent)] inline-flex items-center justify-center text-[var(--accent)] mb-5">
                <Sparkles size={28} />
              </div>
              
              <h3 className="text-[20px] mb-2.5 font-extrabold">Charge Completed Successfully!</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed mb-6">
                We have received the payment confirmation event. Handshaking asynchronously with the restaurant's SaaS dashboard. You are being redirected...
              </p>

              <div className="flex items-center justify-center gap-2 text-[12px] text-text-muted">
                <RefreshCw size={14} className="animate-stir" /> Hooking into Webhook updates...
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Premium Cancel Confirmation Modal */}
      {showCancelModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => { if (!cancelling) setShowCancelModal(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }} />
          
          {/* Modal Card */}
          <div 
            className="relative glass-panel border border-[var(--border-light)] rounded-[24px] p-8 max-w-[420px] w-full shadow-[0_25px_60px_rgba(0,0,0,0.5),var(--shadow-glow)] text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          >
            {/* Warning Icon */}
            <div className="w-[56px] h-[56px] rounded-full bg-[rgba(255,180,60,0.1)] border-2 border-[#d9a752] inline-flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={26} className="text-[#d9a752]" />
            </div>

            <h3 className="text-[20px] font-extrabold mb-2 text-text-primary">Cancel Payment?</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-7">
              Your current order will be <strong className="text-[var(--error,#ffb4ab)]">cancelled</strong> and you'll be returned to checkout. You can always place a new order.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn btn-secondary flex-1 h-11 rounded-[12px] text-[13px] font-bold transition-all duration-200 hover:bg-white/[0.08] active:scale-[0.97]"
              >
                Keep Payment
              </button>
              <button 
                onClick={async () => {
                  setCancelling(true);
                  try {
                    await api.put(`/orders/${orderId}/status`, { status: 'cancelled' });
                  } catch (err) {
                    console.warn('Failed to cancel order:', err.message);
                  }
                  setActiveOrder(null);
                  setShowCancelModal(false);
                  navigate('/checkout', { state: { fromPaymentCancel: true } });
                }}
                disabled={cancelling}
                className="flex-1 h-11 rounded-[12px] text-[13px] font-bold border-none cursor-pointer bg-[var(--error,#ffb4ab)]/15 text-[var(--error,#ffb4ab)] border border-[var(--error,#ffb4ab)]/30 transition-all duration-200 hover:bg-[var(--error,#ffb4ab)]/30 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,180,171,0.2)] active:scale-[0.95] active:brightness-90 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <><RefreshCw size={14} className="animate-stir" /> Cancelling...</>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

    </div>
  );
}
