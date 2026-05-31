import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, MapPin, Sparkles, AlertTriangle, ShieldCheck, 
  Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { LocationContext, CITIES } from '../context/LocationContext';
import api from '../utils/api';
import { soundController } from '../components/ChefSystem/SoundController';

export default function BecomePartner() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useContext(AuthContext);
  const { savedAddresses } = useContext(LocationContext);

  const [currentRequest, setCurrentRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State variables
  const [restaurantName, setRestaurantName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [locality, setLocality] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [priceRange, setPriceRange] = useState('₹₹');
  const [cuisinesInput, setCuisinesInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const fetchMyRequest = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/auth/partnership-request/my');
      if (res.data && res.data.success && res.data.data) {
        setCurrentRequest(res.data.data);
      } else {
        setCurrentRequest(null);
      }
    } catch (err) {
      console.error('Failed to load partnership request:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      navigate('/dashboard');
      return;
    }
    fetchMyRequest();
  }, [user, navigate]);

  const handleAutofill = () => {
    soundController?.playClick();
    if (!savedAddresses || savedAddresses.length === 0) {
      setErrorMsg('No saved addresses found in your gastromonic profile. Complete your addresses in settings!');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const targetAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
    if (targetAddr) {
      setCity(targetAddr.city || 'Mumbai');
      setLocality(targetAddr.area || '');
      setState(targetAddr.state || 'Maharashtra');
      setPincode(targetAddr.pincode || '');
      setSuccessMsg('Address parameters imported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    soundController?.playClick();

    if (!restaurantName || !pincode) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    // Validate Indian pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      setErrorMsg('Pincode must be exactly 6 digits.');
      return;
    }

    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cuisines = cuisinesInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
      
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const postData = {
      restaurantName,
      description,
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
      city,
      locality: locality || 'Bandra',
      state,
      pincode,
      priceRange,
      cuisines,
      tags
    };

    try {
      const res = await api.post('/auth/become-partner', postData);
      if (res.data && res.data.success) {
        soundController?.playSuccess();
        setSuccessMsg('Application submitted successfully to the Savoré Culinary Board!');
        fetchMyRequest(); // Refresh request state to show timeline tracker
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit partnership application.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReapply = () => {
    soundController?.playClick();
    setCurrentRequest(null);
    setRestaurantName('');
    setDescription('');
    setCoverImage('');
    setLocality('');
    setPincode('');
    setCuisinesInput('');
    setTagsInput('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  if (loading) {
    return (
      <div className="container py-24 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-6 text-left fade-in" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      
      {/* 1. HERO PITCH HEADER */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <button 
            onClick={() => { soundController?.playClick(); navigate('/profile'); }}
            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-primary transition-colors bg-transparent border-none mb-3 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Profile
          </button>
          <span className="text-[12px] text-primary font-black uppercase tracking-[0.08em]">Culinary Partnership</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-text-primary">
            Launch Your Kitchen on Savoré
          </h1>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
            Register your kitchen, stream cinematic recipes, and leverage SaaS delivery pipelines with 0% commissions.
          </p>
        </div>

        <div className="shrink-0 p-4 rounded-full bg-primary/5 border border-primary/20 shadow-inner">
          <Building size={48} className="text-primary" />
        </div>
      </div>

      {/* ERROR & SUCCESS TOASTS */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-4 mb-6 text-[13.5px] flex items-center gap-2.5">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-xl p-4 mb-6 text-[13.5px] flex items-center gap-2.5">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. DYNAMIC TIMELINE STATUS CENTER */}
      {currentRequest ? (
        <div className="glass-panel p-8 rounded-[28px] border-[1.5px] border-[var(--border-glow)] shadow-[var(--shadow-glow)]">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Application Progress Center
          </h3>

          <div className="bg-white/[0.01] dark:bg-[#12161c]/30 border border-border-light rounded-2xl p-6 mb-8 text-left grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-xs text-text-secondary font-semibold uppercase">Proposed Restaurant</span>
              <h4 className="text-lg font-black text-text-primary mt-1">{currentRequest.restaurantName}</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {currentRequest.locality}, {currentRequest.city} • Pincode: {currentRequest.pincode}
              </p>
              {currentRequest.description && (
                <p className="text-xs text-text-secondary leading-relaxed mt-2.5 italic">
                  "{currentRequest.description}"
                </p>
              )}
            </div>

            <div className="text-right flex flex-col md:items-end gap-2.5">
              <div>
                <span className="text-xs text-text-secondary font-semibold block mb-1">Status Summary</span>
                <span className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold capitalize tracking-wide inline-flex items-center gap-1.5 ${
                  currentRequest.status === 'pending' ? 'bg-orange-500/10 text-primary border border-primary/20' :
                  currentRequest.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {currentRequest.status === 'pending' ? <Clock size={12} className="animate-spin" /> :
                   currentRequest.status === 'approved' ? <CheckCircle size={12} /> :
                   <XCircle size={12} />}
                  Under {currentRequest.status} Review
                </span>
              </div>
              <span className="text-[11px] text-text-muted">Applied on {new Date(currentRequest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Vertical Progress Timeline */}
          <div className="flex flex-col gap-8 ml-2 md:ml-4 relative border-l border-border-light/50 pl-6 py-2 mb-10 text-left">
            
            {/* Step 1: Submit */}
            <div className="relative">
              <span className="absolute -left-[33px] top-0 p-1.5 rounded-full bg-green-500 text-white shadow-md border-3 border-background-primary z-10">
                <CheckCircle size={12} />
              </span>
              <div>
                <h5 className="text-[14px] font-bold text-text-primary">Application Submitted Successfully</h5>
                <p className="text-xs text-text-secondary mt-1">Your kitchen details and coordinates have been securely written to the backend.</p>
              </div>
            </div>

            {/* Step 2: Audit */}
            <div className="relative">
              <span className={`absolute -left-[33px] top-0 p-1.5 rounded-full z-10 border-3 border-background-primary ${
                currentRequest.status === 'pending' ? 'bg-primary text-white animate-pulse' :
                currentRequest.status === 'approved' ? 'bg-green-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {currentRequest.status === 'pending' ? <Clock size={12} className="animate-spin" /> :
                 currentRequest.status === 'approved' ? <CheckCircle size={12} /> :
                 <XCircle size={12} />}
              </span>
              <div>
                <h5 className="text-[14px] font-bold text-text-primary">Culinary Audit & Verifications</h5>
                <p className="text-xs text-text-secondary mt-1">
                  Savoré Platform Administrators review your kitchen description, cover image URL, cuisines, and regional serviceable zones.
                </p>
                {currentRequest.adminNotes && (
                  <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20 max-w-xl">
                    <span className="text-[11px] font-extrabold uppercase text-primary block">Culinary Board Audit Feedback</span>
                    <p className="text-xs text-text-primary font-medium mt-1 leading-relaxed italic">
                      "{currentRequest.adminNotes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Activation */}
            <div className="relative">
              <span className={`absolute -left-[33px] top-0 p-1.5 rounded-full z-10 border-3 border-background-primary ${
                currentRequest.status === 'approved' ? 'bg-green-500 text-white' : 'bg-white/[0.04] text-text-muted border border-border-light'
              }`}>
                <ShieldCheck size={12} />
              </span>
              <div>
                <h5 className={`text-[14px] font-bold ${currentRequest.status === 'approved' ? 'text-text-primary' : 'text-text-muted'}`}>Merchant Panel Provisioned</h5>
                <p className="text-xs text-text-muted mt-1">Once approved, your user role will instantly escalate and provision your operational dashboard console.</p>
              </div>
            </div>

          </div>

          {/* Interactive options based on timeline status */}
          <div className="flex gap-4 border-t border-border-light pt-6">
            {currentRequest.status === 'approved' && (
              <button
                onClick={() => { soundController?.playClick(); window.location.href = '/dashboard'; }}
                className="btn btn-pill bg-primary hover:bg-primary-hover text-white text-xs font-black flex items-center gap-1.5"
              >
                Go to Merchant Dashboard
                <ArrowRight size={13} />
              </button>
            )}

            {currentRequest.status === 'rejected' && (
              <button
                onClick={handleReapply}
                className="btn btn-pill bg-white/[0.05] border border-border-light hover:bg-white/[0.1] text-text-primary text-xs font-black"
              >
                Submit New Application
              </button>
            )}

            <button
              onClick={() => { soundController?.playClick(); navigate('/profile'); }}
              className="btn btn-pill bg-transparent border border-border-light text-text-secondary text-xs font-bold"
            >
              Close Status Center
            </button>
          </div>

        </div>
      ) : (
        /* 3. MULTI-FIELD REGISTRATION ONBOARDING FORM */
        <div className="glass-panel p-8 rounded-[28px] border-[1.5px] border-[var(--border-glow)] shadow-[var(--shadow-glow)]">
          <div className="flex justify-between items-center mb-6 border-b border-border-light pb-4 flex-wrap gap-4">
            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
              Restaurant Application Profile
            </h3>
            <button
              type="button"
              onClick={handleAutofill}
              className="btn btn-pill bg-white/[0.04] hover:bg-white/[0.08] text-text-primary border border-border-light text-xs font-bold flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
            >
              <MapPin size={13} className="text-primary" />
              Autofill Address from Profile
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
            
            {/* Row 1: Restaurant Basic Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Restaurant / Kitchen Name *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Savoré Bistro"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Price Tier Classification</label>
                <select 
                  className="glass-input !py-0 !px-2.5 rounded-xl cursor-pointer"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="₹" className="bg-[var(--surface-bright)] text-[var(--text-primary)]">₹ (Budget Bites)</option>
                  <option value="₹₹" className="bg-[var(--surface-bright)] text-[var(--text-primary)]">₹₹ (Sleek Casual)</option>
                  <option value="₹₹₹" className="bg-[var(--surface-bright)] text-[var(--text-primary)]">₹₹₹ (Premium Dining)</option>
                  <option value="₹₹₹₹" className="bg-[var(--surface-bright)] text-[var(--text-primary)]">₹₹₹₹ (Exclusive Gastronomy)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Description & Cover image */}
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Pitch / Short Description</label>
                <textarea 
                  rows="2"
                  className="glass-input resize-none rounded-xl" 
                  placeholder="List your signature styles, chef expertise, and general kitchen history..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Kitchen Cover Image URL (Optional)</label>
                <input 
                  type="url" 
                  className="glass-input" 
                  placeholder="https://images.unsplash.com/photo-..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Cuisines & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Cuisines Served (Comma-separated)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. North Indian, Italian, Desserts"
                  value={cuisinesInput}
                  onChange={(e) => setCuisinesInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">Tags / Special Badges (Comma-separated)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Tasting Menu, Michelin Starred"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Location Specs */}
            <div className="border-t border-border-light/35 pt-5 mt-2">
              <h4 className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                Kitchen Physical Coordinates & Location
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">City *</label>
                  <select 
                    className="glass-input !py-0 !px-2.5 rounded-xl cursor-pointer"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c} className="bg-[var(--surface-bright)] text-[var(--text-primary)]">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">Locality / Area *</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="e.g. Bandra West"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">State *</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-2">Pincode *</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="6 digits"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full h-11 bg-primary hover:bg-primary-hover text-white border-none rounded-xl font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer hover:shadow-[0_0_15px_rgba(255,106,77,0.25)] active:scale-[0.98] transition-all ${formLoading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {formLoading ? 'Submitting Application...' : 'Submit Partnership Application'}
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
