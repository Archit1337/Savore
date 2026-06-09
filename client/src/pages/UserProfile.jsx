import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Award, 
  ShoppingBag, Heart, MessageSquare, Settings, 
  Lock, Edit3, Camera, LogOut, CheckCircle, 
  ArrowRight, Compass, Eye, ShieldAlert, Sparkles,
  Home as HomeIcon, Briefcase, Building, Plus, Trash2, Edit,
  Film, X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { LocationContext, CITIES } from '../context/LocationContext';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeAvatar from '../components/SafeAvatar';
import SafeImage from '../components/SafeImage';
import { soundController } from '../components/ChefSystem/SoundController';

const getAddressIcon = (type) => {
  switch (type) {
    case 'Home':
      return <HomeIcon size={14} />;
    case 'Work':
      return <Briefcase size={14} />;
    case 'Apartment':
      return <Building size={14} />;
    default:
      return <MapPin size={14} />;
  }
};


export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logoutUser, updateUserProfile, isAuthenticated } = useContext(AuthContext);
  const { clearCart, addToCart } = useContext(CartContext);

  const { 
    savedAddresses, 
    addSavedAddress, 
    updateSavedAddress, 
    deleteSavedAddress, 
    toggleDefaultAddress 
  } = useContext(LocationContext);

  const [activeTab, setActiveTab] = useState('orders'); // orders, liked, comments, restaurants, settings
  const [loading, setLoading] = useState(true);
  const [socialHistory, setSocialHistory] = useState({
    likedReels: [],
    comments: [],
    savedRestaurants: [],
    favoriteDishes: [],
    phone: '',
    bio: ''
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  // Edit settings form state
  const [editFullName, setEditFullName] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPreferences, setEditPreferences] = useState({ dietary: 'Any', spicyLevel: 'Medium' });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Password edit state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Danger Zone deletion states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    soundController?.playClick();
    setDeleteLoading(true);
    try {
      const res = await api.delete('/auth/profile');
      if (res.data && res.data.success) {
        soundController?.playSuccess();
        alert('Your Savoré account was successfully deleted. We hope to see you again!');
        logoutUser();
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  // Address tab CRUD & form states
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);
  const [addrHouseNumber, setAddrHouseNumber] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrType, setAddrType] = useState('Home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressFormError, setAddressFormError] = useState('');
  const [addressFormSuccess, setAddressFormSuccess] = useState('');
  const [addressFormLoading, setAddressFormLoading] = useState(false);

  // Fetch initial profile telemetry
  const fetchProfileTelemetry = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const socialRes = await api.get('/auth/social');
      if (socialRes.data && socialRes.data.success) {
        setSocialHistory(socialRes.data.data);
        
        // Initialize form fields
        setEditFullName(user.name || '');
        setEditName(user.username || '');
        setEditEmail(user.email || '');
        setEditPhone(socialRes.data.data.phone || '');
        setEditBio(socialRes.data.data.bio || '');
        setEditAddress(user.address || '');
        setEditPreferences(user.preferences || { dietary: 'Any', spicyLevel: 'Medium' });
      }
    } catch (err) {
      console.error('Failed to load social history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer orders history
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/customer');
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load order history:', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfileTelemetry();
    fetchOrders();
  }, [isAuthenticated, navigate]);

  // Compute Foodie Rank Badge
  const getFoodieBadge = () => {
    const ordersCount = orders.length;
    if (ordersCount === 0) return { title: 'Taste Explorer', emoji: '🧭', color: 'text-text-muted border-text-muted/20 bg-text-muted/5' };
    if (ordersCount < 5) return { title: 'Epicurean Apprentice', emoji: '🍳', color: 'text-primary border-primary/20 bg-primary/5' };
    return { title: 'Taste Connoisseur', emoji: '👑', color: 'text-[#FF6A4D] border-[#FF6A4D]/20 bg-[#FF6A4D]/5 shadow-[0_0_10px_rgba(255,106,77,0.15)]' };
  };

  // Handle avatar file selection & preview
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setFormError('Only PNG, JPG, or JPEG image files are allowed.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFormError('');
    setFormSuccess('');
  };

  // Perform actual upload after preview confirmation
  const handleSaveAvatar = async () => {
    if (!avatarFile) return;

    setAvatarLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        updateUserProfile({ profilePicture: res.data.data.profilePicture });
        setFormSuccess('Profile picture updated successfully!');
        setAvatarFile(null);
        setAvatarPreview('');
      }
    } catch (err) {
      setFormError(err.message || 'Avatar upload failed.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Cancel selected preview
  const handleCancelAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  // Remove current profile photo
  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await api.put('/auth/profile', {
        profilePicture: ''
      });
      if (res.data && res.data.success) {
        updateUserProfile({ profilePicture: '' });
        setFormSuccess('Profile picture removed successfully!');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to remove profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle general details updates
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await api.put('/auth/profile', {
        name: editFullName.trim(),
        username: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        address: editAddress.trim(),
        preferences: editPreferences
      });

      if (res.data && res.data.success) {
        updateUserProfile(res.data.data);
        setFormSuccess('Profile details saved successfully!');
        fetchProfileTelemetry(); // refresh nested values
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update profile settings.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      setPassError('Both password fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setPassLoading(true);
    setPassError('');
    setPassSuccess('');

    try {
      const res = await api.put('/auth/password', {
        currentPassword: currPassword,
        newPassword
      });

      if (res.data && res.data.success) {
        setPassSuccess('Password updated successfully!');
        setCurrPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  // Order Again Refill shortcut
  const handleOrderAgain = (prevOrder) => {
    try {
      clearCart();
      const restData = prevOrder.restaurant;
      if (!restData) throw new Error('Restaurant details are unavailable for this order.');

      prevOrder.items.forEach(item => {
        if (item.foodItem) {
          addToCart(
            {
              _id: item.foodItem._id,
              name: item.foodItem.name,
              price: item.price,
              image: item.foodItem.image
            },
            restData,
            item.quantity
          );
        }
      });

      navigate('/checkout');
    } catch (err) {
      setFormError(err.message || 'Could not restore cart items.');
    }
  };

  // Toggle favorite restaurant
  const handleToggleFavorite = async (restaurantId) => {
    try {
      const res = await api.post(`/auth/restaurants/${restaurantId}/favorite`);
      if (res.data && res.data.success) {
        fetchProfileTelemetry(); // Refresh favorites tab
      }
    } catch (err) {
      console.error('Failed to toggle saved restaurant:', err.message);
    }
  };

  // Open Add Address Modal
  const handleOpenAddAddressModal = () => {
    setAddrHouseNumber('');
    setAddrStreet('');
    setAddrArea('');
    setAddrLandmark('');
    setAddrCity('Mumbai');
    setAddrState('Maharashtra');
    setAddrPincode('');
    setAddrType('Home');
    setAddrIsDefault(savedAddresses.length === 0);
    setIsEditingAddress(false);
    setAddressFormError('');
    setAddressFormSuccess('');
    setAddressModalOpen(true);
  };

  // Open Edit Address Modal
  const handleOpenEditAddressModal = (addr) => {
    setAddrHouseNumber(addr.houseNumber || '');
    setAddrStreet(addr.street || '');
    setAddrArea(addr.area || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city || 'Mumbai');
    setAddrState(addr.state || 'Maharashtra');
    setAddrPincode(addr.pincode || '');
    setAddrType(addr.addressType || 'Home');
    setAddrIsDefault(addr.isDefault || false);
    setCurrentAddressId(addr._id);
    setIsEditingAddress(true);
    setAddressFormError('');
    setAddressFormSuccess('');
    setAddressModalOpen(true);
  };

  // Address Submit handler
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addrStreet || !addrArea || !addrCity || !addrState || !addrPincode) {
      setAddressFormError('Please fill out all required address fields.');
      return;
    }
    
    // Validate Indian pincode format (6 digits)
    if (!/^\d{6}$/.test(addrPincode)) {
      setAddressFormError('Pincode must be exactly 6 digits.');
      return;
    }

    setAddressFormLoading(true);
    setAddressFormError('');
    setAddressFormSuccess('');

    const addressData = {
      houseNumber: addrHouseNumber.trim(),
      street: addrStreet.trim(),
      area: addrArea.trim(),
      landmark: addrLandmark.trim(),
      city: addrCity,
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      addressType: addrType,
      isDefault: addrIsDefault
    };

    try {
      if (isEditingAddress) {
        await updateSavedAddress(currentAddressId, addressData);
        setAddressFormSuccess('Address updated successfully!');
      } else {
        await addSavedAddress(addressData);
        setAddressFormSuccess('Address added successfully!');
      }
      
      // Delay closing modal slightly for visual checkmark feedback
      setTimeout(() => {
        setAddressModalOpen(false);
      }, 1000);
    } catch (err) {
      setAddressFormError(err.message || 'Failed to submit address.');
    } finally {
      setAddressFormLoading(false);
    }
  };

  const foodieBadge = getFoodieBadge();
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'May 2026';

  if (!user) return null;

  return (
    <div className="container px-6 text-left fade-in" style={{ marginTop: '-4.5rem', paddingTop: '0.5rem', paddingBottom: '7rem' }}>
      
      {/* 1. PREMIUM DUAL-THEME PROFILE HEADER */}
      <div className="relative glass-panel rounded-[28px] overflow-hidden mb-10 border-[1.5px] border-[var(--border-glow)] shadow-[var(--shadow-glow)]">
        {/* Soft gradient banner underlay */}
        <div className="h-36 bg-[linear-gradient(135deg,_rgba(255,106,77,0.12)_0%,_rgba(7,10,14,0.45)_100%)] dark:bg-[linear-gradient(135deg,_rgba(255,106,77,0.08)_0%,_rgba(0,0,0,0.65)_100%)] w-full relative overflow-hidden">
          <div className="absolute inset-0 backdrop-filter blur-xl opacity-60 pointer-events-none" />
          {(avatarPreview || (user.profilePicture && !user.profilePicture.includes('null') && !user.profilePicture.includes('undefined'))) && (
            <img 
              src={avatarPreview || resolveMediaUrl(user.profilePicture)} 
              alt="Profile Cover Banner" 
              className="absolute inset-0 w-full h-full object-cover filter blur-[8px] opacity-40 dark:opacity-20 scale-110 transition-all duration-500"
            />
          )}
        </div>

        {/* Profile Meta Section */}
        <div className="p-8 -mt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 flex-wrap relative z-10">
          
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-center text-center sm:text-left">
            
            {/* Avatar upload wrapper with dynamic preview, save/cancel & remove controls */}
            <div className="flex flex-col items-center gap-2 select-none shrink-0">
              <div className="relative group rounded-full overflow-hidden w-24 h-24 border-3 border-primary shadow-xl bg-background-primary cursor-pointer">
                {avatarLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <Sparkles size={20} className="animate-stir text-primary" />
                  </div>
                ) : (
                  <SafeAvatar 
                    src={avatarPreview || resolveMediaUrl(user.profilePicture)} 
                    alt={user.username}
                    size={96}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                {!avatarPreview && !avatarLoading && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={18} className="text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Preview action triggers */}
              {avatarPreview && !avatarLoading && (
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    className="text-[11px] font-bold text-green-500 hover:text-green-400 bg-transparent border-none cursor-pointer hover:underline"
                  >
                    Save Photo
                  </button>
                  <span className="text-[10px] text-text-muted">|</span>
                  <button
                    type="button"
                    onClick={handleCancelAvatarPreview}
                    className="text-[11px] font-bold text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Reset / Remove Photo action triggers */}
              {!avatarPreview && user.profilePicture && !avatarLoading && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[11px] font-bold text-red-500 hover:text-red-400 bg-transparent border-none cursor-pointer hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Main credentials info */}
            <div>
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">{user.username}</h1>
                
                {/* Foodie Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-[12px] border text-[11.5px] font-extrabold capitalize ${foodieBadge.color}`}>
                  <span>{foodieBadge.emoji}</span>
                  <span>{foodieBadge.title}</span>
                </div>
              </div>
              <p className="text-[14px] text-text-secondary mt-1">@{user.username?.toLowerCase()}</p>
              
              {/* Short Bio */}
              {socialHistory.bio ? (
                <p className="text-[14px] text-text-muted mt-2.5 max-w-[480px] font-medium leading-relaxed italic">
                  "{socialHistory.bio}"
                </p>
              ) : (
                <p className="text-[13px] text-text-secondary mt-2.5 italic">
                  No foodie bio registered. Complete your profile in account settings!
                </p>
              )}

              {/* Join Date */}
              <div className="flex items-center gap-1.5 text-text-secondary text-[12.5px] mt-3 font-semibold justify-center sm:justify-start">
                <Calendar size={14} className="text-primary" />
                <span>Gastronome since {joinDate}</span>
              </div>
            </div>

          </div>

          {/* Social Count stats */}
          <div className="flex gap-6 pr-2">
            <div className="text-center md:text-left">
              <span className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider block">Orders</span>
              <strong className="text-2xl font-extrabold text-text-primary mt-0.5 block">{orders.length}</strong>
            </div>
            <div className="h-8 w-[1.5px] bg-border-light my-auto opacity-45" />
            <div className="text-center md:text-left">
              <span className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider block">Liked Videos</span>
              <strong className="text-2xl font-extrabold text-text-primary mt-0.5 block">{socialHistory.likedReels.length}</strong>
            </div>
            <div className="h-8 w-[1.5px] bg-border-light my-auto opacity-45" />
            <div className="text-center md:text-left">
              <span className="text-[11px] text-text-muted font-extrabold uppercase tracking-wider block">Saved Places</span>
              <strong className="text-2xl font-extrabold text-text-primary mt-0.5 block">{socialHistory.savedRestaurants.length}</strong>
            </div>
          </div>

        </div>

      </div>

      {/* 2. TABS SELECTOR PANEL */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-border-light select-none max-w-full">
        {[
          { id: 'orders', label: 'Recent Orders', icon: ShoppingBag },
          { id: 'liked', label: 'Liked Reels', icon: Heart },
          { id: 'comments', label: 'My Comments', icon: MessageSquare },
          { id: 'restaurants', label: 'Saved Kitchens', icon: Compass },
          { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
          { id: 'settings', label: 'Account Settings', icon: Settings }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundController?.playClick();
                setActiveTab(tab.id);
                setFormError('');
                setFormSuccess('');
                setPassError('');
                setPassSuccess('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/[0.03] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-border-light'
              }`}
            >
              <IconComp size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. TABS CONTENT REGIONS */}
      <div className="min-h-[40vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            
            {/* TAB 1: ORDER HISTORY HISTORY */}
            {activeTab === 'orders' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <ShoppingBag size={20} className="text-primary" />
                  Your Order Journey
                </h3>

                {ordersLoading ? (
                  <div className="py-12 text-center">
                    <Sparkles className="animate-stir text-text-muted" size={24} />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {orders.map(ord => (
                      <div 
                        key={ord._id} 
                        className="bg-white/[0.01] dark:bg-[#12161c]/30 border border-border-light rounded-2xl p-6 grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_0.8fr] gap-6 items-center"
                      >
                        <div>

                          <div className="flex items-center gap-3">
                            <h4 className="text-[16px] font-bold text-text-primary">
                              {ord.restaurant?.name || 'Savoré Partner'}
                            </h4>
                            <span className="text-text-muted text-[11px] font-semibold">{new Date(ord.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                            <strong>Dishes:</strong> {ord.items.map(i => `${i.quantity}x ${i.foodItem?.name || 'Chef Specialty'}`).join(', ')}
                          </p>
                          <p className="text-[12.5px] text-text-muted mt-1 leading-relaxed">
                            <strong>Deliver to:</strong> {ord.deliveryAddress}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-col gap-1 text-[13.5px] text-text-secondary">
                            <div>Payment: <strong className="uppercase">{ord.paymentMethod}</strong></div>
                            <div className="flex items-center">
                              Status: 
                              <span className={`ml-2 px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold uppercase ${
                                ord.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-primary'
                              }`}>
                                {ord.paymentStatus}
                              </span>
                            </div>
                            <div>Subtotal: <strong>{formatPrice(ord.subtotal)}</strong></div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-3.5">
                          <div>
                            <span className="text-[11px] text-text-muted uppercase tracking-wider block font-bold mb-1">Tracker</span>
                            <span className={`px-3 py-1 rounded-[12px] text-[12px] font-bold tracking-wide capitalize ${
                              ord.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              ord.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-orange-500/10 text-primary border border-primary/20'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOrderAgain(ord)}
                            className="btn btn-pill bg-primary hover:bg-primary-hover text-white text-[12.5px] font-bold flex items-center gap-1.5"
                          >
                            Order Again
                            <ArrowRight size={13} />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-text-secondary text-sm">You haven't ordered any premium meals yet.</p>
                    <Link to="/discover" className="btn btn-pill bg-primary text-white inline-flex items-center gap-1.5 mt-5">
                      Explore Food Options
                    </Link>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: LIKED REELS GRID */}
            {activeTab === 'liked' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <Heart size={20} className="text-primary" />
                  Your Liked Food Reels
                </h3>

                {socialHistory.likedReels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {socialHistory.likedReels.map(reel => (
                      <div 
                        key={reel._id} 
                        className="group bg-white/[0.02] border border-border-light rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 transition-all duration-300 relative cursor-pointer"
                        onClick={() => navigate('/reels')}
                      >
                        {/* Dynamic Overlay play icon on hover */}
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="bg-primary text-white p-3.5 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                            <Eye size={20} />
                          </div>
                        </div>

                        {/* Simulated/Mock media canvas */}
                        <div className="h-64 bg-slate-900 flex items-center justify-center relative">
                          <Film size={36} className="text-text-muted/40" />
                          <span className="absolute bottom-3 left-3 bg-black/60 text-white rounded-lg text-[10px] px-2 py-0.5 font-bold uppercase tracking-[0.05em]">
                            {reel.restaurant?.name || 'Savoré Partner'}
                          </span>
                        </div>

                        {/* Caption Info */}
                        <div className="p-4 text-left bg-white/[0.01]">
                          <p className="text-sm font-bold text-text-primary line-clamp-1">{reel.caption || 'Recipe Clip'}</p>
                          <div className="flex items-center gap-3 text-[12.5px] text-text-secondary mt-1.5 font-semibold">
                            <span>❤️ {reel.likes?.length || 1} Likes</span>
                            <span>👁️ {reel.views || 0} Views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No liked recipe Reels found. Swipe and double-tap on our Reels page!
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: COMMENTS LOG */}
            {activeTab === 'comments' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <MessageSquare size={20} className="text-primary" />
                  Your Conversational Comments
                </h3>

                {socialHistory.comments.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {socialHistory.comments.map(c => (
                      <div 
                        key={c.commentId} 
                        className="bg-white/[0.01] dark:bg-[#12161c]/30 border border-border-light rounded-2xl p-5 text-left"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-[12.5px] text-text-secondary font-semibold">
                            Comment on <strong>{c.restaurantName}</strong>'s video
                          </span>
                          <span className="text-[11.5px] text-text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[14.5px] text-text-primary mt-2 font-medium italic">
                          "{c.text}"
                        </p>
                        <div className="mt-3.5 flex items-center gap-1.5 text-text-secondary text-[12px] font-semibold">
                          <span>Target Post:</span>
                          <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate('/reels')}>
                            {c.reelCaption || 'View Original Video'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No comments found. Share your thoughts on the Reels page!
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: SAVED RESTAURANTS */}
            {activeTab === 'restaurants' && (
              <div className="glass-panel p-8 rounded-[24px]">
                
                {/* Favorite Dishes Subgrid */}
                {socialHistory.favoriteDishes.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                      <Award size={20} className="text-primary" />
                      Favorite Dishes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {socialHistory.favoriteDishes.map(dish => (
                        <div key={dish._id} className="bg-[var(--surface-bright)] border border-border-light rounded-2xl p-4 flex gap-3.5 items-center hover:scale-[1.01] transition-all">
                          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                            <SafeAvatar src={resolveMediaUrl(dish.image)} alt={dish.name} size={64} roundedClass="rounded-xl" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-text-primary leading-tight">{dish.name}</h4>
                            <span className="text-xs text-text-secondary block mt-0.5">{dish.restaurant?.name || 'Savoré Kitchen'}</span>
                            <strong className="text-xs text-primary block mt-1">{formatPrice(dish.price)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <Compass size={20} className="text-primary" />
                  Your Saved Restaurants & Kitchens
                </h3>

                {socialHistory.savedRestaurants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {socialHistory.savedRestaurants.map(rest => (
                      <div 
                        key={rest._id} 
                        className="bg-[var(--surface-bright)] dark:bg-[#12161c]/30 border border-border-light rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-all"
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-slate-900 overflow-hidden shrink-0 border border-border-light">
                            <SafeAvatar src={resolveMediaUrl(rest.coverImage)} alt={rest.name} size={80} roundedClass="rounded-2xl" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-base font-bold text-text-primary leading-snug">{rest.name}</h4>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{rest.description}</p>
                            <div className="flex items-center gap-2 text-[11.5px] font-semibold text-text-muted mt-2">
                              <span>⭐ {rest.rating?.toFixed(1)}</span>
                              <span>•</span>
                              <span>🛵 {rest.deliveryTime} mins</span>
                              <span>•</span>
                              <span>{rest.timings || '11 AM - 11 PM'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-5 border-t border-border-light/45 pt-4">
                          <button
                            onClick={() => handleToggleFavorite(rest._id)}
                            className="text-xs font-bold text-red-500 hover:text-red-400 bg-transparent shrink-0"
                          >
                            Remove Favorite
                          </button>
                          
                          <Link 
                            to={`/restaurant/${rest._id}`}
                            className="btn btn-pill bg-white/[0.05] hover:bg-white/[0.1] text-text-primary text-[12px] font-bold flex items-center gap-1 border border-border-light"
                          >
                            Visit Menu
                            <ArrowRight size={12} />
                          </Link>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No saved restaurants found. Browse kitchen menus and click the favorite badge!
                  </div>
                )}

              </div>
            )}

            {/* TAB: SAVED ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                    <MapPin size={20} className="text-primary" />
                    Saved Delivery Addresses
                  </h3>
                  <button
                    onClick={handleOpenAddAddressModal}
                    className="btn btn-pill bg-primary hover:bg-primary-hover text-white text-[12.5px] font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add New Address
                  </button>
                </div>

                {savedAddresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr._id}
                        className={`bg-white/[0.01] dark:bg-[#12161c]/30 border rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-[1px] transition-all duration-300 ${
                          addr.isDefault 
                            ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/5' 
                            : 'border-border-light hover:bg-white/[0.03]'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="flex items-center gap-1.5 font-extrabold uppercase text-[12px] text-text-primary">
                              <span className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                                {getAddressIcon(addr.addressType)}
                              </span>
                              {addr.addressType}
                            </span>
                            {addr.isDefault ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md uppercase">Default</span>
                            ) : (
                              <button
                                onClick={() => toggleDefaultAddress(addr._id)}
                                className="text-[10px] font-bold text-text-muted hover:text-primary transition-all border border-border-light px-2 py-0.5 rounded-md hover:bg-white/[0.04]"
                              >
                                Set Default
                              </button>
                            )}
                          </div>
                          
                          <p className="text-[14px] text-text-primary font-semibold mt-2 leading-relaxed">
                            {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}
                          </p>
                          <p className="text-[13px] text-text-secondary mt-1">
                            {addr.area}{addr.landmark ? ` (Near ${addr.landmark})` : ''}
                          </p>
                          <p className="text-[12px] text-text-muted mt-1 leading-normal font-semibold">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>

                        <div className="flex gap-3 justify-end items-center mt-5 border-t border-border-light/45 pt-4">
                          <button
                            onClick={() => handleOpenEditAddressModal(addr)}
                            className="text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 bg-transparent hover:bg-white/[0.04] px-2.5 py-1.5 rounded-xl transition-all border border-border-light"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          
                          <button
                            onClick={() => deleteSavedAddress(addr._id)}
                            className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-transparent hover:bg-red-500/5 px-2.5 py-1.5 rounded-xl transition-all border border-red-500/20"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No saved addresses found. Register your Home/Work delivery details for one-tap express checkouts!
                  </div>
                )}

                {/* SAVED ADDRESS ADD/EDIT MODAL OVERLAY */}
                <AnimatePresence>
                  {addressModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-6 select-none">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setAddressModalOpen(false)}
                        className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer animate-fade-in"
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-[var(--surface-bright)] border border-border-light rounded-[24px] p-7 max-w-[540px] w-full relative z-10 text-left shadow-2xl overflow-y-auto max-h-[85vh] text-[var(--text-primary)]"
                      >
                        <div className="flex justify-between items-center mb-5 border-b border-border-light/45 pb-3">
                          <h3 className="text-base font-bold flex items-center gap-2">
                            <MapPin size={16} className="text-primary" />
                            {isEditingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                          </h3>
                          <button onClick={() => setAddressModalOpen(false)} className="btn-icon btn-circle w-7 h-7">
                            <X size={13} />
                          </button>
                        </div>

                        {addressFormError && (
                          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-3.5 mb-5 text-[13px] flex items-center gap-2">
                            <ShieldAlert size={15} />
                            <span>{addressFormError}</span>
                          </div>
                        )}

                        {addressFormSuccess && (
                          <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-xl p-3.5 mb-5 text-[13px] flex items-center gap-2">
                            <CheckCircle size={15} />
                            <span>{addressFormSuccess}</span>
                          </div>
                        )}

                        <form onSubmit={handleAddressSubmit} className="flex flex-col gap-4.5">
                          {/* Address Type segmented buttons */}
                          <div>
                            <label className="block text-[12px] font-semibold text-text-secondary mb-2">Address Type</label>
                            <div className="grid grid-cols-4 gap-2">
                              {['Home', 'Work', 'Apartment', 'Other'].map((type) => (
                                <button
                                  type="button"
                                  key={type}
                                  onClick={() => setAddrType(type)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    addrType === type 
                                      ? 'bg-primary border-primary text-white shadow-sm' 
                                      : 'bg-white/[0.02] border-border-light text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">House / Flat No.</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="e.g. Flat 402, 4th Floor"
                                value={addrHouseNumber}
                                onChange={(e) => setAddrHouseNumber(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Street / Road *</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="e.g. Hill Road, Bandra West"
                                value={addrStreet}
                                onChange={(e) => setAddrStreet(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Locality / Area *</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="e.g. Bandra West"
                                value={addrArea}
                                onChange={(e) => setAddrArea(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Landmark (Optional)</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="e.g. Near Mehboob Studio"
                                value={addrLandmark}
                                onChange={(e) => setAddrLandmark(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Indian City *</label>
                              <select 
                                className="glass-input !h-10 text-[13px] !py-0 !px-2.5 rounded-xl cursor-pointer"
                                value={addrCity}
                                onChange={(e) => setAddrCity(e.target.value)}
                                required
                              >
                                {CITIES.map(c => (
                                  <option key={c} value={c} className="bg-[var(--surface-bright)] text-[var(--text-primary)]">{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">State *</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="e.g. Maharashtra"
                                value={addrState}
                                onChange={(e) => setAddrState(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-semibold text-text-secondary mb-1.5">Pincode *</label>
                              <input 
                                type="text" 
                                className="glass-input !h-10 text-[13px]" 
                                placeholder="6 digits (e.g. 400050)"
                                value={addrPincode}
                                onChange={(e) => setAddrPincode(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          {/* Default toggle switch */}
                          <div className="flex items-center gap-2 mt-2">
                            <input 
                              type="checkbox" 
                              id="addrIsDefault"
                              checked={addrIsDefault}
                              onChange={(e) => setAddrIsDefault(e.target.checked)}
                              className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                            <label htmlFor="addrIsDefault" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                              Set as primary active delivery target
                            </label>
                          </div>

                          <button 
                            type="submit" 
                            className={`w-full h-11 bg-primary text-white border-none rounded-xl font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer hover:bg-primary-hover active:scale-[0.98] transition-all ${
                              addressFormLoading ? 'opacity-75 pointer-events-none' : ''
                            }`}
                          >
                            {addressFormLoading ? 'Saving...' : 'Save Address Info'}
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* TAB 5: ACCOUNT SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                
                {/* Account Details Form */}
                <div className="glass-panel p-8 rounded-[24px]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                    <User size={20} className="text-primary" />
                    Personal Details
                  </h3>

                  {formError && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-3.5 mb-6 text-[13px] flex items-center gap-2">
                      <ShieldAlert size={15} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-xl p-3.5 mb-6 text-[13px] flex items-center gap-2">
                      <CheckCircle size={15} />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Full Name</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Your Full Name"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Username / Handle *</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Your unique handle"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Email Address *</label>
                        <input 
                          type="email" 
                          className="glass-input" 
                          placeholder="your.email@example.com"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Phone Number</label>
                        <input 
                          type="tel" 
                          className="glass-input" 
                          placeholder="+91 99999 99999"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Short Foodie Vibe / Bio</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Coffee seeker, spicy ramen champion..."
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-text-secondary mb-2">Delivery Address</label>
                      <textarea 
                        rows="2"
                        className="glass-input resize-none rounded-xl" 
                        placeholder="123 Cozy Street, Bandra West, Mumbai, 400050"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                    </div>


                    {/* Personal Foodie Preferences Segmented Control */}
                    <div className="border-t border-border-light/35 pt-6 mt-6">
                      <h4 className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary animate-stir" />
                        Personal Food Preferences & Tastes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Dietary Classification</label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {['Any', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'].map((diet) => (
                              <button
                                type="button"
                                key={diet}
                                onClick={() => setEditPreferences(prev => ({ ...prev, dietary: diet }))}
                                className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                                  editPreferences.dietary === diet 
                                    ? 'bg-primary border-primary text-white shadow-sm' 
                                    : 'bg-white/[0.02] border-border-light text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                                }`}
                              >
                                {diet}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Spice Tolerance Level</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['Mild', 'Medium', 'Hot', 'Extra Hot'].map((level) => (
                              <button
                                type="button"
                                key={level}
                                onClick={() => setEditPreferences(prev => ({ ...prev, spicyLevel: level }))}
                                className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                                  editPreferences.spicyLevel === level 
                                    ? 'bg-primary border-primary text-white shadow-sm' 
                                    : 'bg-white/[0.02] border-border-light text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-4 cursor-pointer hover:bg-primary-hover active:scale-[0.98] transition-all ${formLoading ? 'btn-disabled' : ''}`}
                      disabled={formLoading}
                    >
                      {formLoading ? 'Saving Telemetry...' : 'Save Settings Details'}
                    </button>

                  </form>
                </div>

                {/* Password Change Card */}
                <div className="glass-panel p-8 rounded-[24px]">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                    <Lock size={20} className="text-primary" />
                    Security & Password Gate
                  </h3>

                  {passError && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-3.5 mb-6 text-[13px] flex items-center gap-2">
                      <ShieldAlert size={15} />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-xl p-3.5 mb-6 text-[13px] flex items-center gap-2">
                      <CheckCircle size={15} />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Current Active Password</label>
                        <input 
                          type="password" 
                          className="glass-input" 
                          placeholder="••••••••"
                          value={currPassword}
                          onChange={(e) => setCurrPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">New Security Handshake Password</label>
                        <input 
                          type="password" 
                          className="glass-input" 
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn btn-pill bg-white/[0.05] border border-border-light hover:bg-white/[0.1] text-text-primary h-11 flex items-center justify-center mt-2 ${passLoading ? 'btn-disabled' : ''}`}
                      disabled={passLoading}
                    >
                      {passLoading ? 'Encrypting Code...' : 'Update Password Credentials'}
                    </button>

                  </form>
                </div>

                {/* Danger Zone Account Deletion */}
                <div className="glass-panel p-8 rounded-[24px] border border-red-500/20 bg-red-500/[0.02] shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500 text-left">
                    <ShieldAlert size={20} />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-text-secondary mb-6 leading-relaxed text-left">
                    Permanently delete your entire Savoré gastronomical profile. This will instantly wipe all active orders, saved kitchen lists, comments history, and role credentials. This action is irreversible.
                  </p>

                  <button 
                    type="button" 
                    onClick={() => { soundController?.playClick(); setDeleteModalOpen(true); }}
                    className="btn bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs py-3 px-6 rounded-xl border-none cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all active:scale-[0.98]"
                  >
                    Delete Account Permanently
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. DANGER ZONE CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 select-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer animate-fade-in"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[var(--surface-bright)] border border-red-500/20 rounded-[24px] p-8 max-w-[480px] w-full relative z-10 text-left shadow-2xl overflow-y-auto text-[var(--text-primary)]"
            >
              <div className="flex items-center gap-3 border-b border-border-light/45 pb-4 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                  <ShieldAlert size={20} className="animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Irreversible Account Deletion</h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Are you absolutely sure you want to permanently delete your Savoré profile? This will terminate your session and completely purge your database record. This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { soundController?.playClick(); setDeleteModalOpen(false); }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-border-light text-text-secondary hover:text-text-primary hover:bg-white/[0.04] cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] ${
                    deleteLoading ? 'opacity-70 pointer-events-none' : ''
                  }`}
                >
                  {deleteLoading ? 'Purging Profile...' : 'Confirm Permanent Deletion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
