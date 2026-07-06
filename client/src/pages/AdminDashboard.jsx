import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, ShoppingBag, Database, Users, 
  Film, RefreshCw, ArrowUpRight, IndianRupee, 
  Trash2, ClipboardList, CheckCircle2, AlertCircle,
  Building, Ban, UserCheck, ShieldAlert
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { OrderContext } from '../context/OrderContext';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useContext(AuthContext);
  const { fetchAdminOrders } = useContext(OrderContext);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'restaurants', 'requests', 'orders', 'reels'
  const [loading, setLoading] = useState(true);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dashboard stats state
  const [stats, setStats] = useState({
    totalGrossRevenue: 0,
    totalOrders: 0,
    restaurantsCount: 0,
    reelsCount: 0,
    usersCount: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    flaggedReels: 0
  });

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');

  const [restaurantsList, setRestaurantsList] = useState([]);
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [restaurantsTotalPages, setRestaurantsTotalPages] = useState(1);
  const [restaurantsSearch, setRestaurantsSearch] = useState('');

  const [ordersList, setOrdersList] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  const [partnershipRequests, setPartnershipRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [adminNotesInputs, setAdminNotesInputs] = useState({});

  const [flaggedReels, setFlaggedReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [expandedReelCommentsId, setExpandedReelCommentsId] = useState(null);

  // Load Dashboard statistics
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats metrics:', err.message);
    }
  };

  const [logs, setLogs] = useState([]);

  // Fetch recent administrative logs
  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs');
      if (res.data && res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin audit logs:', err.message);
    }
  };

  // Fetch Users paginated list
  const fetchUsers = async (targetPage = 1, searchVal = '') => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: targetPage,
        limit: 8,
        ...(searchVal && { search: searchVal })
      });
      const res = await api.get(`/admin/users?${queryParams.toString()}`);
      if (res.data && res.data.success) {
        setUsersList(res.data.data || []);
        setUsersPage(res.data.page);
        setUsersTotalPages(res.data.totalPages);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Restaurants paginated list
  const fetchRestaurants = async (targetPage = 1, searchVal = '') => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: targetPage,
        limit: 8,
        ...(searchVal && { search: searchVal })
      });
      const res = await api.get(`/admin/restaurants?${queryParams.toString()}`);
      if (res.data && res.data.success) {
        setRestaurantsList(res.data.data || []);
        setRestaurantsPage(res.data.page);
        setRestaurantsTotalPages(res.data.totalPages);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load restaurant directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders paginated list
  const fetchOrders = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await fetchAdminOrders(targetPage, 8);
      if (res && res.data) {
        setOrdersList(res.data || []);
        setOrdersPage(res.page);
        setOrdersTotalPages(res.totalPages);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load global order log.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Onboarding applications
  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/auth/partnership-requests');
      if (res.data && res.data.success) {
        setPartnershipRequests(res.data.data || []);
      }
    } catch (err) {
      setErrorMsg('Failed to retrieve partnership requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch Flagged video reels
  const fetchFlaggedReels = async (targetPage = 1) => {
    setReelsLoading(true);
    try {
      const res = await api.get(`/admin/reels?page=${targetPage}&limit=10`);
      if (res.data && res.data.success) {
        setFlaggedReels(res.data.data || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load flagged reels feed.');
    } finally {
      setReelsLoading(false);
    }
  };

  // Onboarding Approve action
  const handleApproveRequest = async (id) => {
    setActionProcessing(true);
    try {
      const notes = adminNotesInputs[id] || 'Verified and approved successfully.';
      const res = await api.put(`/auth/partnership-requests/${id}/approve`, { adminNotes: notes });
      if (res.data && res.data.success) {
        await fetchRequests();
        await fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Onboarding Reject action
  const handleRejectRequest = async (id) => {
    setActionProcessing(true);
    try {
      const notes = adminNotesInputs[id] || 'Application does not meet requirements.';
      const res = await api.put(`/auth/partnership-requests/${id}/reject`, { adminNotes: notes });
      if (res.data && res.data.success) {
        await fetchRequests();
        await fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionProcessing(false);
    }
  };

  // Toggle User Suspension status
  const handleToggleUserSuspension = async (userId) => {
    setActionProcessing(true);
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      if (res.data && res.data.success) {
        await fetchUsers(usersPage, usersSearch);
        await fetchStats();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Suspension state change failed.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Change User Role dropdown
  const handleRoleChange = async (userId, targetRole) => {
    setActionProcessing(true);
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: targetRole });
      if (res.data && res.data.success) {
        await fetchUsers(usersPage, usersSearch);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Toggle Restaurant Suspension status
  const handleToggleRestaurantSuspension = async (restId) => {
    setActionProcessing(true);
    try {
      const res = await api.put(`/admin/restaurants/${restId}/suspend`);
      if (res.data && res.data.success) {
        await fetchRestaurants(restaurantsPage, restaurantsSearch);
        await fetchStats();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to toggle restaurant suspension status.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Moderation: Clear/Dismiss reports on a Reel
  const handleDismissReelReports = async (reelId) => {
    setActionProcessing(true);
    try {
      const res = await api.put(`/admin/reels/${reelId}/dismiss`);
      if (res.data && res.data.success) {
        await fetchFlaggedReels(1);
        await fetchStats();
      }
    } catch (err) {
      setErrorMsg('Failed to dismiss reports on this reel.');
    } finally {
      setActionProcessing(false);
    }
  };

  // Moderation: Delete Reel
  const handleRemoveReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to permanently remove this reported reel from Savoré?')) return;
    setActionProcessing(true);
    try {
      const res = await api.delete(`/admin/reels/${reelId}`);
      if (res.data) {
        await fetchFlaggedReels(1);
        await fetchStats();
      }
    } catch (err) {
      setErrorMsg('Failed to remove this reel from database.');
    } finally {
      setActionProcessing(false);
    }
  };

  const [commentDeleteTarget, setCommentDeleteTarget] = useState(null);

  const handleDeleteCommentClick = (reelId, commentId) => {
    setCommentDeleteTarget({ reelId, commentId });
  };

  const confirmDeleteComment = async () => {
    if (!commentDeleteTarget) return;
    const { reelId, commentId } = commentDeleteTarget;
    setActionProcessing(true);
    try {
      const res = await api.delete(`/reels/${reelId}/comments/${commentId}`);
      if (res.data && res.data.success) {
        await fetchFlaggedReels(1);
      }
    } catch (err) {
      setErrorMsg('Failed to delete comment.');
    } finally {
      setActionProcessing(false);
      setCommentDeleteTarget(null);
    }
  };

  // Debounced search trigger for Users directory
  useEffect(() => {
    if (activeTab !== 'users') return;
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, usersSearch);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [usersSearch, activeTab]);

  // Debounced search trigger for Restaurants directory
  useEffect(() => {
    if (activeTab !== 'restaurants') return;
    const delayDebounceFn = setTimeout(() => {
      fetchRestaurants(1, restaurantsSearch);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [restaurantsSearch, activeTab]);

  // Tab change state loader helper (prevents double-fetching users & restaurants)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const loadTabData = async () => {
      setErrorMsg('');
      if (activeTab === 'dashboard') {
        setLoading(true);
        await Promise.all([fetchStats(), fetchLogs()]);
        setLoading(false);
      } else if (activeTab === 'requests') {
        await fetchRequests();
      } else if (activeTab === 'orders') {
        await fetchOrders(1);
      } else if (activeTab === 'reels') {
        await fetchFlaggedReels(1);
      }
    };

    loadTabData();
  }, [activeTab, isAuthenticated, isAdmin, navigate]);

  const handleRefresh = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([fetchStats(), fetchLogs()]);
      } else if (activeTab === 'requests') {
        await fetchRequests();
      } else if (activeTab === 'orders') {
        await fetchOrders(ordersPage);
      } else if (activeTab === 'reels') {
        await fetchFlaggedReels(1);
      } else if (activeTab === 'users') {
        await fetchUsers(usersPage, usersSearch);
      } else if (activeTab === 'restaurants') {
        await fetchRestaurants(restaurantsPage, restaurantsSearch);
      }
    } catch (err) {
      console.error('Failed to reload panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render smart paginator panel
  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-3 mt-6 flex-wrap">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="chip btn-pill text-[10.5px] font-bold bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="chip btn-pill text-[10.5px] font-bold bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer"
        >
          Prev
        </button>
        <span className="text-xs font-semibold text-text-secondary">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="chip btn-pill text-[10.5px] font-bold bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer"
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="chip btn-pill text-[10.5px] font-bold bg-transparent text-text-secondary disabled:opacity-40 cursor-pointer"
        >
          Last
        </button>
      </div>
    );
  };

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="container min-h-[calc(100vh-160px)] pt-4 pb-20 px-6 text-left flex flex-col lg:flex-row gap-8 -mt-16 lg:-mt-24">
      
      {/* 1. MASTER SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-5 rounded-[24px]">
          <div className="flex items-center gap-2 mb-6 px-1.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary tracking-tight">Savoré Master Admin</h2>
              <span className="text-[9.5px] text-text-muted uppercase font-bold tracking-widest">Enterprise Console</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'dashboard', label: 'Console Dashboard', icon: Database },
              { id: 'users', label: 'User Directory', icon: Users },
              { id: 'restaurants', label: 'Restaurant Hub', icon: Building },
              { id: 'requests', label: 'Culinary Requests', icon: UserCheck, count: stats.pendingApprovals },
              { id: 'orders', label: 'Global Orders Log', icon: ClipboardList },
              { id: 'reels', label: 'Reels Moderation', icon: Film, count: stats.flaggedReels }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                  {tab.count > 0 && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary border border-primary/25'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="glass-panel p-4 rounded-[20px] text-center flex flex-col gap-2">
          <p className="text-[10px] text-text-muted font-semibold leading-relaxed">
            Logged in as <strong>{user?.username}</strong>
          </p>
          <button 
            onClick={() => navigate('/profile')} 
            className="w-full py-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-lg text-[10px] font-bold text-text-secondary cursor-pointer"
          >
            My Admin Profile
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE PANEL */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Dynamic header title block */}
        <div className="glass-panel p-6 rounded-[24px] flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-extrabold text-text-primary capitalize">
              {activeTab === 'dashboard' ? 'System Control' : `${activeTab.replace('_', ' ')} Management`}
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              {activeTab === 'dashboard' && 'Monitor gross revenues, manage active onboardings, and track user status metrics.'}
              {activeTab === 'users' && 'Search, ban, suspend customer accounts and re-assign operational roles.'}
              {activeTab === 'restaurants' && 'Manage operational status, verify kitchen documents, or suspend merchant accounts.'}
              {activeTab === 'requests' && 'Review incoming culinary registration applications and provision kitchen directories.'}
              {activeTab === 'orders' && 'Trace master system delivery streams and review item pricing structures.'}
              {activeTab === 'reels' && 'Moderate vertical video reels, audit report flags, and dismiss user report logs.'}
            </p>
          </div>
          
          <button 
            onClick={handleRefresh}
            className="chip btn-pill text-[10.5px] font-bold flex items-center gap-1.5"
            disabled={loading || actionProcessing}
          >
            <RefreshCw size={11} className={loading || actionProcessing ? 'animate-spin' : ''} />
            <span>Reload Panel</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 flex items-center gap-2.5 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* LOADING PANE */}
        {loading && activeTab !== 'dashboard' ? (
          <div className="glass-panel rounded-[24px] py-20 text-center flex items-center justify-center">
            <RefreshCw className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-6 rounded-[20px] bg-[var(--surface-container)] border border-[var(--border-light)] hover:scale-[1.01] transition-transform">
                    <div className="flex justify-between items-center text-primary">
                      <IndianRupee size={18} />
                      <ArrowUpRight size={14} />
                    </div>
                    <p className="text-[11px] text-text-muted font-bold mt-4 uppercase tracking-wide">Gross SaaS Revenue</p>
                    <h3 className="text-2xl font-black mt-1 text-text-primary">{formatPrice(stats.totalGrossRevenue)}</h3>
                  </div>

                  <div className="p-6 rounded-[20px] bg-[var(--surface-container)] border border-[var(--border-light)] hover:scale-[1.01] transition-transform">
                    <div className="flex justify-between items-center text-green-500">
                      <ShoppingBag size={18} />
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20 uppercase tracking-widest">Realtime</span>
                    </div>
                    <p className="text-[11px] text-text-muted font-bold mt-4 uppercase tracking-wide">Total Orders</p>
                    <h3 className="text-2xl font-black mt-1 text-text-primary">{stats.totalOrders}</h3>
                  </div>

                  <div className="p-6 rounded-[20px] bg-[var(--surface-container)] border border-[var(--border-light)] hover:scale-[1.01] transition-transform">
                    <div className="flex justify-between items-center text-yellow-500">
                      <Building size={18} />
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 uppercase tracking-widest">Kitchens</span>
                    </div>
                    <p className="text-[11px] text-text-muted font-bold mt-4 uppercase tracking-wide">Registered Restaurants</p>
                    <h3 className="text-2xl font-black mt-1 text-text-primary">{stats.restaurantsCount}</h3>
                  </div>

                  <div className="p-6 rounded-[20px] bg-[var(--surface-container)] border border-[var(--border-light)] hover:scale-[1.01] transition-transform">
                    <div className="flex justify-between items-center text-[#ff8000]">
                      <Users size={18} />
                      <span className="text-[9px] font-bold px-1 py-0.5 bg-[#ff8000]/10 text-[#ff8000] rounded border border-[#ff8000]/20 uppercase tracking-widest">Users</span>
                    </div>
                    <p className="text-[11px] text-text-muted font-bold mt-4 uppercase tracking-wide">Total / Active Users</p>
                    <h3 className="text-2xl font-black mt-1 text-text-primary">{stats.usersCount} <span className="text-xs text-text-muted font-semibold">({stats.activeUsers} Active)</span></h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Alerts panel */}
                  <div className="glass-panel p-6 rounded-[24px] md:col-span-2 text-left">
                    <h3 className="text-sm font-black text-text-primary mb-4 uppercase tracking-wider">Console System Alerts</h3>
                    <div className="flex flex-col gap-3">
                      {stats.pendingApprovals > 0 && (
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                          <ShieldAlert size={16} className="text-primary mt-0.5" />
                          <div>
                            <strong className="text-xs text-text-primary font-bold">Pending Merchant Onboardings</strong>
                            <p className="text-[10px] text-text-secondary mt-1">There are {stats.pendingApprovals} partnership applications waiting for document verification and provisioning.</p>
                          </div>
                        </div>
                      )}
                      {stats.flaggedReels > 0 && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                          <Ban size={16} className="text-red-500 mt-0.5" />
                          <div>
                            <strong className="text-xs text-text-primary font-bold">Content Flagged for Moderation</strong>
                            <p className="text-[10px] text-text-secondary mt-1">{stats.flaggedReels} reels have been reported by users. Please audit video captions and contents.</p>
                          </div>
                        </div>
                      )}
                      {stats.pendingApprovals === 0 && stats.flaggedReels === 0 && (
                        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center py-8">
                          <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                          <strong className="text-xs text-green-500 block">Savoré System Integrity Secure</strong>
                          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">No pending alerts, flagged contents, or onboarding requests require immediate attention.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Platform Overview */}
                  <div className="glass-panel p-6 rounded-[24px] text-left flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">System Audit Trail</h3>
                      <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {logs.length > 0 ? (
                          logs.map((log) => (
                            <div 
                              key={log._id} 
                              className="p-3 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/[0.03]"
                            >
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-primary">@{log.admin?.username || 'system'}</span>
                                <span className="text-text-muted">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                                {log.details}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 rounded-xl bg-white/[0.01] border border-white/5 text-center text-text-muted text-[10px]">
                            No administrative events recorded in this audit cycle.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                      <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Platform Security</h3>
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted">RBAC Role Enforcement</span>
                          <span className="text-green-500 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded">Active</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted">API Rate Limiting</span>
                          <span className="text-green-500 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded">Active</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted">NoSQL Injection Shield</span>
                          <span className="text-green-500 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USERS REGISTER */}
            {activeTab === 'users' && (
              <div className="glass-panel p-6 rounded-[24px] flex flex-col gap-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="glass-input-wrapper relative flex-1 min-w-[240px]">
                    <input 
                      type="text" 
                      className="glass-input pl-10 text-xs" 
                      placeholder="Search users by name, email, or username..." 
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                    />
                  </div>
                </div>

                {usersList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-light)] text-text-muted font-extrabold uppercase">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role Reassignment</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((usr) => (
                          <tr key={usr._id} className="border-b border-[var(--border-light)] text-text-secondary hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 max-w-[160px] truncate">
                              <div>
                                <strong className="text-[13px] text-text-primary font-bold">{usr.username}</strong>
                                {usr.name && <span className="text-[10px] text-text-muted block mt-0.5 font-semibold capitalize truncate">{usr.name}</span>}
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-text-secondary max-w-[180px] truncate">{usr.email}</td>
                            <td className="p-4">
                              {usr._id === user?._id ? (
                                <span className="text-[10px] text-text-muted font-bold block">Current Admin Account</span>
                              ) : (
                                <select 
                                  className="h-8 rounded-lg bg-surface border border-[var(--border-light)] text-[11px] font-bold text-text-secondary px-2"
                                  value={usr.role}
                                  onChange={(e) => handleRoleChange(usr._id, e.target.value)}
                                  disabled={actionProcessing}
                                >
                                  <option value="customer">Customer</option>
                                  <option value="restaurant">Restaurant Owner</option>
                                  <option value="admin">Platform Admin</option>
                                </select>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${usr.isSuspended ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {usr.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {usr._id !== user?._id && (
                                <button
                                  onClick={() => handleToggleUserSuspension(usr._id)}
                                  disabled={actionProcessing}
                                  className={`btn btn-pill text-[10.5px] font-bold py-1.5 px-3 border flex items-center gap-1 inline-flex cursor-pointer ${
                                    usr.isSuspended 
                                      ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                                      : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                                  }`}
                                >
                                  <Ban size={11} />
                                  <span>{usr.isSuspended ? 'Re-Activate' : 'Suspend Account'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {renderPagination(usersPage, usersTotalPages, (p) => fetchUsers(p, usersSearch))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-text-secondary">
                    No users found matching your active directory search filters.
                  </div>
                )}
              </div>
            )}

            {/* TAB: RESTAURANT HUB */}
            {activeTab === 'restaurants' && (
              <div className="glass-panel p-6 rounded-[24px] flex flex-col gap-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="glass-input-wrapper relative flex-1 min-w-[240px]">
                    <input 
                      type="text" 
                      className="glass-input pl-10 text-xs" 
                      placeholder="Search kitchens by name, locality, or city..." 
                      value={restaurantsSearch}
                      onChange={(e) => setRestaurantsSearch(e.target.value)}
                    />
                  </div>
                </div>

                {restaurantsList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-light)] text-text-muted font-extrabold uppercase">
                          <th className="p-4">Kitchen Name</th>
                          <th className="p-4">Owner Profile</th>
                          <th className="p-4">Location Zone</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurantsList.map((rest) => (
                          <tr key={rest._id} className="border-b border-[var(--border-light)] text-text-secondary hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 max-w-[180px] truncate">
                              <div className="flex items-center gap-3">
                                {rest.coverImage && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/5 shrink-0 bg-slate-900">
                                    <img src={rest.coverImage} alt={rest.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <strong className="text-[13px] text-text-primary font-bold truncate block">{rest.name}</strong>
                                  <span className="text-[9.5px] text-text-muted block mt-0.5 font-semibold capitalize truncate">{rest.priceRange} • {rest.cuisines?.slice(0, 2).join(', ')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-text-secondary max-w-[180px] truncate">
                              {rest.owner ? (
                                <div className="truncate">
                                  <span className="truncate block">{rest.owner.username}</span>
                                  <span className="text-[10px] text-text-muted block font-normal mt-0.5 truncate">{rest.owner.email}</span>
                                </div>
                              ) : (
                                <span className="text-text-muted italic">Orphaned Account</span>
                              )}
                            </td>
                            <td className="p-4 max-w-[140px] truncate">
                              <span className="font-semibold text-text-secondary truncate block">
                                📍 {rest.locality}, {rest.city}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${rest.isSuspended ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                {rest.isSuspended ? 'Suspended' : 'Operational'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleToggleRestaurantSuspension(rest._id)}
                                disabled={actionProcessing}
                                className={`btn btn-pill text-[10.5px] font-bold py-1.5 px-3 border flex items-center gap-1 inline-flex cursor-pointer ${
                                  rest.isSuspended 
                                    ? 'bg-green-50 hover:bg-green-600 text-white border-green-500' 
                                    : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                                }`}
                              >
                                <Ban size={11} />
                                <span>{rest.isSuspended ? 'Restore Operations' : 'Suspend Kitchen'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {renderPagination(restaurantsPage, restaurantsTotalPages, (p) => fetchRestaurants(p, restaurantsSearch))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-text-secondary">
                    No registered kitchens found matching your active filter criteria.
                  </div>
                )}
              </div>
            )}

            {/* TAB: CULINARY REQUESTS */}
            {activeTab === 'requests' && (
              <div className="glass-panel p-6 rounded-[24px]">
                <h3 className="text-sm font-black text-text-primary mb-6 uppercase tracking-wider">Restaurant Partnership Applications</h3>
                
                {requestsLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-spin text-primary" size={24} />
                  </div>
                ) : partnershipRequests.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {partnershipRequests.map((req) => (
                      <div 
                        key={req._id} 
                        className="bg-[var(--surface-bright)] border border-[var(--border-light)] p-6 rounded-2xl text-left"
                      >
                        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-[var(--border-light)]/45 pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-[15px] font-black text-text-primary">{req.restaurantName}</h4>
                              <span className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase ${
                                req.status === 'pending' ? 'bg-orange-500/10 text-primary border border-primary/20' :
                                req.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-secondary mt-1">
                              Applied by <strong>{req.user?.username}</strong> ({req.user?.email})
                            </p>
                          </div>
                          <span className="text-[10px] text-text-muted">{new Date(req.createdAt).toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <div className="flex flex-col gap-3">
                            {req.description && (
                              <p className="text-xs text-text-primary italic leading-relaxed">
                                "{req.description}"
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-text-secondary">
                              <span className="px-2.5 py-1 bg-surface border border-[var(--border-light)] rounded-lg">
                                📍 {req.locality}, {req.city} ({req.pincode})
                              </span>
                              <span className="px-2.5 py-1 bg-surface border border-[var(--border-light)] rounded-lg">
                                🏷️ Price Tier: {req.priceRange}
                              </span>
                              {req.cuisines?.length > 0 && (
                                <span className="px-2.5 py-1 bg-surface border border-[var(--border-light)] rounded-lg">
                                  🍜 Cuisines: {req.cuisines.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            {req.coverImage && (
                              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 border border-[var(--border-light)]">
                                <img src={req.coverImage} alt={req.restaurantName} className="w-full h-full object-cover" />
                              </div>
                            )}

                            {req.status === 'pending' && (
                              <div className="flex flex-col gap-3">
                                <div>
                                  <label className="block text-[9.5px] font-extrabold uppercase text-text-muted mb-1.5">Audit notes / feedback</label>
                                  <input 
                                    type="text" 
                                    className="glass-input !h-9 text-xs" 
                                    placeholder="e.g. Verified address, approved."
                                    value={adminNotesInputs[req._id] || ''}
                                    onChange={(e) => setAdminNotesInputs(prev => ({ ...prev, [req._id]: e.target.value }))}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveRequest(req._id)}
                                    disabled={actionProcessing}
                                    className="btn btn-pill bg-green-500 hover:bg-green-600 text-white text-[10.5px] font-bold py-2 px-4 cursor-pointer"
                                  >
                                    Approve & Provision
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(req._id)}
                                    disabled={actionProcessing}
                                    className="btn btn-pill bg-red-500 hover:bg-red-600 text-white text-[10.5px] font-bold py-2 px-4 border-none cursor-pointer"
                                  >
                                    Reject Application
                                  </button>
                                </div>
                              </div>
                            )}

                            {req.status !== 'pending' && req.adminNotes && (
                              <div className="p-3 rounded-xl bg-surface border border-[var(--border-light)] text-[11px] text-text-secondary leading-relaxed">
                                <strong>Admin Feedback:</strong> "{req.adminNotes}"
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary">
                    No culinary applications logged in the system.
                  </div>
                )}
              </div>
            )}

            {/* TAB: GLOBAL ORDERS STREAM */}
            {activeTab === 'orders' && (
              <div className="glass-panel p-6 rounded-[24px] flex flex-col gap-6">
                {ordersList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-light)] text-text-muted font-extrabold uppercase">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Restaurant</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Payment Status</th>
                          <th className="p-4">Delivery State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.map((ord) => (
                          <tr key={ord._id} className="border-b border-[var(--border-light)] text-text-secondary hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-mono text-[10.5px] tracking-normal max-w-[120px] truncate">{ord._id}</td>
                            <td className="p-4 font-semibold text-text-primary max-w-[150px] truncate">{ord.restaurant?.name || 'Kitchen'}</td>
                            <td className="p-4 font-semibold text-text-secondary max-w-[140px] truncate">{ord.user?.username || 'Client'}</td>
                            <td className="p-4 font-bold text-primary">{formatPrice(ord.total)}</td>
                            <td className="p-4">
                              <span 
                                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                  ord.paymentStatus === 'paid' 
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                    : 'bg-orange-500/10 text-primary border border-primary/20'
                                }`}
                              >
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="bg-surface text-text-primary px-2.5 py-1 rounded-lg text-[9.5px] font-bold border border-[var(--border-light)] uppercase">
                                {ord.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {renderPagination(ordersPage, ordersTotalPages, fetchOrders)}
                  </div>
                ) : (
                  <div className="text-center py-10 text-text-secondary">
                    No orders recorded on the platform yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB: REELS MODERATION */}
            {activeTab === 'reels' && (
              <div className="glass-panel p-6 rounded-[24px] flex flex-col gap-6">
                {reelsLoading ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="animate-spin text-primary" size={24} />
                  </div>
                ) : flaggedReels.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {flaggedReels.map((reel) => (
                      <div 
                        key={reel._id} 
                        className="bg-[var(--surface-container)] border border-[var(--border-light)] p-5 rounded-2xl flex flex-col gap-4 text-left"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-4">
                          <div>
                            <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-2 uppercase">
                              {reel.reports?.length || 0} Platform Reports Flagged
                            </span>
                            <h4 className="text-sm font-bold text-text-primary leading-relaxed">
                              "{reel.caption}"
                            </h4>
                            <span className="text-[11px] text-text-muted mt-1 block">Uploaded by: <strong>{reel.restaurant?.name || 'Kitchen'}</strong></span>
                          </div>

                          <div className="flex gap-2.5">
                            <button 
                              onClick={() => setExpandedReelCommentsId(expandedReelCommentsId === reel._id ? null : reel._id)}
                              className="btn btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              {expandedReelCommentsId === reel._id ? 'Hide Comments' : `Audit Comments (${reel.comments?.length || 0})`}
                            </button>
                            <button 
                              onClick={() => handleDismissReelReports(reel._id)} 
                              disabled={actionProcessing}
                              className="btn btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Dismiss Reports
                            </button>
                            <button 
                              onClick={() => handleRemoveReel(reel._id)} 
                              disabled={actionProcessing}
                              className="btn btn-primary px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 border-none hover:bg-red-600 flex items-center cursor-pointer"
                            >
                              <Trash2 size={12} className="mr-1.5" />
                              <span>Remove Reel</span>
                            </button>
                          </div>
                        </div>

                        {expandedReelCommentsId === reel._id && (
                          <div className="mt-2 pt-4 border-t border-[var(--border-light)] flex flex-col gap-3">
                            <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Reel Comments ({reel.comments?.length || 0})</h5>
                            {reel.comments && reel.comments.length > 0 ? (
                              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                                {reel.comments.map((comment) => (
                                  <div key={comment._id} className="flex justify-between items-center bg-black/10 dark:bg-white/[0.01] p-3 rounded-xl gap-4">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <SafeAvatar 
                                        src={resolveMediaUrl(comment.user?.profilePicture)} 
                                        alt={comment.user?.username || 'Diner'} 
                                        size={22}
                                        className="shrink-0"
                                      />
                                      <div className="min-w-0 text-[12px]">
                                        <span className="font-semibold text-text-primary mr-2">@{comment.user?.username || 'Diner'}:</span>
                                        <span className="text-text-secondary break-words">{comment.text}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteCommentClick(reel._id, comment._id)}
                                      disabled={actionProcessing}
                                      className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                      title="Delete comment"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-text-muted italic py-2">No comments have been posted on this reel yet.</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-text-secondary">
                    No flagged video reels currently pending moderation audits.
                  </div>
                )}
              </div>
            )}

          </>
        )}

      {/* COMMENT DELETION CONFIRMATION MODAL */}
      {commentDeleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6 select-none bg-black/65 backdrop-blur-xs transition-opacity duration-300">
          <div 
            onClick={() => setCommentDeleteTarget(null)}
            className="absolute inset-0 cursor-pointer"
          />
          
          <div
            className="bg-[#12161c] border border-white/10 rounded-[24px] p-6 max-w-[380px] w-full relative z-10 text-center shadow-2xl text-[var(--text-primary)] transition-transform duration-300 transform scale-100"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <h4 className="text-md font-bold text-white mb-2">Delete Comment?</h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Are you sure you want to permanently delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCommentDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/[0.04] cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold border-none cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
