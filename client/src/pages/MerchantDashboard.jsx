import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Play, ShoppingBag, Plus, 
  Upload, Film, Settings, RefreshCw, CheckCircle, 
  IndianRupee, Check, X, ShieldAlert, AlertCircle, 
  FileText, Trash2, Edit3, Eye, Heart, MessageSquare, 
  Clock, Utensils, ToggleLeft, ToggleRight, DollarSign, 
  Calendar, BarChart3, ChevronRight, Layers, Award, Sparkles, Image, Lock
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { OrderContext } from '../context/OrderContext';
import { CITIES } from '../context/LocationContext';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeAvatar from '../components/SafeAvatar';
import SafeImage from '../components/SafeImage';
import { io } from 'socket.io-client';
import { soundController } from '../components/ChefSystem/SoundController';

// Premium Apple/Stripe-Inspired Custom SVG Analytics Charts Component
function AnalyticsCharts({ analytics, menuLength, reelsCount }) {
  const R = analytics?.totalRevenue || 0;
  const completedOrders = analytics?.completedOrders || 0;

  // Read real time-series aggregated data from analytics (with fallbacks if empty/loading)
  const monthlyRevenue = analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0
    ? analytics.monthlyRevenue
    : [
        { month: 'Dec', val: R * 0.12 },
        { month: 'Jan', val: R * 0.28 },
        { month: 'Feb', val: R * 0.45 },
        { month: 'Mar', val: R * 0.62 },
        { month: 'Apr', val: R * 0.84 },
        { month: 'May', val: R }
      ];

  const dailyOrders = analytics?.weeklySpikes && analytics.weeklySpikes.length > 0
    ? analytics.weeklySpikes
    : [
        { day: 'Mon', count: Math.round(completedOrders * 0.1) },
        { day: 'Tue', count: Math.round(completedOrders * 0.12) },
        { day: 'Wed', count: Math.round(completedOrders * 0.18) },
        { day: 'Thu', count: Math.round(completedOrders * 0.15) },
        { day: 'Fri', count: Math.round(completedOrders * 0.22) },
        { day: 'Sat', count: Math.round(completedOrders * 0.25) },
        { day: 'Sun', count: Math.round(completedOrders * 0.08) }
      ];

  const lineX = (index) => 45 + index * 80;
  const lineY = (value) => {
    if (R === 0) return 140;
    const ratio = value / R;
    return 140 - ratio * 105; // range between 35 (top) and 140 (bottom)
  };

  let curveD = '';
  if (monthlyRevenue.length > 0) {
    curveD = `M ${lineX(0)} ${lineY(monthlyRevenue[0].val)}`;
    for (let i = 0; i < monthlyRevenue.length - 1; i++) {
      const x0 = lineX(i);
      const y0 = lineY(monthlyRevenue[i].val);
      const x1 = lineX(i + 1);
      const y1 = lineY(monthlyRevenue[i + 1].val);
      
      const cpX1 = x0 + (x1 - x0) / 2;
      const cpY1 = y0;
      const cpX2 = x0 + (x1 - x0) / 2;
      const cpY2 = y1;
      
      curveD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
    }
  }

  let areaD = '';
  if (curveD) {
    areaD = `${curveD} L ${lineX(monthlyRevenue.length - 1)} 140 L ${lineX(0)} 140 Z`;
  }

  const barWidth = 22;
  const maxOrders = Math.max(...dailyOrders.map(d => d.count), 5);
  const barHeightRatio = 100 / maxOrders;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mt-3">
      {/* Stripe-style Revenue Line Chart */}
      <div className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] p-6 text-left flex flex-col justify-between relative overflow-hidden">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary mb-0.5">Monthly Revenue Growth</h4>
          <p className="text-[12px] text-text-secondary">Sales velocity tracking</p>
        </div>
        
        <div className="h-44 w-full mt-6 relative select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 165">
            <defs>
              <linearGradient id="revenue-glow-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dotted horizontal grids */}
            <line x1="45" y1="35" x2="445" y2="35" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="87" x2="445" y2="87" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="140" x2="445" y2="140" stroke="rgba(255,255,255,0.06)" />

            {areaD && <path d={areaD} fill="url(#revenue-glow-gradient)" />}

            {curveD && (
              <motion.path 
                d={curveD} 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="2" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {monthlyRevenue.map((pt, idx) => (
              <g key={pt.month}>
                <circle 
                  cx={lineX(idx)} 
                  cy={lineY(pt.val)} 
                  r="3.5" 
                  fill="var(--bg-primary)" 
                  stroke="var(--primary)" 
                  strokeWidth="1.5" 
                  className="cursor-pointer"
                />
                <text 
                  x={lineX(idx)} 
                  y={lineY(pt.val) - 8} 
                  textAnchor="middle" 
                  className="text-[9px] fill-text-secondary font-bold"
                >
                  ₹{Math.round(pt.val)}
                </text>
              </g>
            ))}

            {monthlyRevenue.map((pt, idx) => (
              <text 
                key={pt.month}
                x={lineX(idx)} 
                y="158" 
                textAnchor="middle" 
                className="text-[10px] fill-text-muted font-bold"
              >
                {pt.month}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Weekly Order Bars Chart */}
      <div className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] p-6 text-left flex flex-col justify-between relative overflow-hidden">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary mb-0.5">Weekly Delivery Spikes</h4>
          <p className="text-[12px] text-text-secondary">Distributions across active calendar days</p>
        </div>

        <div className="h-44 w-full mt-6 relative select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 165">
            <line x1="45" y1="40" x2="445" y2="40" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="90" x2="445" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="140" x2="445" y2="140" stroke="rgba(255,255,255,0.06)" />

            {dailyOrders.map((pt, idx) => {
              const x = 45 + idx * 56 + 14;
              const h = pt.count * barHeightRatio;
              const y = 140 - h;
              return (
                <g key={pt.day}>
                  <rect 
                    x={x} 
                    y="40" 
                    width={barWidth} 
                    height="100" 
                    fill="rgba(255,255,255,0.005)" 
                    rx="3" 
                  />
                  <motion.rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={Math.max(h, 4)} 
                    fill="rgba(255, 90, 60, 0.85)"
                    rx="3"
                    className="hover:fill-primary transition-colors"
                    initial={{ height: 0, y: 140 }}
                    animate={{ height: Math.max(h, 4), y }}
                    transition={{ duration: 0.8, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <text 
                    x={x + barWidth / 2} 
                    y={y - 6} 
                    textAnchor="middle" 
                    className="text-[9.5px] fill-text-primary font-bold"
                  >
                    {pt.count}
                  </text>
                </g>
              );
            })}

            {dailyOrders.map((pt, idx) => {
              const x = 45 + idx * 56 + 14 + barWidth / 2;
              return (
                <text 
                  key={pt.day}
                  x={x} 
                  y="158" 
                  textAnchor="middle" 
                  className="text-[10px] fill-text-muted font-bold"
                >
                  {pt.day}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// Premium simulated interactive delivery tracking map (Merchant View)
function DeliveryMapSimulator({ orderId, onCompleteClick }) {
  const progressKey = `delivery_progress_${orderId}`;
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(progressKey);
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    if (progress >= 100) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1, 100);
        localStorage.setItem(progressKey, next.toString());
        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [progress, orderId]);

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
    <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 mt-4 text-left select-none relative overflow-hidden w-full max-w-[460px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          Active Rider Simulation Map
        </span>
        <span className="text-[11.5px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {progress}% Completed
        </span>
      </div>

      <div className="w-full h-36 bg-background-primary border border-white/[0.04] rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px]" />
        
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <radialGradient id="rest-glow-m" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="home-glow-m" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path 
            d="M 50 150 L 120 150 L 120 60 L 260 60 L 260 130 L 350 130" 
            fill="none" 
            stroke="var(--border-light)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeDasharray="4,5"
          />

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

          <circle cx="50" cy="150" r="16" fill="url(#rest-glow-m)" />
          <circle cx="50" cy="150" r="5" fill="var(--primary)" />
          <text x="50" y="174" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Kitchen</text>

          <circle cx="350" cy="130" r="16" fill="url(#home-glow-m)" />
          <circle cx="350" cy="130" r="5" fill="var(--accent)" />
          <text x="350" y="154" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Customer</text>

          <g transform={`translate(${x}, ${y}) rotate(${angle})`} style={{ transition: 'transform 400ms linear' }}>
            <circle cx="0" cy="0" r="10" fill="var(--primary)" className="animate-ping" style={{ opacity: 0.15 }} />
            <circle cx="0" cy="0" r="8" fill="var(--primary)" />
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

      <div className="flex gap-4 mt-3 items-center w-full max-w-[460px]">
        <div className="grid grid-cols-2 gap-4 bg-white/[0.005] rounded-lg p-2 text-center text-[12px] border border-white/[0.02] flex-grow">
          <div>
            <span className="text-[9.5px] text-text-muted block font-semibold uppercase tracking-wider">Est. Completion</span>
            <span className="font-bold text-text-primary">{remainingSeconds}s ({remainingMeters}m)</span>
          </div>
          <div>
            <span className="text-[9.5px] text-text-muted block font-semibold uppercase tracking-wider">Simulation Mode</span>
            <span className="font-bold text-[var(--accent)]">3PL Webhook</span>
          </div>
        </div>

        <button
          onClick={onCompleteClick}
          className={`btn btn-pill text-[12px] font-bold px-4 py-3 h-10 flex items-center justify-center transition-all ${
            progress < 100
              ? 'bg-white/5 border border-white/10 text-text-muted cursor-not-allowed opacity-50'
              : 'btn-primary text-white cursor-pointer shadow-[var(--shadow-glow)]'
          }`}
          disabled={progress < 100}
        >
          {progress < 100 ? 'In Transit' : 'Complete ✓'}
        </button>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isOwner } = useContext(AuthContext);
  const { fetchRestaurantOrders, updateOrderStatus } = useContext(OrderContext);

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, orders, menu, reels, comments, settings
  const [analytics, setAnalytics] = useState(null);
  
  // Tab specific telemetry
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [restaurantReels, setRestaurantReels] = useState([]);
  const [comments, setComments] = useState([]);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  
  // Loading indicators
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Global message feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [toastOrder, setToastOrder] = useState(null);
  const [previewReel, setPreviewReel] = useState(null);
  
  // Registration state
  const [hasRestaurant, setHasRestaurant] = useState(true);
  const [regName, setRegName] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regCover, setRegCover] = useState('');
  const [regTags, setRegTags] = useState('');
  const [regCuisines, setRegCuisines] = useState('');
  const [regTime, setRegTime] = useState(30);
  const [regFee, setRegFee] = useState(0);
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Menu Category Filter states
  const [menuFilter, setMenuFilter] = useState('All');

  // Drawers and Forms states
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishFormName, setDishFormName] = useState('');
  const [dishFormDesc, setDishFormDesc] = useState('');
  const [dishFormPrice, setDishFormPrice] = useState('');
  const [dishFormCategory, setDishFormCategory] = useState('Main Course');
  const [dishFormImage, setDishFormImage] = useState('');
  const [dishFormAvailable, setDishFormAvailable] = useState(true);
  const [dishFormLoading, setDishFormLoading] = useState(false);
  const [dishFormError, setDishFormError] = useState('');

  // Video reels edit/delete modals state
  const [reelModalOpen, setReelModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [reelFormCaption, setReelFormCaption] = useState('');
  const [reelFormTags, setReelFormTags] = useState('');
  const [reelFormLoading, setReelFormLoading] = useState(false);
  const [reelFormError, setReelFormError] = useState('');
  
  // Reels upload variables
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reelCaption, setReelCaption] = useState('');
  const [reelTags, setReelTags] = useState('');
  const [reelsSubTab, setReelsSubTab] = useState('catalog'); // catalog, publish

  // Custom Delete Confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetType, setDeleteTargetType] = useState(''); // 'dish', 'reel'
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Kitchen Settings Form State
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsCover, setSettingsCover] = useState('');
  const [settingsCuisines, setSettingsCuisines] = useState('');
  const [settingsTags, setSettingsTags] = useState('');
  const [settingsTime, setSettingsTime] = useState('');
  const [settingsFee, setSettingsFee] = useState('');
  const [settingsTimings, setSettingsTimings] = useState('');
  const [settingsCity, setSettingsCity] = useState('Mumbai');
  const [settingsLocality, setSettingsLocality] = useState('');
  const [settingsPriceRange, setSettingsPriceRange] = useState('₹₹');
  const [settingsLat, setSettingsLat] = useState('');
  const [settingsLng, setSettingsLng] = useState('');
  const [settingsDeliveryRadius, setSettingsDeliveryRadius] = useState('');
  const [settingsServiceableZones, setSettingsServiceableZones] = useState('');
  const [settingsUpiVpa, setSettingsUpiVpa] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Core background handshakes
  const fetchDashboardData = async () => {
    if (!isAuthenticated || !isOwner) return;
    setAnalyticsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/restaurants/owner/analytics');
      if (res.data && res.data.success) {
        setAnalytics(res.data.data);
        setHasRestaurant(true);
        
        // Populate menu in background for total counts
        try {
          const detailsRes = await api.get('/restaurants/owner/details');
          if (detailsRes.data && detailsRes.data.success) {
            setRestaurantDetails(detailsRes.data.data);
            const restId = detailsRes.data.data._id;
            const menuRes = await api.get(`/restaurants/${restId}`);
            if (menuRes.data && menuRes.data.success) {
              setMenu(menuRes.data.data.menu || []);
            }
          }
        } catch (mErr) {
          console.warn('Background menu counts lookup failed');
        }
      }
    } catch (err) {
      if (err.status === 404) {
        setHasRestaurant(false);
      } else {
        setErrorMsg(err.message || 'Failed to retrieve SaaS analytics');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Orders Retrieval
  const fetchOrdersData = async (targetPage = 1) => {
    if (!hasRestaurant) return;
    setOrdersLoading(true);
    try {
      const res = await fetchRestaurantOrders(targetPage, 10);
      if (res && res.data) {
        setOrders(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to load incoming orders:', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Menu items fetching
  const fetchMenuData = async () => {
    if (!hasRestaurant) return;
    setMenuLoading(true);
    try {
      const detailsRes = await api.get('/restaurants/owner/details');
      if (detailsRes.data && detailsRes.data.success) {
        const restId = detailsRes.data.data._id;
        const res = await api.get(`/restaurants/${restId}`);
        if (res.data && res.data.success) {
          setMenu(res.data.data.menu || []);
        }
      }
    } catch (err) {
      console.error('Menu load error:', err.message);
    } finally {
      setMenuLoading(false);
    }
  };

  // Video reels fetching
  const fetchReelsData = async () => {
    if (!hasRestaurant) return;
    setReelsLoading(true);
    try {
      const res = await api.get('/reels/owner');
      if (res.data && res.data.success) {
        setRestaurantReels(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reels data:', err.message);
    } finally {
      setReelsLoading(false);
    }
  };

  // Feedback reviews fetching
  const fetchCommentsData = async () => {
    if (!hasRestaurant) return;
    setCommentsLoading(true);
    try {
      const res = await api.get('/restaurants/owner/comments');
      if (res.data && res.data.success) {
        setComments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to retrieve client comments feed:', err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Complete profile configurations fetching
  const fetchRestaurantDetails = async () => {
    if (!hasRestaurant) return;
    setDetailsLoading(true);
    try {
      const res = await api.get('/restaurants/owner/details');
      if (res.data && res.data.success) {
        const rest = res.data.data;
        setRestaurantDetails(rest);
        setSettingsName(rest.name || '');
        setSettingsDesc(rest.description || '');
        setSettingsCover(rest.coverImage || '');
        setSettingsCuisines(rest.cuisines?.join(', ') || '');
        setSettingsTags(rest.tags?.join(', ') || '');
        setSettingsTime(rest.deliveryTime || 30);
        setSettingsFee(rest.deliveryFee || 0);
        setSettingsTimings(rest.timings || '11:00 AM - 11:00 PM');
        setSettingsCity(rest.city || 'Mumbai');
        setSettingsLocality(rest.locality || '');
        setSettingsPriceRange(rest.priceRange || '₹₹');
        setSettingsLat(rest.coordinates?.coordinates?.[1] || 19.0596);
        setSettingsLng(rest.coordinates?.coordinates?.[0] || 72.8258);
        setSettingsDeliveryRadius(rest.deliveryRadius || 5);
        setSettingsServiceableZones(rest.serviceableZones?.join(', ') || '');
        setSettingsUpiVpa(rest.upiVpa || '');
      }
    } catch (err) {
      console.error('Kitchen profile loading failed:', err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isOwner) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, isOwner, navigate]);

  // Socket.io integration for live incoming order alerts
  useEffect(() => {
    if (!isAuthenticated || !isOwner || !user?._id) return;

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const token = localStorage.getItem('savore_access_token');
    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to Savoré WebSocket server');
      socket.emit('join_merchant_room', user._id);
      setIsSocketConnected(true);
    });

    socket.on('new_order_alert', (data) => {
      console.log('🔔 New incoming order alert received:', data);
      
      // Ensure sound controller plays chime sound (enable it temporarily if not initialized/muted)
      if (soundController) {
        const originalState = soundController.isEnabled;
        soundController.isEnabled = true;
        soundController.playChime();
        soundController.isEnabled = originalState;
      }

      // Show floating toast alert if the order is newly placed/pending
      if (data.status === 'pending') {
        setToastOrder({
          id: data.orderId,
          total: data.total
        });
      }

      // Reload dashboard analytics and orders data instantly
      fetchDashboardData();
      fetchOrdersData(1);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setIsSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, isOwner, user?._id]);

  // Dynamic router to load specific sub-telemetries instantly on tab clicks
  useEffect(() => {
    if (hasRestaurant) {
      if (activeTab === 'orders') {
        fetchOrdersData(1);
      } else if (activeTab === 'menu') {
        fetchMenuData();
      } else if (activeTab === 'reels') {
        fetchReelsData();
      } else if (activeTab === 'comments') {
        fetchCommentsData();
      } else if (activeTab === 'settings') {
        fetchRestaurantDetails();
      }
    }
  }, [hasRestaurant, activeTab]);

  // Handle Restaurant Profile setup
  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('Restaurant name is required');
      return;
    }
    setRegSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        name: regName.trim(),
        description: regDesc.trim(),
        coverImage: regCover.trim() || undefined,
        tags: regTags.split(',').map(t => t.trim()).filter(Boolean),
        cuisines: regCuisines.split(',').map(c => c.trim()).filter(Boolean),
        deliveryTime: parseInt(regTime) || 30,
        deliveryFee: parseFloat(regFee) || 0.0,
      };

      const res = await api.post('/restaurants', payload);
      if (res.data && res.data.success) {
        setHasRestaurant(true);
        fetchDashboardData();
        setActiveTab('analytics');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Profile setup failed. Please try again.');
    } finally {
      setRegSubmitting(false);
    }
  };

  // Update order status handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrdersData(page);
      fetchDashboardData();
    } catch (err) {
      console.error('Status modification failed:', err.message);
    }
  };

  // Open Dish drawer in add/edit configurations
  const openDishDrawer = (dish = null) => {
    setEditingDish(dish);
    if (dish) {
      setDishFormName(dish.name || '');
      setDishFormDesc(dish.description || '');
      setDishFormPrice(dish.price || '');
      setDishFormCategory(dish.category || 'Main Course');
      setDishFormImage(dish.image || '');
      setDishFormAvailable(dish.isAvailable !== false);
    } else {
      setDishFormName('');
      setDishFormDesc('');
      setDishFormPrice('');
      setDishFormCategory('Main Course');
      setDishFormImage('');
      setDishFormAvailable(true);
    }
    setDishFormError('');
    setMenuDrawerOpen(true);
  };

  // Handle addition/edition of dishes
  const handleDishFormSubmit = async (e) => {
    e.preventDefault();
    if (!dishFormName.trim() || !dishFormPrice || !dishFormCategory) {
      setDishFormError('Please fill in name, price, and category.');
      return;
    }
    setDishFormLoading(true);
    setDishFormError('');
    try {
      // First ensure we have active restaurant profile
      const detailsRes = await api.get('/restaurants/owner/details');
      if (!detailsRes.data || !detailsRes.data.success) {
        throw new Error('Restaurant profile lookup failed.');
      }
      const restId = detailsRes.data.data._id;

      const payload = {
        name: dishFormName.trim(),
        description: dishFormDesc.trim(),
        price: parseFloat(dishFormPrice),
        category: dishFormCategory.trim(),
        image: dishFormImage.trim() || undefined,
        isAvailable: dishFormAvailable,
        restaurant: restId
      };

      let res;
      if (editingDish) {
        res = await api.put(`/food/${editingDish._id}`, payload);
      } else {
        res = await api.post('/food', payload);
      }

      if (res.data && res.data.success) {
        setMenuDrawerOpen(false);
        fetchMenuData();
        fetchDashboardData(); // sync count on cards
      }
    } catch (err) {
      setDishFormError(err.message || 'Failed to persist menu dish items details.');
    } finally {
      setDishFormLoading(false);
    }
  };

  // Optimistic Toggle Stock switcher directly inside the card list
  const handleToggleStock = async (item) => {
    try {
      // Optimistic state updates
      setMenu(prev => prev.map(m => m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m));
      
      const res = await api.put(`/food/${item._id}`, { isAvailable: !item.isAvailable });
      if (!res.data || !res.data.success) {
        // Fallback on fail
        fetchMenuData();
      }
    } catch (err) {
      fetchMenuData();
    }
  };

  // Open confirm delete portals
  const confirmDeletion = (type, id, name) => {
    setDeleteTargetType(type);
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteConfirmOpen(true);
  };

  // Run actual deletion on confirmation trigger
  const executeDeleteAction = async () => {
    try {
      if (deleteTargetType === 'dish') {
        const res = await api.delete(`/food/${deleteTargetId}`);
        if (res.data && res.data.success) {
          fetchMenuData();
          fetchDashboardData();
        }
      } else if (deleteTargetType === 'reel') {
        const res = await api.delete(`/reels/${deleteTargetId}`);
        if (res.data && res.data.success) {
          fetchReelsData();
          fetchDashboardData();
        }
      }
      setDeleteConfirmOpen(false);
    } catch (err) {
      setErrorMsg(err.message || `Failed to delete ${deleteTargetType}`);
      setDeleteConfirmOpen(false);
    }
  };

  // Open Edit Reel modal
  const openReelModal = (reel) => {
    setEditingReel(reel);
    setReelFormCaption(reel.caption || '');
    setReelFormTags(reel.tags?.join(', ') || '');
    setReelFormError('');
    setReelModalOpen(true);
  };

  // Submit reel captions edits
  const handleReelFormSubmit = async (e) => {
    e.preventDefault();
    setReelFormLoading(true);
    setReelFormError('');
    try {
      const res = await api.put(`/reels/${editingReel._id}`, {
        caption: reelFormCaption.trim(),
        tags: reelFormTags
      });
      if (res.data && res.data.success) {
        setReelModalOpen(false);
        fetchReelsData();
      }
    } catch (err) {
      setReelFormError(err.message || 'Failed to update reel.');
    } finally {
      setReelFormLoading(false);
    }
  };

  // Handle Video Recipe Reel uploads via Multer
  const handleReelUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a vertical .mp4 video file to upload.');
      return;
    }
    if (!selectedFile.name.endsWith('.mp4')) {
      setErrorMsg('Only vertical .mp4 video formats are supported.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setErrorMsg('');
    setUploadSuccess(false);

    try {
      const restRes = await api.get('/restaurants/owner/details');
      if (!restRes.data || !restRes.data.success) {
        throw new Error('Could not identify restaurant registration profile.');
      }
      const restaurantId = restRes.data.data._id;

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('caption', reelCaption.trim());
      formData.append('tags', reelTags);
      formData.append('restaurant', restaurantId);

      setUploadProgress(45);

      const uploadRes = await api.post('/reels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pEvent) => {
          const progressPercent = Math.round((pEvent.loaded * 100) / pEvent.total);
          setUploadProgress(Math.max(45, Math.min(95, progressPercent)));
        }
      });

      if (uploadRes.data && uploadRes.data.success) {
        setUploadProgress(100);
        setUploadSuccess(true);
        setReelCaption('');
        setReelTags('');
        setSelectedFile(null);
        fetchReelsData();
        fetchDashboardData();
        setTimeout(() => setUploadSuccess(false), 6000);
        setReelsSubTab('catalog'); // toggle view to show list
      }
    } catch (err) {
      setErrorMsg(err.message || 'Reel media file processing failed.');
    } finally {
      setUploading(false);
    }
  };

  // Save general kitchen details updates
  const handleSaveKitchenSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess('');
    setErrorMsg('');
    try {
      const payload = {
        name: settingsName.trim(),
        description: settingsDesc.trim(),
        coverImage: settingsCover.trim(),
        cuisines: settingsCuisines.split(',').map(c => c.trim()).filter(Boolean),
        tags: settingsTags.split(',').map(t => t.trim()).filter(Boolean),
        deliveryTime: parseInt(settingsTime) || 30,
        deliveryFee: parseFloat(settingsFee) || 0.0,
        timings: settingsTimings.trim(),
        city: settingsCity,
        locality: settingsLocality.trim(),
        priceRange: settingsPriceRange,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(settingsLng) || 72.8258, parseFloat(settingsLat) || 19.0596]
        },
        deliveryRadius: parseFloat(settingsDeliveryRadius) || 5,
        serviceableZones: settingsServiceableZones.split(',').map(z => z.trim()).filter(Boolean),
        upiVpa: settingsUpiVpa.trim()
      };
      
      const res = await api.put('/restaurants/owner/details', payload);
      if (res.data && res.data.success) {
        setSettingsSuccess('Kitchen settings updated successfully!');
        fetchRestaurantDetails();
        fetchDashboardData();
        setTimeout(() => setSettingsSuccess(''), 5000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save kitchen settings details.');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (analyticsLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <RefreshCw className="animate-stir text-primary" size={32} />
      </div>
    );
  }

  // REGISTRATION IF KITCHEN PROFILE DOES NOT EXIST
  if (!hasRestaurant) {
    return (
      <div className="container fade-in py-12 px-6 pb-24 flex justify-center">
        <div className="glass-panel w-full max-w-[620px] p-8 md:p-10 rounded-[24px] text-left">
          
          <div className="flex gap-4 bg-orange-500/10 p-5 rounded-2xl border border-primary/20 mb-8">
            <ShieldAlert size={26} className="text-primary shrink-0" />
            <div>
              <h3 className="text-base font-bold text-primary mb-1">Establish Kitchen Profile</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                You are registered as a merchant partner. Please establish your restaurant kitchen details below to list menus, accept client orders, and upload video recipe Reels.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3.5 mb-6 text-[13px]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegisterRestaurant} className="flex flex-col gap-5">
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                Restaurant / Kitchen Name *
              </label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="L'Atelier de Joël Robuchon" 
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                Gastronomy Description
              </label>
              <textarea 
                className="glass-input resize-none rounded-xl" 
                rows="3"
                placeholder="Artisan truffles, fine french dining, Michelin chef selections..." 
                value={regDesc}
                onChange={(e) => setRegDesc(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                Cover Image URL
              </label>
              <input 
                type="url" 
                className="glass-input" 
                placeholder="https://images.unsplash.com/..." 
                value={regCover}
                onChange={(e) => setRegCover(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                  Cuisines (Comma separated)
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="French, Cafe, Desserts" 
                  value={regCuisines}
                  onChange={(e) => setRegCuisines(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                  Aesthetic Tags (Comma separated)
                </label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Michelin Star, Spicy, Organic" 
                  value={regTags}
                  onChange={(e) => setRegTags(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                  Avg. Delivery Time (Minutes)
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  min="5" 
                  value={regTime}
                  onChange={(e) => setRegTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                  Delivery Fee (₹)
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  step="0.01" 
                  min="0" 
                  value={regFee}
                  onChange={(e) => setRegFee(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary h-12 flex items-center justify-center gap-2.5 mt-3 ${regSubmitting ? 'btn-disabled' : ''}`}
              disabled={regSubmitting}
            >
              {regSubmitting ? (
                <>
                  <RefreshCw className="animate-stir" size={18} /> Building SaaS Profile...
                </>
              ) : (
                'Save Kitchen Profile'
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // MAIN HIGH-FIDELITY DASHBOARD
  const computedCTR = (views, clicks) => {
    if (!views) return '0.0';
    return ((clicks / views) * 100).toFixed(1);
  };

  return (
    <>
      <div className="container fade-in px-6 pb-32 text-left -mt-16 md:-mt-20">

      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toastOrder && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed top-6 right-6 z-[9999] w-[340px] glass-floating border-primary/40 rounded-2xl p-5 shadow-[0_12px_40px_rgba(255,106,77,0.25)] text-left flex flex-col gap-3.5 select-none"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">New Order Placed!</span>
              </div>
              <button 
                onClick={() => setToastOrder(null)} 
                className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer p-0.5 rounded-lg flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div>
              <h4 className="text-[14px] font-bold text-text-primary">Order ID: #{toastOrder.id.substring(toastOrder.id.length - 8).toUpperCase()}</h4>
              <p className="text-[13px] text-text-secondary mt-1">
                Total: <strong className="text-primary font-extrabold">{formatPrice(toastOrder.total)}</strong>
              </p>
            </div>

            <div className="flex gap-2.5 mt-1">
              <button
                onClick={() => {
                  setToastOrder(null);
                  setActiveTab('orders');
                  fetchOrdersData(1);
                }}
                className="btn btn-secondary px-3 py-1.5 rounded-xl text-[11px] font-bold flex-1 text-center"
              >
                View
              </button>
              <button
                onClick={async () => {
                  const targetId = toastOrder.id;
                  setToastOrder(null);
                  try {
                    await handleUpdateStatus(targetId, 'preparing');
                  } catch (err) {
                    console.error('Failed to accept order from toast:', err.message);
                  }
                }}
                className="btn btn-primary px-3 py-1.5 rounded-xl text-[11px] font-bold flex-1 text-center"
              >
                Accept Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. BRAND COVER HEADER BACKDROP */}
      <div className="relative glass-panel rounded-[24px] overflow-hidden mb-8 border-[1.5px] border-[var(--border-glow)] shadow-[var(--shadow-glow)]">
        <div className="h-44 bg-[linear-gradient(135deg,_rgba(255,106,77,0.12)_0%,_rgba(7,10,14,0.45)_100%)] w-full relative overflow-hidden">
          <div className="absolute inset-0 backdrop-filter blur-xl opacity-60 pointer-events-none" />
          {restaurantDetails?.coverImage && (
            <img 
              src={resolveMediaUrl(restaurantDetails.coverImage)} 
              alt="Restaurant Cover Banner" 
              className="absolute inset-0 w-full h-full object-cover filter blur-[8px] opacity-40 dark:opacity-20 scale-110 transition-all duration-500"
            />
          )}
        </div>
        
        <div className="p-6 md:p-8 -mt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end text-center sm:text-left">
            <div className="relative rounded-full overflow-hidden w-24 h-24 border-[3px] border-primary shadow-xl bg-[var(--surface-bright)] select-none shrink-0 flex items-center justify-center">
              <SafeAvatar src={resolveMediaUrl(restaurantDetails?.coverImage)} alt={analytics?.restaurantName || 'Restaurant'} size={96} className="w-full h-full object-cover" />
            </div>
            <div className="mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary mt-0.5">{analytics?.restaurantName || 'Restaurant Kitchen'}</h1>
              <p className="text-sm text-text-secondary mt-1">Manage kitchen orders, dishes catalog, short reels CTR analytics and timings.</p>
            </div>
          </div>

          <div className="flex gap-2 p-1.5 bg-white/[0.02] rounded-xl select-none max-w-full overflow-x-auto shrink-0">
            {orders.some(o => o.status === 'pending') && (
              <span className="animate-pulse bg-primary text-white rounded-lg text-[10px] font-extrabold px-2.5 py-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> Live Pending Orders
              </span>
            )}
            {isSocketConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-extrabold select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Connected
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-extrabold select-none animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Offline (Syncing...)
              </div>
            )}
            <button 
              onClick={() => { fetchDashboardData(); if (hasRestaurant && activeTab === 'orders') fetchOrdersData(page); }} 
              className="bg-transparent border-none text-text-secondary hover:text-text-primary flex items-center p-2 rounded-lg cursor-pointer transition-colors"
              title="Manual Sync Feed"
            >
              <RefreshCw size={12} className="hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PERSISTENT TABS NAVIGATION STRIP */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 border-b border-border-light select-none scrollbar-none">
        {[
          { id: 'analytics', label: 'Overview', icon: BarChart3 },
          { id: 'orders', label: 'Incoming Orders', icon: ShoppingBag },
          { id: 'menu', label: 'Dishes Catalog', icon: Layers },
          { id: 'reels', label: 'Recipe Reels', icon: Film },
          { id: 'comments', label: 'Reviews Feed', icon: MessageSquare },
          { id: 'settings', label: 'Kitchen Settings', icon: Settings }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundController?.playClick();
                setActiveTab(tab.id);
                setErrorMsg('');
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13.5px] font-bold shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/[0.03] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] border border-border-light'
              }`}
            >
              <IconComp size={14} />
              {tab.label}
              {tab.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-extrabold bg-white text-primary rounded-full">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl py-3 px-4 flex items-center gap-2 mb-6 text-sm">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. MULTI-TAB DISPLAY PORT */}
      <div className="min-h-[50vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            
            {/* TAB 1: SAAS ANALYTICS OVERVIEW */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6">
                
                {/* Metric Telemetry Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left relative overflow-hidden">
                    <div className="flex justify-between items-center text-[var(--accent)]">
                      <IndianRupee size={18} className="text-primary" />
                      <TrendingUp size={14} />
                    </div>
                    <h4 className="text-[12px] text-text-muted font-bold mt-4 uppercase tracking-wider">Dining Revenue</h4>
                    <h2 className="text-2xl font-extrabold mt-1 text-text-primary">
                      {formatPrice(analytics?.totalRevenue || 0)}
                    </h2>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left relative overflow-hidden">
                    <div className="flex justify-between items-center text-primary">
                      <ShoppingBag size={18} className="text-primary" />
                      <RefreshCw size={12} className="animate-stir" />
                    </div>
                    <h4 className="text-[12px] text-text-muted font-bold mt-4 uppercase tracking-wider">Active Deliveries</h4>
                    <h2 className="text-2xl font-extrabold mt-1 text-text-primary">
                      {analytics?.activeOrders || 0}
                    </h2>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left relative overflow-hidden">
                    <div className="flex justify-between items-center text-[#ffc83b]">
                      <Layers size={18} className="text-[#ffc83b]" />
                      <Award size={14} />
                    </div>
                    <h4 className="text-[12px] text-text-muted font-bold mt-4 uppercase tracking-wider">Dishes Catalog</h4>
                    <h2 className="text-2xl font-extrabold mt-1 text-text-primary">
                      {menu.length}
                    </h2>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left relative overflow-hidden">
                    <div className="flex justify-between items-center text-[var(--accent)]">
                      <Film size={18} className="text-[var(--accent)]" />
                      <span className="text-[11px] font-extrabold text-[var(--accent)]">CTR Ratio</span>
                    </div>
                    <h4 className="text-[12px] text-text-muted font-bold mt-4 uppercase tracking-wider">Reels Placements CTR</h4>
                    <h2 className="text-2xl font-extrabold mt-1 text-text-primary">
                      {analytics?.conversionRate !== undefined ? analytics.conversionRate.toFixed(1) : '0.0'}%
                    </h2>
                    
                    {/* Glowing Circular Progress Ring (Apple Watch Activity Ring Style) */}
                    <div className="absolute right-6 bottom-5 w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background Track Circle */}
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          className="stroke-background-secondary/20 dark:stroke-white/5"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        {/* Glowing progress circle */}
                        <motion.circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke="var(--primary)"
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 18}
                          initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                          animate={{ 
                            strokeDashoffset: 2 * Math.PI * 18 - (2 * Math.PI * 18 * Math.min(Math.max(analytics?.conversionRate || 0, 0), 100)) / 100 
                          }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          style={{ filter: 'drop-shadow(0 0 4px rgba(255, 90, 60, 0.5))' }}
                        />
                      </svg>
                      {/* Subtly centered mini pulse dot if CTR is high */}
                      {(analytics?.conversionRate || 0) > 0 && (
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>

                </div>

                {/* Stripe interactive charts */}
                <AnalyticsCharts analytics={analytics} menuLength={menu.length} />

              </div>
            )}

            {/* TAB 2: INCOMING ORDERS TRACKER */}
            {activeTab === 'orders' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h3 className="text-xl font-bold flex items-center gap-2.5">
                    <ShoppingBag size={20} className="text-primary" />
                    Incoming Kitchen Orders
                  </h3>
                  <button onClick={() => fetchOrdersData(page)} className="chip btn-pill text-[12px] flex items-center">
                    <RefreshCw size={12} className="mr-1.5" /> Reload List
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-stir text-text-muted" size={24} />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {orders.map((ord) => (
                      <div 
                        key={ord._id} 
                        className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_0.9fr] gap-5 items-center hover:bg-white/[0.01] transition-colors text-left"
                      >
                        <div>
                          <span className="text-[11px] text-text-muted flex items-center gap-2 font-semibold mb-1">
                            Dining Token ID: {ord._id}
                            {ord.isTestOrder && (
                              <span className="bg-[#d9a752]/20 border border-[#d9a752]/30 text-[#d9a752] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                                SIMULATED
                              </span>
                            )}
                          </span>
                          <h4 className="text-base font-extrabold text-text-primary mb-2 leading-relaxed">
                            {ord.items.map(i => `${i.quantity}x ${i.foodItem?.name || 'Chef Dish'}`).join(', ')}
                          </h4>
                          <p className="text-[13px] text-text-secondary leading-relaxed">
                            <strong>Deliver to:</strong> {ord.deliveryAddress}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-col gap-1 text-[13px] text-text-secondary">
                            <div>Total Charge: <strong className="text-primary text-[15px] font-extrabold">{formatPrice(ord.total)}</strong></div>
                            <div className="pl-2 border-l border-border-light text-[11px] text-text-muted flex flex-col gap-0.5 mt-0.5 select-none">
                              <div className="flex justify-between w-[150px]"><span>Subtotal:</span> <span>{formatPrice(ord.subtotal)}</span></div>
                              <div className="flex justify-between w-[150px]"><span>Delivery Fee:</span> <span>{formatPrice(ord.deliveryFee)}</span></div>
                              <div className="flex justify-between w-[150px]"><span>Taxes (10%):</span> <span>{formatPrice(ord.tax)}</span></div>
                              {ord.transactionId && (
                                <div className="truncate max-w-[170px] mt-0.5 text-[9.5px]">
                                  Txn ID: <span className="font-mono select-all text-text-secondary">{ord.transactionId}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-1">Gateway: <strong className="uppercase text-[12.5px] text-text-primary">{ord.paymentMethod}</strong></div>
                            <div className="flex items-center">Payment Status: 
                              <span 
                                className={`ml-2 px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold uppercase ${
                                  ord.paymentStatus === 'paid' 
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                    : 'bg-orange-500/10 text-primary border border-primary/20'
                                }`}
                              >
                                {ord.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="block text-[11px] text-text-muted mb-2 font-bold uppercase tracking-wider">Action Tracker</span>
                          
                          {ord.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleUpdateStatus(ord._id, 'cancelled')} 
                                className="btn btn-secondary px-3 py-2 border border-red-500/30 text-red-500 rounded-xl text-xs flex items-center hover:bg-red-500/5 font-bold"
                              >
                                <X size={13} className="mr-1" /> Deny
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(ord._id, 'preparing')} 
                                className="btn btn-primary px-4 py-2 rounded-xl text-xs flex items-center font-bold"
                              >
                                <Check size={13} className="mr-1" /> Accept Order
                              </button>
                            </div>
                          )}

                          {ord.status === 'preparing' && (
                            <button 
                              onClick={() => handleUpdateStatus(ord._id, 'ready')} 
                              className="btn btn-secondary btn-pill text-[12.5px] border-primary text-primary hover:bg-primary/5 font-bold"
                            >
                              Ready for Delivery →
                            </button>
                          )}

                          {ord.status === 'ready' && (
                            <button 
                              onClick={() => handleUpdateStatus(ord._id, 'out_for_delivery')} 
                              className="btn btn-secondary btn-pill text-[12.5px] border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/5 font-bold"
                            >
                              Hand to Rider →
                            </button>
                          )}

                          {ord.status === 'out_for_delivery' && (
                            <span className="text-[12px] font-bold text-[var(--accent)] animate-pulse">
                              Rider In Transit...
                            </span>
                          )}

                          {ord.status === 'delivered' && (
                            <div className="inline-flex items-center gap-1.5 font-extrabold text-[13px] text-green-500">
                              <CheckCircle size={15} /> Delivered Successfully
                            </div>
                          )}

                          {ord.status === 'cancelled' && (
                            <div className="inline-flex items-center gap-1.5 text-red-500 font-extrabold text-[13px]">
                              Cancelled
                            </div>
                          )}
                        </div>

                        {ord.status === 'out_for_delivery' && (
                          <div className="col-span-full border-t border-white/[0.04] pt-4 mt-2">
                            <DeliveryMapSimulator 
                              orderId={ord._id} 
                              onCompleteClick={() => handleUpdateStatus(ord._id, 'delivered')}
                            />
                          </div>
                        )}

                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4 select-none">
                        {Array(totalPages).fill(0).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => fetchOrdersData(i + 1)}
                            className={`chip btn-pill ${page === i + 1 ? 'btn-primary text-white bg-primary' : 'bg-transparent text-text-secondary'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No client orders mapped to this kitchen yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MENU & DISHES CATALOG */}
            {activeTab === 'menu' && (
              <div className="flex flex-col gap-6">
                
                <div className="glass-panel p-8 rounded-[24px]">
                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2.5">
                        <Utensils size={20} className="text-primary" />
                        Menu Items
                      </h3>
                      <p className="text-[12.5px] text-text-secondary mt-1">Manage names, pricing, categories, and direct availability toggles.</p>
                    </div>

                    <button 
                      onClick={() => openDishDrawer(null)}
                      className="btn btn-primary btn-pill text-[13px] font-bold flex items-center gap-2"
                    >
                      <Plus size={15} /> Add Menu Item
                    </button>
                  </div>

                  {/* Categories Sub-filtering Row */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-6 select-none border-b border-border-light/45">
                    {['All', 'Signature Dishes', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setMenuFilter(cat)}
                        className={`chip text-[12px] px-4.5 py-2.5 rounded-xl transition-all ${
                          menuFilter === cat 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white/[0.02] border-border-light text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {menuLoading ? (
                    <div className="py-12 text-center">
                      <RefreshCw className="animate-stir text-text-muted" size={24} />
                    </div>
                  ) : menu.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {menu.filter(dish => menuFilter === 'All' || dish.category === menuFilter).map(dish => (
                        <div 
                          key={dish._id}
                          className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] overflow-hidden flex flex-col justify-between hover:border-primary/20 transition-all duration-300 relative group"
                        >
                          <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                            <SafeImage src={resolveMediaUrl(dish.image)} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <span className="absolute top-3 left-3 bg-black/60 text-white rounded-lg text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-[0.05em] backdrop-blur-sm">
                              {dish.category}
                            </span>
                            {!dish.isAvailable && (
                              <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center">
                                <span className="text-[12.5px] font-extrabold text-white tracking-wider uppercase bg-red-600/80 px-3 py-1 rounded-[10px] border border-red-500/20">Out Of Stock</span>
                              </div>
                            )}
                          </div>

                          <div className="p-5 text-left flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-base font-extrabold text-text-primary leading-snug line-clamp-1">{dish.name}</h4>
                                <strong className="text-primary text-[15px] font-extrabold shrink-0">{formatPrice(dish.price)}</strong>
                              </div>
                              <p className="text-[13px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed min-h-[40px]">{dish.description || 'Artisanal culinary preparation.'}</p>
                            </div>

                            <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-border-light/45">
                              {/* Stock Toggler */}
                              <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => handleToggleStock(dish)}>
                                {dish.isAvailable ? (
                                  <ToggleRight size={22} className="text-primary cursor-pointer" />
                                ) : (
                                  <ToggleLeft size={22} className="text-text-muted cursor-pointer" />
                                )}
                                <span className="text-[11.5px] font-bold text-text-secondary">{dish.isAvailable ? 'In Stock' : 'Unavailable'}</span>
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openDishDrawer(dish)}
                                  className="btn-icon btn-circle w-8 h-8"
                                  title="Edit Dish details"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button 
                                  onClick={() => confirmDeletion('dish', dish._id, dish.name)}
                                  className="btn-icon btn-circle w-8 h-8 text-red-500 hover:bg-red-500/10 hover:border-red-500/20"
                                  title="Delete Dish"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-text-secondary text-sm">
                      No menu items registered in this category yet.
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TAB 4: RECIPE REELS HUB */}
            {activeTab === 'reels' && (
              <div className="flex flex-col gap-6">
                
                <div className="glass-panel p-8 rounded-[24px]">
                  <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2.5">
                        <Film size={20} className="text-[var(--accent)]" />
                        Recipe Reels Hub
                      </h3>
                      <p className="text-[12.5px] text-text-secondary mt-1">Check social conversions, click-through rates, and upload video recipes.</p>
                    </div>

                    <div className="flex gap-1.5 select-none">
                      <button 
                        onClick={() => setReelsSubTab('catalog')}
                        className={`chip text-[12px] font-bold border-none px-4 py-2 transition-all cursor-pointer ${reelsSubTab === 'catalog' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary'}`}
                      >
                        My Catalog
                      </button>
                      <button 
                        onClick={() => setReelsSubTab('publish')}
                        className={`chip text-[12px] font-bold border-none px-4 py-2 transition-all cursor-pointer ${reelsSubTab === 'publish' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary'}`}
                      >
                        Publish Reel
                      </button>
                    </div>
                  </div>

                  {reelsSubTab === 'catalog' && (
                    reelsLoading ? (
                      <div className="py-12 text-center">
                        <RefreshCw className="animate-stir text-text-muted" size={24} />
                      </div>
                    ) : restaurantReels.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurantReels.map(reel => (
                          <div 
                            key={reel._id}
                            className="group bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] overflow-hidden flex flex-col justify-between hover:border-primary/20 transition-all duration-300"
                          >
                            <div 
                              onClick={() => setPreviewReel(reel)}
                              className="h-60 bg-slate-950 flex items-center justify-center relative cursor-pointer overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
                              <Film size={32} className="text-text-muted/40 group-hover:scale-110 transition-transform duration-300 z-10" />
                              
                              {/* Hover preview play overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                <div className="p-3.5 rounded-full bg-primary/95 text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                  <Play size={18} fill="currentColor" />
                                </div>
                              </div>

                              <span className="absolute bottom-3 left-3 bg-black/60 text-white rounded-lg text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-[0.05em] backdrop-blur-sm z-20">
                                Views: {reel.views || 0}
                              </span>
                              <span className="absolute bottom-3 right-3 bg-primary text-white rounded-lg text-[9px] px-2 py-0.5 font-extrabold uppercase tracking-[0.05em] opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                Preview Reel
                              </span>
                            </div>

                            <div className="p-5 text-left flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-extrabold text-text-primary leading-relaxed line-clamp-2">"{reel.caption || 'Culinary Reel'}"</h4>
                                {reel.tags && reel.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2.5">
                                    {reel.tags.map(tag => (
                                      <span key={tag} className="text-[10px] text-primary font-bold">#{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-5 border-t border-border-light/45 pt-4">
                                <div className="grid grid-cols-3 gap-2 text-center bg-white/[0.01] p-2.5 rounded-xl border border-border-light/25 mb-4">
                                  <div>
                                    <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">Likes</span>
                                    <strong className="text-sm font-extrabold text-text-primary mt-0.5 block">{reel.likes?.length || 0}</strong>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold">Clicks</span>
                                    <strong className="text-sm font-extrabold text-text-primary mt-0.5 block">{reel.orderNowClicks || 0}</strong>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-text-muted uppercase tracking-wider block font-bold text-primary">CTR %</span>
                                    <strong className="text-sm font-extrabold text-primary mt-0.5 block">
                                      {computedCTR(reel.views, reel.orderNowClicks)}%
                                    </strong>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                  <button 
                                    onClick={() => openReelModal(reel)}
                                    className="btn-icon btn-circle w-8 h-8"
                                    title="Edit Caption Details"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => confirmDeletion('reel', reel._id, reel.caption || 'Culinary Reel')}
                                    className="btn-icon btn-circle w-8 h-8 text-red-500 hover:bg-red-500/10 hover:border-red-500/20"
                                    title="Delete Reel"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-text-secondary text-sm">
                        You have not published any recipe reels yet. Share your kitchen vibe!
                      </div>
                    )
                  )}

                  {reelsSubTab === 'publish' && (
                    <div className="max-w-[620px] mx-auto mt-2">
                      
                      {uploadSuccess && (
                        <div className="bg-green-500/10 border border-[var(--accent)] text-[var(--accent)] rounded-[12px] p-4 flex gap-3 mb-6">
                          <CheckCircle size={20} className="shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[14px]">Upload Completed!</strong>
                            <span className="text-[12px] text-text-secondary leading-relaxed">Your vertical recipe Reel was successfully parsed and listed in the swipeable Reels feed!</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleReelUploadSubmit} className="flex flex-col gap-5 text-left">
                        
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                            Recipe Video File * (.mp4 vertical format, max 50MB)
                          </label>
                          
                          <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl py-10 px-5 text-center bg-surface cursor-pointer relative hover:border-primary/20 transition-all duration-300">
                            <input 
                              type="file" 
                              accept="video/mp4"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              disabled={uploading}
                            />
                            
                            <Upload size={32} className="text-text-muted mx-auto mb-3" />
                            
                            {selectedFile ? (
                              <div>
                                <strong className="text-[14px] text-primary block">{selectedFile.name}</strong>
                                <span className="text-[11.5px] text-text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB file loaded</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-sm font-bold block">Drag & Drop or Click to Select Video</span>
                                <span className="text-[11px] text-text-muted mt-1 block">Only vertical mp4 streams supported</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                            Reel Caption *
                          </label>
                          <textarea 
                            className="glass-input resize-none rounded-xl font-medium" 
                            rows="3"
                            placeholder="Indulge in our artisan warm melting chocolate lava cake..." 
                            value={reelCaption}
                            onChange={(e) => setReelCaption(e.target.value)}
                            disabled={uploading}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">
                            Reel Tags (Comma separated)
                          </label>
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="chocolate, dessert, molten, chefspecial" 
                            value={reelTags}
                            onChange={(e) => setReelTags(e.target.value)}
                            disabled={uploading}
                          />
                        </div>

                        {uploading && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-secondary mb-1.5 select-none font-bold">
                              <span>Uploading files...</span>
                              <strong>{uploadProgress}%</strong>
                            </div>
                            <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          className={`btn btn-primary h-12 flex items-center justify-center gap-2.5 mt-3 ${uploading ? 'btn-disabled' : ''}`}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <RefreshCw className="animate-stir" size={18} /> Processing Media File...
                            </>
                          ) : (
                            <>
                              <Upload size={15} /> Publish Recipe Reel
                            </>
                          )}
                        </button>
                      </form>

                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TAB 5: CUSTOMER REVIEWS COMMENTS */}
            {activeTab === 'comments' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-text-primary">
                  <MessageSquare size={20} className="text-primary" />
                  Client Reviews & Feedback Feed
                </h3>

                {commentsLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-stir text-text-muted" size={24} />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="flex flex-col gap-4.5">
                    {comments.map(c => (
                      <div 
                        key={c._id} 
                        className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-2xl p-5 text-left"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <SafeAvatar src={resolveMediaUrl(c.user?.profilePicture)} alt={c.user?.username} size={28} className="border border-primary/25" />
                            <span className="text-[13.5px] text-text-primary font-bold">
                              {c.user?.username || 'Valued Patron'}
                            </span>
                          </div>
                          <span className="text-[11.5px] text-text-muted font-semibold">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-[14px] text-text-primary mt-3 font-semibold italic pl-1 leading-relaxed">
                          "{c.text}"
                        </p>

                        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-text-secondary border-t border-border-light/35 pt-3 pl-1 font-semibold">
                          <span>Reel Video:</span>
                          <span className="text-primary hover:underline italic">
                            {c.reelCaption || 'View Video Clip'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No feedback comments left on your reels yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: KITCHEN PROFILE SETTINGS */}
            {activeTab === 'settings' && (
              <div className="glass-panel p-8 rounded-[24px]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-text-primary">
                  <Settings size={20} className="text-primary" />
                  Kitchen Vibe Config Details
                </h3>

                {settingsSuccess && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-xl p-3.5 mb-6 text-[13px] flex items-center gap-2">
                    <CheckCircle size={15} />
                    <span>{settingsSuccess}</span>
                  </div>
                )}

                {detailsLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-stir text-text-muted" size={24} />
                  </div>
                ) : (
                  <form onSubmit={handleSaveKitchenSettings} className="flex flex-col gap-5 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Display Name *</label>
                        <input 
                          type="text" 
                          className="glass-input font-semibold" 
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Cover Banner URL</label>
                        <input 
                          type="url" 
                          className="glass-input" 
                          value={settingsCover}
                          onChange={(e) => setSettingsCover(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-semibold text-text-secondary mb-2">Gastronomy Description</label>
                      <textarea 
                        rows="3"
                        className="glass-input resize-none rounded-xl" 
                        value={settingsDesc}
                        onChange={(e) => setSettingsDesc(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Cuisines (Comma separated)</label>
                        <input 
                          type="text" 
                          className="glass-input font-medium" 
                          value={settingsCuisines}
                          onChange={(e) => setSettingsCuisines(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Aesthetic Tags (Comma separated)</label>
                        <input 
                          type="text" 
                          className="glass-input font-medium" 
                          value={settingsTags}
                          onChange={(e) => setSettingsTags(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Avg. Delivery Time (Mins)</label>
                        <input 
                          type="number" 
                          className="glass-input font-bold" 
                          value={settingsTime}
                          onChange={(e) => setSettingsTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Delivery Charge (₹)</label>
                        <input 
                          type="number" 
                          className="glass-input font-bold" 
                          step="0.01" 
                          value={settingsFee}
                          onChange={(e) => setSettingsFee(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-text-secondary mb-2">Operating Hours / Timings</label>
                        <input 
                          type="text" 
                          className="glass-input font-bold" 
                          placeholder="11:00 AM - 11:00 PM"
                          value={settingsTimings}
                          onChange={(e) => setSettingsTimings(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* India-First Locality & Geospatial Settings Section */}
                    <div className="border-t border-border-light/45 pt-5 mt-5">
                      <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-1.5">
                        📍 India Locality & Dispatch coordinates
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Indian City *</label>
                          <select 
                            className="glass-input font-bold bg-[#111827] dark:bg-[#070A0E] text-text-primary cursor-pointer"
                            value={settingsCity}
                            onChange={(e) => setSettingsCity(e.target.value)}
                            required
                          >
                            {CITIES.map(c => (
                              <option key={c} value={c} className="bg-[#0E1318] text-text-primary">{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Locality / Area *</label>
                          <input 
                            type="text" 
                            className="glass-input font-bold" 
                            placeholder="e.g. Bandra West"
                            value={settingsLocality}
                            onChange={(e) => setSettingsLocality(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Price Tier *</label>
                          <select 
                            className="glass-input font-bold bg-[#111827] dark:bg-[#070A0E] text-text-primary cursor-pointer"
                            value={settingsPriceRange}
                            onChange={(e) => setSettingsPriceRange(e.target.value)}
                            required
                          >
                            <option value="₹" className="bg-[#0E1318] text-text-primary">₹ Budget (under ₹300)</option>
                            <option value="₹₹" className="bg-[#0E1318] text-text-primary">₹₹ Mid-range (₹300-₹700)</option>
                            <option value="₹₹₹" className="bg-[#0E1318] text-text-primary">₹₹₹ Premium (₹700-₹1500)</option>
                            <option value="₹₹₹₹" className="bg-[#0E1318] text-text-primary">₹₹₹₹ Premium Dining (₹1500+)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Latitude Coordinates</label>
                          <input 
                            type="number" 
                            className="glass-input font-bold" 
                            step="0.000001"
                            placeholder="e.g. 19.0596"
                            value={settingsLat}
                            onChange={(e) => setSettingsLat(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Longitude Coordinates</label>
                          <input 
                            type="number" 
                            className="glass-input font-bold" 
                            step="0.000001"
                            placeholder="e.g. 72.8258"
                            value={settingsLng}
                            onChange={(e) => setSettingsLng(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Delivery Radius (km)</label>
                          <input 
                            type="number" 
                            className="glass-input font-bold" 
                            placeholder="e.g. 5"
                            value={settingsDeliveryRadius}
                            onChange={(e) => setSettingsDeliveryRadius(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Serviceable Pincodes</label>
                          <input 
                            type="text" 
                            className="glass-input font-bold" 
                            placeholder="e.g. 400050, 400051"
                            value={settingsServiceableZones}
                            onChange={(e) => setSettingsServiceableZones(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payout & UPI Bank Verification */}
                    <div className="border-t border-border-light/45 pt-5 mt-5">
                      <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-1.5">
                        💳 Payout & UPI Bank Verification
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <label className="block text-[12px] font-semibold text-text-secondary mb-2">Merchant UPI ID / VPA</label>
                           <input 
                             type="text" 
                             className="glass-input font-bold" 
                             placeholder="e.g. restaurantname@okhdfcbank"
                             value={settingsUpiVpa}
                             onChange={(e) => setSettingsUpiVpa(e.target.value)}
                           />
                          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
                            Incoming customer UPI scan payments will be routed directly to this address. Ensure this is a valid VPA.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-3 font-bold ${settingsLoading ? 'btn-disabled' : ''}`}
                      disabled={settingsLoading}
                    >
                      {settingsLoading ? 'Saving Telemetry...' : 'Save Kitchen Settings'}
                    </button>
                  </form>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. PREMIUM COMPONENT SLIDE-IN DRAWER FOR MENU ITEMS */}
      <AnimatePresence>
        {menuDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#0E1318]/95 dark:bg-[#070A0E]/98 border-l border-border-light shadow-[var(--shadow-floating)] z-50 p-8 overflow-y-auto text-left"
            >
              <div className="flex justify-between items-center mb-6 border-b border-border-light/45 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  {editingDish ? 'Edit Menu Item' : 'Add Menu Item'}
                </h3>
                <button onClick={() => setMenuDrawerOpen(false)} className="btn-icon btn-circle w-8 h-8">
                  <X size={15} />
                </button>
              </div>

              {dishFormError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 mb-6 text-[12.5px] flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>{dishFormError}</span>
                </div>
              )}

              <form onSubmit={handleDishFormSubmit} className="flex flex-col gap-4.5">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Dish Name *</label>
                  <input 
                    type="text" 
                    className="glass-input font-semibold"
                    placeholder="Wagyu Ribeye Steak"
                    value={dishFormName}
                    onChange={(e) => setDishFormName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Item Description</label>
                  <textarea 
                    rows="3"
                    className="glass-input resize-none rounded-xl"
                    placeholder="Pan-seared premium Wagyu ribeye served with black truffle compound butter..."
                    value={dishFormDesc}
                    onChange={(e) => setDishFormDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Price (₹) *</label>
                    <input 
                      type="number" 
                      className="glass-input font-bold"
                      placeholder="1850"
                      min="0"
                      value={dishFormPrice}
                      onChange={(e) => setDishFormPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Category *</label>
                    <select 
                      className="glass-input font-bold bg-[#111827] dark:bg-[#070A0E] text-text-primary"
                      value={dishFormCategory}
                      onChange={(e) => setDishFormCategory(e.target.value)}
                    >
                      <option value="Signature Dishes">Signature Dishes</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Dish Image URL</label>
                  <input 
                    type="url" 
                    className="glass-input"
                    placeholder="https://images.unsplash.com/..."
                    value={dishFormImage}
                    onChange={(e) => setDishFormImage(e.target.value)}
                  />
                </div>

                {editingDish && (
                  <div className="flex justify-between items-center bg-white/[0.01] border border-border-light/35 rounded-xl p-3.5 select-none" onClick={() => setDishFormAvailable(!dishFormAvailable)}>
                    <div className="flex items-center gap-2 cursor-pointer">
                      {dishFormAvailable ? (
                        <ToggleRight size={22} className="text-primary" />
                      ) : (
                        <ToggleLeft size={22} className="text-text-muted" />
                      )}
                      <span className="text-[12px] font-bold text-text-secondary">Dish in Stock & Listed</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-4 font-bold ${dishFormLoading ? 'btn-disabled' : ''}`}
                  disabled={dishFormLoading}
                >
                  {dishFormLoading ? 'Persisting...' : editingDish ? 'Save Dish Changes' : 'Publish Menu Item'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. MODAL PORTAL FOR VIDEO REELS CAPTIONS EDITS */}
      <AnimatePresence>
        {reelModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 select-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReelModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="bg-[#0E1318]/95 dark:bg-[#070A0E]/98 border border-border-light rounded-[24px] p-7 max-w-[500px] w-full relative z-10 text-left shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5 border-b border-border-light/45 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Film size={16} className="text-primary" />
                  Edit Recipe Reel Caption
                </h3>
                <button onClick={() => setReelModalOpen(false)} className="btn-icon btn-circle w-7 h-7">
                  <X size={13} />
                </button>
              </div>

              {reelFormError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-2.5 mb-5 text-[12px] flex items-center gap-1">
                  <ShieldAlert size={14} />
                  <span>{reelFormError}</span>
                </div>
              )}

              <form onSubmit={handleReelFormSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Caption *</label>
                  <textarea 
                    rows="3"
                    className="glass-input resize-none rounded-xl font-medium"
                    placeholder="Whip up something tasty..."
                    value={reelFormCaption}
                    onChange={(e) => setReelFormCaption(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1.5 uppercase tracking-wider">Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    className="glass-input font-medium"
                    placeholder="dessert, chef"
                    value={reelFormTags}
                    onChange={(e) => setReelFormTags(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-2 font-bold ${reelFormLoading ? 'btn-disabled' : ''}`}
                  disabled={reelFormLoading}
                >
                  {reelFormLoading ? 'Saving...' : 'Update Reel Details'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DUAL THEME CONFIRM DELETE DIALOG OVERLAY */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 select-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="bg-[#0E1318] dark:bg-[#070A0E] border border-red-500/20 rounded-[20px] p-6 max-w-[420px] w-full relative z-10 text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Confirm Deletion</h3>
              <p className="text-sm text-text-secondary mt-2.5 leading-relaxed">
                Are you sure you want to permanently delete the {deleteTargetType} <strong className="text-text-primary">"{deleteTargetName}"</strong>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="btn btn-secondary flex-1 h-10 font-bold border-border-light"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDeleteAction}
                  className="btn btn-primary flex-1 h-10 font-bold bg-red-600 hover:bg-red-500 border-none text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>

      {/* Reel Preview Modal overlay placed OUTSIDE the container to prevent transform stacking bugs */}
      <AnimatePresence>
        {previewReel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 99999999 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setPreviewReel(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-[340px] aspect-[9/16] bg-slate-950 rounded-[24px] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewReel(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              
              {/* Video element */}
              <video
                src={resolveMediaUrl(previewReel.videoUrl)}
                autoPlay
                controls
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
