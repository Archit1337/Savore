import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Play, ShoppingBag, Plus, 
  Upload, Film, Settings, RefreshCw, CheckCircle, 
  IndianRupee, Check, X, ShieldAlert, AlertCircle, AlertTriangle, 
  FileText, Trash2, Edit3, Eye, Heart, MessageSquare, 
  Clock, Utensils, ToggleLeft, ToggleRight, DollarSign, 
  Calendar, BarChart3, ChevronRight, Layers, Award, Sparkles, Image, Lock, Search, MapPin, Bike
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
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.val), 1);
  const lineY = (value) => {
    const ratio = value / maxRevenue;
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
  
  // Archive orders specific state
  const [archiveOrders, setArchiveOrders] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotalPages, setArchiveTotalPages] = useState(1);

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
  const [menuSearch, setMenuSearch] = useState('');

  // Order Archive search, filter, and detail modal states
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('all');
  const [selectedArchiveOrder, setSelectedArchiveOrder] = useState(null);

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

  // Kitchen Open/Closed operational state
  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [statusToggling, setStatusToggling] = useState(false);

  const handleToggleOpenStatus = async () => {
    soundController?.playClick();
    setStatusToggling(true);
    setErrorMsg('');
    try {
      const nextState = !isOpenStatus;
      const res = await api.put('/restaurants/owner/details', { isOpen: nextState });
      if (res.data && res.data.success) {
        setIsOpenStatus(nextState);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to toggle operational status:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to toggle kitchen operational status.');
    } finally {
      setStatusToggling(false);
    }
  };

  // Core background handshakes
  const fetchDashboardData = async () => {
    if (!isAuthenticated || !isOwner) return;
    setAnalyticsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/restaurants/owner/analytics');
      if (res.data && res.data.success) {
        setAnalytics(res.data.data);
        setIsOpenStatus(res.data.data.isOpen !== false);
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

  // Fetch active orders (limit 100 to ensure we don't hide active orders in KDS)
  const fetchActiveOrders = async () => {
    if (!hasRestaurant) return;
    setOrdersLoading(true);
    try {
      const res = await fetchRestaurantOrders(1, 100, 'active');
      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load active orders:', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch paginated archived orders
  const fetchArchiveOrders = async (targetPage = 1) => {
    if (!hasRestaurant) return;
    setArchiveLoading(true);
    try {
      const res = await fetchRestaurantOrders(targetPage, 10, 'archived');
      if (res && res.data) {
        setArchiveOrders(res.data);
        setArchivePage(res.page);
        setArchiveTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to load archived orders:', err.message);
    } finally {
      setArchiveLoading(false);
    }
  };

  // Orders Retrieval (loads active and the specified page of archived orders)
  const fetchOrdersData = async (targetPage = 1) => {
    await Promise.all([
      fetchActiveOrders(),
      fetchArchiveOrders(targetPage)
    ]);
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
      const [commentsRes, reelsRes] = await Promise.all([
        api.get('/restaurants/owner/comments'),
        api.get('/reels/owner')
      ]);
      if (commentsRes.data && commentsRes.data.success) {
        setComments(commentsRes.data.data || []);
      }
      if (reelsRes.data && reelsRes.data.success) {
        setRestaurantReels(reelsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to retrieve client comments or reels feed:', err.message);
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
        setIsOpenStatus(rest.isOpen !== false);
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
      setDishFormCategory(dish.category === 'Dessert' ? 'Desserts' : (dish.category || 'Main Course'));
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

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 self-center md:self-end z-20">
            {/* 1. Kitchen Operational Toggle */}
            {hasRestaurant && (
              <button
                onClick={handleToggleOpenStatus}
                disabled={statusToggling}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2 transition-all select-none cursor-pointer text-xs font-bold ${
                  isOpenStatus
                    ? 'bg-green-500/10 border-green-500/25 text-green-400 hover:bg-green-500/15 shadow-[0_0_12px_rgba(34,197,94,0.06)]'
                    : 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/15'
                }`}
                title={isOpenStatus ? "Pause live orders (Customers will see kitchen as closed)" : "Open kitchen for live orders"}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isOpenStatus ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                <span>{isOpenStatus ? 'Kitchen Active' : 'Kitchen Closed'}</span>
              </button>
            )}

            {/* 2. Connection Sync Badge */}
            <div 
              className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold select-none ${
                isSocketConnected
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
              title={isSocketConnected ? "KDS Live Sync Active (Real-time updates online)" : "Offline Mode - Reconnecting..."}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSocketConnected ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)] animate-pulse' : 'bg-amber-500 animate-ping'}`} />
              <span className="text-[10px] uppercase tracking-wider">{isSocketConnected ? 'KDS Sync Live' : 'Syncing'}</span>
            </div>

            {/* 3. Sync Feed Button */}
            <button 
              onClick={() => { fetchDashboardData(); if (hasRestaurant && activeTab === 'orders') fetchOrdersData(page); }} 
              className="px-3.5 py-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-text-secondary hover:text-text-primary rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-2 text-xs font-bold"
              title="Sync Dashboard Telemetry"
            >
              <RefreshCw size={13} className="hover:rotate-180 transition-transform duration-700" />
              <span>Sync Feed</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-8 w-full">
        {/* 1. MASTER SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-[24px]">
            <div className="flex items-center gap-2 mb-6 px-1.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Utensils size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-text-primary tracking-tight">Savoré Merchant</h2>
                <span className="text-[9.5px] text-text-muted uppercase font-bold tracking-widest">Kitchen OS</span>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 select-none">
              {[
                { id: 'analytics', label: 'Overview Dashboard', icon: BarChart3 },
                { id: 'orders', label: 'Incoming Orders', icon: ShoppingBag },
                { id: 'menu', label: 'Dishes Catalog', icon: Layers },
                { id: 'reels', label: 'Recipe Reels Studio', icon: Film },
                { id: 'comments', label: 'Customer Reviews Feed', icon: MessageSquare },
                { id: 'settings', label: 'Kitchen Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundController?.playClick();
                      setActiveTab(tab.id);
                      setErrorMsg('');
                    }}
                    className={`w-full h-11 px-4 rounded-xl flex items-center justify-between font-semibold text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary border-primary text-white shadow-md active:scale-[0.98]'
                        : 'bg-white/[0.01] border-transparent text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={14} className={isSelected ? 'text-white' : 'text-text-muted'} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary border border-primary/25 animate-pulse'}`}>
                        {orders.filter(o => o.status === 'pending').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 2. DYNAMIC WORKSPACE PANEL */}
        <div className="flex-grow min-w-0 w-full flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-[24px] flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-extrabold text-text-primary capitalize">
                {activeTab === 'analytics' ? 'Kitchen Overview' : `${activeTab.replace('_', ' ')} Management`}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                {activeTab === 'analytics' && 'Monitor gross revenues, dining conversion velocities, and check daily spikes.'}
                {activeTab === 'orders' && 'Real-time kitchen order pipelines, dispatch trackers, and simulator portals.'}
                {activeTab === 'menu' && 'Publish new gastronomy dishes, toggle in-stock options, and configure pricing tiers.'}
                {activeTab === 'reels' && 'Upload vertical recipe videos, track attribution clicks, and review flagged state details.'}
                {activeTab === 'comments' && 'Audit feedback left by patrons on culinary Reels and manage customer reviews.'}
                {activeTab === 'settings' && 'Update locational coordinate geofences, timings, cover images, and UPI VPA IDs.'}
              </p>
            </div>
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
                    <h4 className="text-[12px] text-text-muted font-bold mt-4 uppercase tracking-wider pr-14">Reels Placements CTR</h4>
                    <h2 className="text-2xl font-extrabold mt-1 text-text-primary pr-14">
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
                    Kitchen Operations Board
                  </h3>
                  <button onClick={() => fetchOrdersData(page)} className="chip btn-pill text-[12px] flex items-center">
                    <RefreshCw size={12} className="mr-1.5" /> Reload Board
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-stir text-text-muted" size={24} />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="flex flex-col gap-8">
                    {/* Active operational board */}
                    <div className="flex flex-row gap-5 overflow-x-auto pb-4 mt-2 kds-scrollbar w-full h-[700px]">
                      {['pending', 'preparing', 'ready', 'out_for_delivery'].map(statusName => {
                        const statusOrders = orders.filter(o => o.status === statusName);
                        
                        let colTitle = 'Incoming';
                        let colHeaderBorder = 'border-t-primary/80';
                        let colBadgeStyle = 'bg-primary/10 text-primary border-primary/20';
                        let colIcon = <ShoppingBag size={14} className="text-primary" />;
                        
                        if (statusName === 'preparing') {
                          colTitle = 'Preparing';
                          colHeaderBorder = 'border-t-amber-500/80';
                          colBadgeStyle = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                          colIcon = <Utensils size={14} className="text-amber-500" />;
                        } else if (statusName === 'ready') {
                          colTitle = 'Ready';
                          colHeaderBorder = 'border-t-indigo-500/80';
                          colBadgeStyle = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
                          colIcon = <Layers size={14} className="text-indigo-500" />;
                        } else if (statusName === 'out_for_delivery') {
                          colTitle = 'In Transit';
                          colHeaderBorder = 'border-t-green-500/80';
                          colBadgeStyle = 'bg-green-500/10 text-green-500 border-green-500/20';
                          colIcon = <Bike size={14} className="text-green-500" />;
                        }

                        return (
                          <div key={statusName} className={`flex flex-col gap-4 bg-slate-900/35 dark:bg-black/35 border border-white/[0.04] p-5 rounded-[20px] h-full text-left flex-1 min-w-[300px] md:min-w-[330px] border-t-[3px] ${colHeaderBorder} shadow-[var(--shadow-card)] backdrop-blur-md relative overflow-hidden`}>
                            {/* Column Header */}
                            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-1 select-none">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  statusName === 'pending' ? 'bg-primary shadow-[0_0_8px_rgba(255,90,60,0.5)]' :
                                  statusName === 'preparing' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                  statusName === 'ready' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                                  'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                }`} />
                                {colIcon}
                                <h4 className="text-[11px] font-black text-text-primary uppercase tracking-widest leading-none">
                                  {colTitle}
                                </h4>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${colBadgeStyle}`}>
                                {statusOrders.length}
                              </span>
                            </div>

                            <div className="flex flex-col gap-3.5 w-full pr-1 overflow-y-auto flex-1 kds-scrollbar">
                              {statusOrders.length > 0 ? (
                                statusOrders.map(ord => {
                                  const timeElapsed = Math.max(0, Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000));
                                  let timerBadgeColor = 'bg-green-500/10 text-green-400 border border-green-500/20';
                                  if (timeElapsed >= 20) {
                                    timerBadgeColor = 'bg-red-500/10 text-red-400 border border-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
                                  } else if (timeElapsed >= 10) {
                                    timerBadgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.05)]';
                                  }

                                  return (
                                    <div key={ord._id} className="bg-slate-950/40 dark:bg-black/45 border border-white/[0.07] hover:border-primary/30 rounded-xl p-5 flex flex-col gap-4 relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/2">
                                      {/* Card Titlebar */}
                                      <div className="flex justify-between items-center gap-2 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span 
                                            className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono tracking-wider shrink-0" 
                                            title={ord._id}
                                          >
                                            #{ord._id.substring(ord._id.length - 8).toUpperCase()}
                                          </span>
                                          <span className="text-[10.5px] text-text-secondary font-bold truncate">
                                            {ord.user?.username ? `@${ord.user.username}` : 'Guest'}
                                          </span>
                                        </div>
                                        {/* Timer Indicator */}
                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 font-extrabold select-none ${timerBadgeColor}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            timeElapsed >= 20 ? 'bg-red-400 animate-pulse' :
                                            timeElapsed >= 10 ? 'bg-amber-400 animate-pulse' :
                                            'bg-green-400'
                                          }`} />
                                          {timeElapsed === 0 ? 'Just now' : `${timeElapsed}m`}
                                        </span>
                                      </div>

                                      <div className="h-px bg-white/5 my-0.5" />

                                      {/* Checklist items list */}
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-black uppercase tracking-wider mb-0.5">
                                          <Utensils size={9} />
                                          <span>Kitchen Ticket</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          {ord.items.map((item, idx) => (
                                            <label key={idx} className="flex items-center justify-between text-xs cursor-pointer select-none min-w-0 gap-3 py-1.5 px-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] rounded-lg transition-all">
                                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <input 
                                                  type="checkbox" 
                                                  className="rounded border-white/20 bg-transparent text-primary focus:ring-0 cursor-pointer w-4 h-4 shrink-0 checked:bg-primary checked:border-primary transition-all" 
                                                  onClick={(e) => e.stopPropagation()} 
                                                />
                                                <span className="text-text-secondary font-semibold break-words leading-tight truncate">{item.foodItem?.name || 'Chef Dish'}</span>
                                              </div>
                                              <span className="font-black text-primary text-[11px] bg-primary/10 border border-primary/15 px-1.5 py-0.5 rounded-md shrink-0">
                                                ×{item.quantity}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>

                                      {ord.deliveryAddress && (
                                        <>
                                          <div className="h-px bg-white/5 my-0.5" />
                                          <div className="flex flex-col gap-1 text-[11px]">
                                            <span className="text-text-muted font-black uppercase text-[9px] tracking-wider block mb-0.5">Delivery Address</span>
                                            <div className="flex items-start gap-1.5 text-text-secondary bg-white/[0.01] border border-white/[0.02] p-2.5 rounded-xl">
                                              <MapPin size={12} className="text-primary mt-0.5 shrink-0" />
                                              <span className="font-semibold leading-relaxed break-words text-[11.5px]">{ord.deliveryAddress}</span>
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      <div className="h-px bg-white/5 my-0.5" />

                                      {/* Order Summary & Charge Info */}
                                      <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.03] p-2.5 rounded-xl">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-text-muted font-black uppercase tracking-wider leading-none">Total Bill</span>
                                          <span className="text-text-primary font-black text-xs mt-1.5 font-mono">{formatPrice(ord.total)}</span>
                                        </div>
                                        <div className="flex gap-1.5 items-center select-none">
                                          {ord.isTestOrder && (
                                            <span className="bg-amber-500/15 border border-amber-500/25 text-amber-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                                              SIMULATOR
                                            </span>
                                          )}
                                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                                            ord.paymentStatus === 'succeeded' || ord.paymentStatus === 'paid' || ord.paymentStatus === 'Paid'
                                              ? 'bg-green-500/10 border-green-500/25 text-green-400'
                                              : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                          }`}>
                                            {ord.paymentMethod}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Action buttons inside cards */}
                                      <div className="mt-1 flex gap-2 w-full select-none">
                                        {ord.status === 'pending' && (
                                          <>
                                            <button 
                                              onClick={() => handleUpdateStatus(ord._id, 'cancelled')} 
                                              className="border border-red-500/30 text-red-400 hover:text-white bg-red-500/5 hover:bg-red-500 rounded-xl text-[11px] h-10 flex-1 flex items-center justify-center gap-1 font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                            >
                                              <X size={12} />
                                              <span>Deny</span>
                                            </button>
                                            <button 
                                              onClick={() => handleUpdateStatus(ord._id, 'preparing')} 
                                              className="bg-gradient-to-r from-primary to-orange-500 hover:opacity-95 text-white rounded-xl text-[11px] h-10 flex-1 flex items-center justify-center gap-1 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-primary/10"
                                            >
                                              <Check size={12} />
                                              <span>Accept</span>
                                            </button>
                                          </>
                                        )}

                                        {ord.status === 'preparing' && (
                                          <button 
                                            onClick={() => handleUpdateStatus(ord._id, 'ready')} 
                                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white rounded-xl text-[11px] h-10 w-full flex items-center justify-center gap-1.5 font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
                                          >
                                            <CheckCircle size={12} />
                                            <span>Ready to Ship →</span>
                                          </button>
                                        )}

                                        {ord.status === 'ready' && (
                                          <button 
                                            onClick={() => handleUpdateStatus(ord._id, 'out_for_delivery')} 
                                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-[11px] h-10 w-full flex items-center justify-center gap-1.5 font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
                                          >
                                            <Bike size={13} />
                                            <span>Hand to Rider →</span>
                                          </button>
                                        )}

                                        {ord.status === 'out_for_delivery' && (
                                          <div className="flex flex-col gap-2 w-full">
                                            <span className="text-[10px] text-green-400/90 animate-pulse font-bold text-center block w-full py-1 flex items-center justify-center gap-1.5">🛵 Rider Dispatching...</span>
                                            <DeliveryMapSimulator 
                                              orderId={ord._id} 
                                              onCompleteClick={() => handleUpdateStatus(ord._id, 'delivered')}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="py-12 border border-dashed border-white/5 rounded-xl text-center text-[11px] text-text-muted">
                                  No active orders
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rebuilt past order archive table */}
                    <div className="border-t border-white/[0.04] pt-8 mt-4 text-left">
                      <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        📋 Past Order Archive
                      </h4>
                      
                      {/* Search & filters inside ledger archive */}
                      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                        <div className="flex gap-2 overflow-x-auto pb-1 select-none flex-1 scrollbar-none">
                          {['all', 'delivered', 'cancelled'].map(statusFilter => (
                            <button
                              key={statusFilter}
                              onClick={() => setArchiveFilter(statusFilter)}
                              className={`chip text-[11px] px-3.5 py-2 rounded-xl transition-all font-semibold cursor-pointer shrink-0 uppercase tracking-wider ${
                                archiveFilter === statusFilter 
                                  ? 'bg-primary text-white border-primary shadow-sm' 
                                  : 'bg-white/[0.02] border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                              }`}
                            >
                              {statusFilter}
                            </button>
                          ))}
                        </div>
                        
                        <div className="glass-input-wrapper relative w-full md:w-72 shrink-0">
                          <input 
                            type="text" 
                            className="glass-input !pl-10 text-xs w-full" 
                            placeholder="Search past orders (ID, address)..." 
                            value={archiveSearch}
                            onChange={(e) => setArchiveSearch(e.target.value)}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                            <Search size={14} />
                          </div>
                          {archiveSearch && (
                            <button 
                              onClick={() => setArchiveSearch('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Responsive data table */}
                      {archiveLoading ? (
                        <div className="py-12 text-center">
                          <RefreshCw className="animate-stir text-text-muted" size={24} />
                        </div>
                      ) : (() => {
                        const filteredArchiveOrders = archiveOrders.filter(o => {
                          const matchesFilter = archiveFilter === 'all' || o.status === archiveFilter;
                          const searchLower = archiveSearch.toLowerCase();
                          const matchesSearch = !archiveSearch || 
                            o._id.toLowerCase().includes(searchLower) ||
                            o.deliveryAddress?.toLowerCase().includes(searchLower) ||
                            o.items.some(item => item.foodItem?.name?.toLowerCase().includes(searchLower));
                          return matchesFilter && matchesSearch;
                        });

                        return (
                          <div className="overflow-x-auto w-full rounded-2xl border border-white/[0.04] bg-white/[0.005] kds-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-text-muted uppercase font-bold tracking-wider">
                                  <th className="p-4">Date & Time</th>
                                  <th className="p-4">Token ID</th>
                                  <th className="p-4">Patron Items</th>
                                  <th className="p-4">Destination Address</th>
                                  <th className="p-4 text-right">Amount</th>
                                  <th className="p-4 text-center">Status</th>
                                  <th className="p-4 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03]">
                                {filteredArchiveOrders.map(ord => (
                                  <tr key={ord._id} className="hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
                                    <td className="p-4 whitespace-nowrap text-text-secondary font-medium">
                                      {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                      <span className="font-mono text-[10px] font-bold text-text-primary bg-white/5 border border-white/10 px-2 py-0.5 rounded-md" style={{ letterSpacing: '0.06em' }}>
                                        #{ord._id.substring(ord._id.length - 8).toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="p-4 text-text-primary font-semibold leading-relaxed">
                                      <div className="max-w-[280px] break-words whitespace-normal">
                                        {ord.items.map(i => `${i.quantity}x ${i.foodItem?.name || 'Chef Dish'}`).join(', ')}
                                      </div>
                                    </td>
                                    <td className="p-4 text-text-secondary font-medium leading-normal">
                                      <div className="max-w-[320px] break-words whitespace-normal">
                                        {ord.deliveryAddress || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="p-4 text-right font-extrabold text-primary whitespace-nowrap">
                                      {formatPrice(ord.total)}
                                    </td>
                                    <td className="p-4 text-center whitespace-nowrap">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                        ord.status === 'delivered'
                                          ? 'bg-green-500/10 text-green-400 border-green-500/25'
                                          : 'bg-red-500/10 text-red-400 border-red-500/25'
                                      }`}>
                                        {ord.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center whitespace-nowrap">
                                      <button 
                                        onClick={() => setSelectedArchiveOrder(ord)}
                                        className="px-3 py-1.5 bg-white/[0.02] border border-white/10 hover:bg-primary hover:border-primary hover:text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                                      >
                                        View Ticket
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {filteredArchiveOrders.length === 0 && (
                              <div className="py-8 text-center text-text-muted font-medium">
                                No archived transactions found matching criteria.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {archiveTotalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4 select-none">
                        {Array(archiveTotalPages).fill(0).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => fetchArchiveOrders(i + 1)}
                            className={`chip btn-pill ${archivePage === i + 1 ? 'btn-primary text-white bg-primary' : 'bg-transparent text-text-secondary'}`}
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

                  {/* Categories & Search Filter Row */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                    {/* Categories Sub-filtering Row */}
                    <div className="flex gap-2 overflow-x-auto pb-1 select-none flex-1 scrollbar-none">
                      {['All', 'Signature Dishes', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setMenuFilter(cat)}
                          className={`chip text-[12px] px-5 py-2.5 rounded-xl transition-all font-semibold cursor-pointer shrink-0 ${
                            menuFilter === cat 
                              ? 'bg-primary text-white border-primary shadow-sm' 
                              : 'bg-white/[0.02] border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search Input wrapper */}
                    <div className="glass-input-wrapper relative w-full md:w-72 shrink-0">
                      <input 
                        type="text" 
                        className="glass-input !pl-10 text-xs w-full" 
                        placeholder="Search dishes..." 
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                        <Search size={14} />
                      </div>
                      {menuSearch && (
                        <button 
                          onClick={() => setMenuSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {menuLoading ? (
                    <div className="py-12 text-center">
                      <RefreshCw className="animate-stir text-text-muted" size={24} />
                    </div>
                  ) : (() => {
                    const filteredMenu = menu.filter(dish => {
                      const matchesCategory = menuFilter === 'All' || 
                        dish.category === menuFilter || 
                        (menuFilter === 'Desserts' && (dish.category === 'Dessert' || dish.category === 'Desserts'));
                      const matchesSearch = !menuSearch || 
                        dish.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                        dish.description?.toLowerCase().includes(menuSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    return filteredMenu.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMenu.map(dish => (
                          <div 
                            key={dish._id}
                            className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] overflow-hidden flex flex-col justify-between hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative group"
                          >
                            <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                              <SafeImage src={resolveMediaUrl(dish.image)} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <span className="absolute top-3 left-3 bg-black/60 text-white rounded-lg text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-[0.05em] backdrop-blur-sm">
                                {dish.category === 'Dessert' ? 'Desserts' : dish.category}
                              </span>
                              {!dish.isAvailable && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                  <span className="text-[12.5px] font-extrabold text-white tracking-wider uppercase bg-red-600/90 px-3 py-1 rounded-[10px] border border-red-500/20 shadow-md">Out Of Stock</span>
                                </div>
                              )}
                            </div>

                            <div className="p-5 text-left flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-base font-extrabold text-text-primary leading-snug line-clamp-1 group-hover:text-primary transition-colors">{dish.name}</h4>
                                  <strong className="text-primary text-[15px] font-extrabold shrink-0">{formatPrice(dish.price)}</strong>
                                </div>
                                <p className="text-[13px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed min-h-[40px]">{dish.description || 'Artisanal culinary preparation.'}</p>
                              </div>

                              <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-white/5">
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
                                    className="btn-icon btn-circle w-8 h-8 hover:bg-white/5 transition-all"
                                    title="Edit Dish details"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => confirmDeletion('dish', dish._id, dish.name)}
                                    className="btn-icon btn-circle w-8 h-8 text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
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
                        No menu items registered {menuSearch ? "matching your search query" : "in this category yet"}.
                      </div>
                    );
                  })()}

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

                              {reel.isFlagged && (
                                <div className="absolute top-3 left-3 bg-red-500/90 text-white flex items-center gap-1 rounded-lg text-[9px] px-2 py-0.5 font-extrabold uppercase tracking-[0.05em] backdrop-blur-sm z-20 border border-red-400/20 shadow-lg shadow-red-500/20">
                                  <AlertTriangle size={10} />
                                  <span>Flagged</span>
                                </div>
                              )}

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

                                {reel.isFlagged && reel.reports && reel.reports.length > 0 && (
                                  <div className="mt-3.5 p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-red-500 mb-1">
                                      <AlertTriangle size={12} className="shrink-0" />
                                      <span>Flagged by Community ({reel.reports.length})</span>
                                    </div>
                                    <div className="text-[11px] text-text-secondary leading-relaxed">
                                      <span className="font-semibold">Reason:</span> {reel.reports[reel.reports.length - 1].reason}
                                      {reel.reports[reel.reports.length - 1].description && (
                                        <p className="italic mt-1.5 text-text-muted bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 leading-normal">
                                          "{reel.reports[reel.reports.length - 1].description}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-5 border-t border-border-light/45 pt-4">
                                <div className="grid grid-cols-3 gap-2 text-center bg-white/[0.01] p-2.5 rounded-xl border border-white/5 mb-4">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-text-muted uppercase tracking-wider block font-extrabold">Likes</span>
                                    <strong className="text-sm font-black text-text-primary mt-0.5">{reel.likes?.length || 0}</strong>
                                  </div>
                                  <div className="flex flex-col items-center border-x border-white/5">
                                    <span className="text-[9px] text-text-muted uppercase tracking-wider block font-extrabold">Clicks</span>
                                    <strong className="text-sm font-black text-text-primary mt-0.5">{reel.orderNowClicks || 0}</strong>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-primary uppercase tracking-wider block font-extrabold">CTR %</span>
                                    <strong className="text-sm font-black text-primary mt-0.5">
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
                  <div className="flex flex-col gap-5">
                    {comments.map(c => (
                      <div 
                        key={c._id} 
                        className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-2xl p-5 text-left hover:border-primary/10 transition-all duration-350"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <SafeAvatar src={resolveMediaUrl(c.user?.profilePicture)} alt={c.user?.username} size={28} className="border border-primary/25 shadow-sm" />
                            <span className="text-[13.5px] text-text-primary font-bold">
                              @{c.user?.username || 'Valued Patron'}
                            </span>
                          </div>
                          <span className="text-[11.5px] text-text-muted font-semibold">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-[14px] text-text-primary mt-3 font-semibold italic pl-1 leading-relaxed">
                          "{c.text}"
                        </p>

                        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-text-secondary border-t border-white/5 pt-3 pl-1 font-semibold">
                          <span>Reel Video:</span>
                          {(() => {
                            const matchedReel = restaurantReels.find(r => r._id === c.reelId);
                            if (matchedReel) {
                              return (
                                <button 
                                  onClick={() => setPreviewReel(matchedReel)}
                                  className="text-primary hover:underline italic bg-transparent border-none cursor-pointer p-0 font-semibold flex items-center gap-1"
                                >
                                  <Film size={11} /> {c.reelCaption || 'View Video Clip'}
                                </button>
                              );
                            }
                            return (
                              <span className="text-text-muted italic">
                                {c.reelCaption || 'Recipe Reel'}
                              </span>
                            );
                          })()}
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
                  <form onSubmit={handleSaveKitchenSettings} className="flex flex-col gap-6 text-left">
                    
                    {/* SECTION A: Store Profile */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                        <Utensils size={15} className="text-primary" /> Store Profile Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Display Name *</label>
                          <input 
                            type="text" 
                            className="glass-input font-semibold" 
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Cover Banner URL</label>
                          <input 
                            type="url" 
                            className="glass-input" 
                            value={settingsCover}
                            onChange={(e) => setSettingsCover(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Gastronomy Description</label>
                        <textarea 
                          rows="3"
                          className="glass-input resize-none rounded-xl" 
                          value={settingsDesc}
                          onChange={(e) => setSettingsDesc(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Cuisines (Comma separated)</label>
                          <input 
                            type="text" 
                            className="glass-input font-medium" 
                            value={settingsCuisines}
                            onChange={(e) => setSettingsCuisines(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Aesthetic Tags (Comma separated)</label>
                          <input 
                            type="text" 
                            className="glass-input font-medium" 
                            value={settingsTags}
                            onChange={(e) => setSettingsTags(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: Operational Parameters */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                        <Clock size={15} className="text-primary" /> Operational Parameters
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Avg. Delivery Time (Mins)</label>
                          <input 
                            type="number" 
                            className="glass-input font-bold" 
                            value={settingsTime}
                            onChange={(e) => setSettingsTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Delivery Charge (₹)</label>
                          <input 
                            type="number" 
                            className="glass-input font-bold" 
                            step="0.01" 
                            value={settingsFee}
                            onChange={(e) => setSettingsFee(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Operating Hours / Timings</label>
                          <input 
                            type="text" 
                            className="glass-input font-bold" 
                            placeholder="11:00 AM - 11:00 PM"
                            value={settingsTimings}
                            onChange={(e) => setSettingsTimings(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION C: Locality & Geospatial Dispatch */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                        <Search size={15} className="text-primary" /> India Locality & Dispatch Coordinates
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Indian City *</label>
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
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Locality / Area *</label>
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
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Price Tier *</label>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Latitude Coordinate</label>
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
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Longitude Coordinate</label>
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
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Delivery Radius (km)</label>
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
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Serviceable Pincodes</label>
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

                    {/* SECTION D: Settlements & UPI Bank Details */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                        <IndianRupee size={15} className="text-primary" /> Payout & UPI Bank Verification
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">Merchant UPI ID / VPA</label>
                          <input 
                            type="text" 
                            className="glass-input font-bold" 
                            placeholder="e.g. restaurantname@okhdfcbank"
                            value={settingsUpiVpa}
                            onChange={(e) => setSettingsUpiVpa(e.target.value)}
                          />
                          <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed font-semibold">
                            Patron checkout scans and digital UPI settlements will route to this direct virtual payment address.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-4 font-bold ${settingsLoading ? 'btn-disabled' : ''}`}
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
      </div>
      </div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-[#0e1420] dark:bg-[#070A0E] border-l border-white/10 shadow-[var(--shadow-floating)] z-[9999] p-8 overflow-y-auto text-left"
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

              <form onSubmit={handleDishFormSubmit} className="flex flex-col gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Dish Name *</label>
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
                  <label className="block text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Item Description</label>
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
                    <label className="block text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Price (₹) *</label>
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
                    <label className="block text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Category *</label>
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
                  <label className="block text-[11px] font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Dish Image URL</label>
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
                  className={`btn btn-primary h-11 flex items-center justify-center gap-2 mt-2 font-bold ${dishFormLoading ? 'btn-disabled' : ''}`}
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
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6 select-none">
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
              className="bg-[#0E1318] dark:bg-[#070A0E] border border-border-light rounded-[24px] p-7 max-w-[500px] w-full relative z-10 text-left shadow-2xl"
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
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6 select-none">
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

      {/* 7. HIGH-FIDELITY RECEIPT MODAL FOR DETAILED ORDER OVERVIEW */}
      <AnimatePresence>
        {selectedArchiveOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4 select-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArchiveOrder(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-[#0e1420] dark:bg-[#070A0E] border border-white/10 rounded-[24px] max-w-[460px] w-full relative z-10 p-6 text-left shadow-[var(--shadow-floating)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                <div>
                  <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none">Dining Invoice Receipt</h4>
                  <h3 className="text-base font-extrabold text-text-primary mt-1.5">
                    Order ID: #{selectedArchiveOrder._id.substring(selectedArchiveOrder._id.length - 12).toUpperCase()}
                  </h3>
                  <span className="text-[11px] text-text-secondary mt-1 block">
                    Placed: {new Date(selectedArchiveOrder.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedArchiveOrder(null)} 
                  className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-text-muted hover:text-text-primary rounded-xl transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Status Timeline */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 mb-4">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-text-muted font-bold uppercase tracking-wider">Transaction Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    selectedArchiveOrder.status === 'delivered'
                      ? 'bg-green-500/10 text-green-400 border-green-500/25'
                      : 'bg-red-500/10 text-red-400 border-red-500/25'
                  }`}>
                    {selectedArchiveOrder.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 select-none text-[10px] text-text-muted">
                  <div className={`w-2 h-2 rounded-full ${selectedArchiveOrder.status === 'delivered' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'}`} />
                  <span>Order Lifecycle Terminated via {selectedArchiveOrder.status} stage</span>
                </div>
              </div>

              {/* Item details */}
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Culinary Breakdown</span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto kds-scrollbar pr-1">
                  {selectedArchiveOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white/[0.01] px-3 py-2 rounded-lg border border-white/[0.02]">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <span className="font-extrabold text-primary text-[11px] bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="text-text-primary font-semibold break-words leading-tight">{item.foodItem?.name || 'Chef Dish'}</span>
                      </div>
                      <span className="text-text-secondary font-bold shrink-0">{formatPrice(item.foodItem?.price * item.quantity || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-white/5 pt-3.5 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(selectedArchiveOrder.total - (selectedArchiveOrder.deliveryFee || 0))}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Delivery Dispatch Fee:</span>
                  <span className="font-semibold">{formatPrice(selectedArchiveOrder.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Taxes & GST (simulated):</span>
                  <span className="font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between text-text-primary font-extrabold text-sm border-t border-dashed border-white/5 pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-primary">{formatPrice(selectedArchiveOrder.total)}</span>
                </div>
              </div>

              {/* Patron Locality & Settlements */}
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 text-[11px] text-text-secondary">
                <div>
                  <span className="text-text-muted font-bold uppercase text-[9px] tracking-wider block mb-0.5">Patron Address</span>
                  <p className="leading-relaxed font-medium break-words">{selectedArchiveOrder.deliveryAddress || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-white/[0.02]">
                  <span>Payment Ledger:</span>
                  <span className="font-extrabold text-text-primary uppercase">{selectedArchiveOrder.paymentMethod} ({selectedArchiveOrder.paymentStatus})</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 mt-6">
                <button
                  onClick={() => alert('Print action triggered (Simulation Mode)')}
                  className="flex-1 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98]"
                >
                  🖨️ Print Ticket
                </button>
                <button
                  onClick={() => setSelectedArchiveOrder(null)}
                  className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/15"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
