import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShoppingBag, Database, Users, 
  Film, RefreshCw, Star, ArrowUpRight, IndianRupee, 
  Trash2, Eye, ClipboardList, CheckCircle2, AlertCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { OrderContext } from '../context/OrderContext';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useContext(AuthContext);
  const { fetchAdminOrders } = useContext(OrderContext);

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalGrossRevenue: 0,
    restaurantsCount: 0,
    reelsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'moderation'

  // Mock moderation database
  const [flaggedReels, setFlaggedReels] = useState([
    { _id: '1', caption: 'Deep fried truffle sticks with spicy honey syrup', reports: 3, restaurantName: 'La Pergola' },
    { _id: '2', caption: 'Raw oysters selection from fresh ocean beds', reports: 1, restaurantName: 'Osteria Francescana' }
  ]);

  const fetchGlobalStats = async () => {
    try {
      // Fetch restaurants count
      const restRes = await api.get('/restaurants?limit=100');
      const totalRests = restRes.data.data.length;
      const sumRevenue = restRes.data.data.reduce((acc, r) => acc + (r.revenue || 0), 0);

      // Fetch reels count
      const reelsRes = await api.get('/reels?limit=100');
      const totalReels = reelsRes.data.data.length;

      // Fetch orders to calculate totals
      const ordRes = await fetchAdminOrders(1, 100);
      const totalOrds = ordRes.data.length;

      setStats({
        totalOrders: totalOrds,
        totalGrossRevenue: parseFloat(sumRevenue.toFixed(2)),
        restaurantsCount: totalRests,
        reelsCount: totalReels
      });
    } catch (err) {
      console.warn('Failed to calculate exact live metrics, using defaults.', err.message);
    }
  };

  const fetchOrdersData = async (targetPage = 1) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchAdminOrders(targetPage, 10);
      if (res && res.data) {
        setOrders(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve global orders registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    const loadAll = async () => {
      await fetchOrdersData(1);
      await fetchGlobalStats();
    };
    loadAll();
  }, [isAuthenticated, isAdmin, navigate]);

  const handleDismissFlag = (id) => {
    setFlaggedReels(prev => prev.filter(r => r._id !== id));
  };

  const handleRemoveReel = async (id) => {
    // Simulated deletion
    setFlaggedReels(prev => prev.filter(r => r._id !== id));
    alert('Reel successfully removed from the global Reels feed index.');
  };

  // Helper stats style is now fully handled in Tailwind classes directly

  if (loading && stats.totalOrders === 0) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <RefreshCw className="animate-stir text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="container fade-in py-10 px-6 pb-20 text-left">
      
      {/* Top Header Card */}
      <div className="glass-panel p-8 rounded-[24px] mb-10 flex justify-between items-center flex-wrap gap-6">
        <div>
          <span className="text-[12px] text-[var(--accent)] font-extrabold uppercase tracking-[0.05em]">Platform Administration</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Savoré Master Console
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor global accounts, track active deliveries, check SaaS revenue distributions, and moderate vertical video Reels.
          </p>
        </div>

        {/* Tab switches */}
        <div className="flex gap-2 bg-surface p-1.5 rounded-2xl border border-[var(--border-light)]">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`btn btn-pill text-[13px] flex items-center ${
              activeTab === 'orders' ? 'btn-primary text-white bg-primary' : 'bg-transparent text-text-secondary'
            }`}
          >
            <ClipboardList size={14} className="mr-1.5" /> Global Orders
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`btn btn-pill text-[13px] flex items-center ${
              activeTab === 'moderation' ? 'btn-primary text-white bg-primary' : 'bg-transparent text-text-secondary'
            }`}
          >
            <ShieldCheck size={14} className="mr-1.5" /> Moderate Reels
          </button>
        </div>
      </div>

      {/* Grid: Global SaaS Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left">
          <div className="flex justify-between items-center text-[var(--accent)]">
            <IndianRupee size={20} />
            <ArrowUpRight size={16} />
          </div>
          <h4 className="text-[13px] text-text-muted font-semibold mt-4">Global SaaS Gross Volume</h4>
          <h2 className="text-3xl font-extrabold mt-1 text-text-primary">
            {formatPrice(stats.totalGrossRevenue)}
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left">
          <div className="flex justify-between items-center text-primary">
            <ShoppingBag size={20} />
            <span className="text-[11px] font-bold text-primary">Realtime</span>
          </div>
          <h4 className="text-[13px] text-text-muted font-semibold mt-4">Total Registered Orders</h4>
          <h2 className="text-3xl font-extrabold mt-1 text-text-primary">
            {stats.totalOrders}
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left">
          <div className="flex justify-between items-center text-[#ffc83b]">
            <Database size={20} />
            <Star size={14} fill="#ffc83b" stroke="#ffc83b" />
          </div>
          <h4 className="text-[13px] text-text-muted font-semibold mt-4">Registered Restaurants</h4>
          <h2 className="text-3xl font-extrabold mt-1 text-text-primary">
            {stats.restaurantsCount}
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface-container)] border border-[var(--border-light)] text-left">
          <div className="flex justify-between items-center text-[var(--accent)]">
            <Film size={20} />
            <span className="text-[11px] font-bold text-[var(--accent)]">Vertical</span>
          </div>
          <h4 className="text-[13px] text-text-muted font-semibold mt-4">Video Reels</h4>
          <h2 className="text-3xl font-extrabold mt-1 text-text-primary">
            {stats.reelsCount}
          </h2>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg py-3 px-4 flex items-center gap-2.5 mb-6 text-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: GLOBAL PLATFORM ORDERS REGISTRY */}
      {activeTab === 'orders' && (
        <div className="glass-panel p-8 rounded-[24px]">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2.5">
              <ClipboardList size={20} className="text-primary" />
              Active System Delivery Streams
            </h3>
            <button onClick={() => fetchOrdersData(page)} className="chip btn-pill text-[12px] flex items-center">
              <RefreshCw size={12} className="mr-1.5" /> Refresh Master Stream
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <RefreshCw className="animate-stir text-text-muted" size={24} />
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-text-muted">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Restaurant</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Total Price</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Delivery Tracker</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id} className="border-b border-[var(--border-light)] text-text-secondary hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-monospace text-[12px]">{ord._id}</td>
                      <td className="p-4 font-semibold text-text-primary">{ord.restaurant?.name || 'Kitchen'}</td>
                      <td className="p-4">{ord.user?.username || 'Client'}</td>
                      <td className="p-4 font-bold text-primary">{formatPrice(ord.total)}</td>
                      <td className="p-4">
                        <span 
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                            ord.paymentStatus === 'paid' 
                              ? 'bg-green-500/10 text-[var(--accent)]' 
                              : 'bg-orange-500/10 text-primary'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-surface text-text-primary px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[var(--border-light)] uppercase">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
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
            <div className="text-center py-10 text-text-secondary">
              No master orders recorded in the system yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLATFORM REELS CONTENT MODERATION HUB */}
      {activeTab === 'moderation' && (
        <div className="glass-panel p-8 rounded-[24px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-[var(--accent)]" />
            Video Reels Moderation Index
          </h3>

          {flaggedReels.length > 0 ? (
            <div className="flex flex-col gap-4">
              {flaggedReels.map((reel) => (
                <div 
                  key={reel._id} 
                  className="bg-[var(--surface-container)] border border-[var(--border-light)] p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4"
                >
                  <div>
                    <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold px-2 py-0.5 rounded-md inline-block mb-2">
                      {reel.reports} Reports Flagged
                    </span>
                    <h4 className="text-[15px] font-bold text-text-primary">
                      "{reel.caption}"
                    </h4>
                    <span className="text-xs text-text-muted">Uploaded by: <strong>{reel.restaurantName}</strong></span>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={() => handleDismissFlag(reel._id)} 
                      className="btn btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      Dismiss Reports
                    </button>
                    <button 
                      onClick={() => handleRemoveReel(reel._id)} 
                      className="btn btn-primary px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 border-none hover:bg-red-600 flex items-center"
                    >
                      <Trash2 size={13} className="mr-1.5" /> Remove Reel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-text-secondary">
              No flagged reels pending moderation review.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
