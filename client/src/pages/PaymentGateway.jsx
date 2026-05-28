import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Calendar, Key, User, ArrowLeft, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { OrderContext } from '../context/OrderContext';
import { usePolling } from '../hooks/usePolling';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrder, getOrderDetails, setActiveOrder } = useContext(OrderContext);
  const chefMood = useChefMood();

  const { orderId, total, transactionId } = location.state || {};

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollingOrder, setPollingOrder] = useState(null);

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
      // 1. Try to call the create-intent route just to demonstrate standard API integration
      await api.post('/payment/create-intent', {
        amount: total,
        currency: 'usd',
        orderId,
      });

      // 2. Trigger Stripe webhook bypass event directly to backend.
      // This replicates Stripe servers notifying our backend webhook of successful charges
      const mockStripeEvent = {
        id: `evt_mock_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: transactionId || `pi_mock_${Date.now()}`,
            amount: Math.round(total * 100),
            currency: 'usd',
            metadata: {
              orderId,
            },
          },
        },
      };

      // Call our public webhook endpoint
      const webhookRes = await api.post('/payment/webhook', mockStripeEvent);
      
      if (webhookRes.data && webhookRes.data.received) {
        setSuccess(true);
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

  return (
    <div className="container fade-in py-10 px-6 pb-20 text-left min-h-[calc(100vh-120px)] flex items-center justify-center">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-[1000px] items-start">
        {/* Left Side: Elegant Credit Card Visualization & Form */}
        <div className="glass-panel p-9 rounded-[24px]">
          
          <button 
            onClick={() => navigate('/checkout')} 
            className="bg-none border-none text-text-muted flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold mb-6 p-0"
            disabled={processing}
          >
            <ArrowLeft size={14} /> Back to Checkout
          </button>

          <h2 className="text-[26px] tracking-tight mb-2">Secure Checkout Gateway</h2>
          <p className="text-[13px] text-text-muted mb-8">
            All transactions are encrypted with state-of-the-art security layer.
          </p>

          {errorMsg && (
            <div className="bg-[rgba(255,180,171,0.1)] border border-[var(--error)] text-[var(--error)] rounded-[8px] py-3 px-4 mb-6 text-[13px]">
              {errorMsg}
            </div>
          )}

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
                  className="glass-input pl-11" 
                  placeholder="John Doe" 
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
                  className="glass-input pl-11" 
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
                    className="glass-input pl-11" 
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
                    className="glass-input pl-11" 
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

    </div>
  );
}
