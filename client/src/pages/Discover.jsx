import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Clock, Star, Filter, Tag, Compass, ChevronRight, 
  MapPin, ChevronDown, X, Navigation, SlidersHorizontal, Check, 
  Home, Briefcase, Building, Sparkles, IndianRupee, Globe, AlertTriangle
} from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';
import { LocationContext, CITIES, CITY_LOCALITIES, CITY_COORDINATES } from '../context/LocationContext';

const CUISINES = ['All', 'French', 'Italian', 'Indian', 'Japanese', 'European', 'Sushi', 'Desserts', 'Seafood', 'Bakery'];

const PRICE_TIERS = [
  { value: 'All', label: 'All Budgets', desc: 'Any pricing range' },
  { value: '₹', label: 'Budget Eats', desc: 'Under ₹300' },
  { value: '₹₹', label: 'Mid-range', desc: '₹300 - ₹700' },
  { value: '₹₹₹', label: 'Premium', desc: '₹700 - ₹1500' },
  { value: '₹₹₹₹', label: 'Premium Dining', desc: '₹1500+' }
];

const MOCK_RESTAURANTS = [
  {
    _id: 'mock-rest-1',
    name: "L'Ambroisie",
    description: "Experience Parisienne popular dining with modern culinary elegance, featuring signature Italian-French fusion recipes.",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 45, deliveryFee: 120.00,
    tags: ["Chef Recommended", "Michelin Star", "Premium Dining"], cuisines: ["French", "Italian", "European"],
    city: "Mumbai", locality: "Bandra", priceRange: "₹₹₹₹",
    coordinates: { coordinates: [72.8258, 19.0596] }
  },
  {
    _id: 'mock-rest-2',
    name: "Saffron Bistro",
    description: "Modern Indian cuisine cooked over authentic clay ovens, fused with aromatic European herbs and spices.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 30, deliveryFee: 0.00,
    tags: ["Hot Right Now", "Comfort Food", "Spicy"], cuisines: ["Indian", "Fusion", "Vegetarian"],
    city: "Delhi", locality: "Hauz Khas", priceRange: "₹₹",
    coordinates: { coordinates: [77.2060, 28.5495] }
  },
  {
    _id: 'mock-rest-3',
    name: "Sakura Sushi",
    description: "Authentic Edo-style handrolled sushi, fresh sashimi platters, and organic matcha-infused tea selections.",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 25, deliveryFee: 50.00,
    tags: ["Most Loved", "Fresh", "Healthy"], cuisines: ["Japanese", "Sushi", "Asian"],
    city: "Bengaluru", locality: "Indiranagar", priceRange: "₹₹",
    coordinates: { coordinates: [77.6407, 12.9719] }
  },
  {
    _id: 'mock-rest-4',
    name: "Asador Steakhouse",
    description: "Authentic Argentinian steak cuts, slow-grilled over white oak wood charcoal, served alongside spicy homemade chimichurri.",
    coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 40, deliveryFee: 85.00,
    tags: ["Chef Recommended", "Luxury", "Robust"], cuisines: ["Argentinian", "Steak", "Barbecue"],
    city: "Kolkata", locality: "Salt Lake", priceRange: "₹₹₹",
    coordinates: { coordinates: [88.4277, 22.5735] }
  },
  {
    _id: 'mock-rest-5',
    name: "Ramen Shinryu",
    description: "Rich, slow-simmered tonkotsu pork bone broths served with handcrafted wavy noodles, soft soy eggs, and smoked chashu pork belly.",
    coverImage: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 20, deliveryFee: 30.00,
    tags: ["Hot Right Now", "Comfort Food", "Authentic"], cuisines: ["Japanese", "Ramen", "Asian"],
    city: "Pune", locality: "Koregaon Park", priceRange: "₹₹",
    coordinates: { coordinates: [73.8907, 18.5362] }
  },
  {
    _id: 'mock-rest-6',
    name: "Le Petit Chocolat",
    description: "Premium French pastries, masterfully crafted molten cakes, and hand-decorated fresh berry tarts from a champion chocolatier.",
    coverImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 15, deliveryFee: 40.00,
    tags: ["Most Loved", "Sweet", "Dessert"], cuisines: ["French", "Desserts", "Pastries"],
    city: "Hyderabad", locality: "Jubilee Hills", priceRange: "₹₹",
    coordinates: { coordinates: [78.4011, 17.4339] }
  }
];

const getPriceRangeLabel = (range) => {
  if (range === '₹') return 'Budget Eats (Under ₹300)';
  if (range === '₹₹') return 'Mid-range (₹300 - ₹700)';
  if (range === '₹₹₹') return 'Premium (₹700 - ₹1500)';
  if (range === '₹₹₹₹') return 'Premium Dining (₹1500+)';
  return 'All budgets';
};

const IndiaMap = ({ size = 18, className = "" }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} transition-all duration-300`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle',
        filter: hovered 
          ? 'drop-shadow(0 0 8px rgba(255, 90, 60, 0.95)) drop-shadow(0 0 2px rgba(255, 90, 60, 0.4))'
          : 'drop-shadow(0 0 2px rgba(255, 90, 60, 0.4))',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        cursor: 'pointer'
      }}
    >
      <path d="M12 3l.8.9.2 1.5-.3 1-1.7 1-.5 1 1 2 1.3.5 1.7-.5 1.3 1 .9.5.8-.9.6.5-.5 1-2.1 1-.8 1-.9-.5-.4 1 .4 1.5-.8 1.5-.9 3.5-1-3.5-.9-1.5-1-1-1.8-.5-1-.5-.4-1 .4-1 1-.5.4-1-.4-1 .4-1 .9-.5.8-1 1.3-1.5.4-1.5.8-1.5z" />
    </svg>
  );
};

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    activeCity,
    activeLocality,
    activeCoords,
    savedAddresses,
    defaultAddress,
    selectManualCity,
    detectGpsLocation,
    calculateDistance,
    gpsLoading
  } = useContext(LocationContext);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search parameters in url
  const searchQuery = searchParams.get('search') || '';
  const tagQuery = searchParams.get('tag') || '';
  const cuisineQuery = searchParams.get('cuisine') || 'All';
  const priceQuery = searchParams.get('priceRange') || 'All';
  
  // Custom local state filters
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [priceFilter, setPriceFilter] = useState(priceQuery);
  const [selectedLocality, setSelectedLocality] = useState('All');
  const [maxDistance, setMaxDistance] = useState(15); // max search distance in km
  const [fastestDelivery, setFastestDelivery] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'price' | 'locality' | 'cuisine' | null
  const [exploreNationwide, setExploreNationwide] = useState(false);

  // Scroll lock — prevent main page scroll whenever any modal/sheet is open
  useEffect(() => {
    const isOpen = locationModalOpen || mobileFiltersOpen;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [locationModalOpen, mobileFiltersOpen]);

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync pricing filters on url change
  useEffect(() => {
    setSearchInput(searchQuery);
    setPriceFilter(priceQuery);
  }, [searchQuery, priceQuery]);

  // Reset locality and page when city changes — prevents stale cross-city results
  useEffect(() => {
    setSelectedLocality('All');
    setPage(1);
  }, [activeCity]);

  // Synchronize dynamic location coordinates with restaurant searches
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        let url = `/restaurants?page=${page}&limit=6`;
        if (!exploreNationwide) {
          url += `&city=${activeCity}`;
        } else {
          url += `&city=All`;
        }
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (tagQuery) url += `&tag=${encodeURIComponent(tagQuery)}`;
        if (cuisineQuery && cuisineQuery !== 'All') url += `&cuisine=${encodeURIComponent(cuisineQuery)}`;
        if (priceFilter && priceFilter !== 'All') url += `&priceRange=${encodeURIComponent(priceFilter)}`;
        if (!exploreNationwide && selectedLocality && selectedLocality !== 'All') {
          url += `&locality=${encodeURIComponent(selectedLocality)}`;
        }
        
        // Pass coordinates to trigger spatial proximity sorting on backend
        if (!exploreNationwide) {
          url += `&lat=${activeCoords.lat}&lng=${activeCoords.lng}&maxDistance=${maxDistance}`;
        }

        const res = await api.get(url).catch((err) => {
          console.warn('Backend API filter fallback to local mock data:', err.message);
          return null;
        });

        if (res && res.data && res.data.data && res.data.data.length > 0) {
          let list = res.data.data;
          
          if (!exploreNationwide) {
            // Client-side city re-validation — strict normalized matching
            const normalizedCity = activeCity.toLowerCase().trim();
            list = list.filter(r => 
              r.city && r.city.toLowerCase().trim() === normalizedCity
            );
            
            // Also apply locality filter client-side for safety
            if (selectedLocality && selectedLocality !== 'All') {
              const normalizedLocality = selectedLocality.toLowerCase().trim();
              list = list.filter(r => 
                r.locality && r.locality.toLowerCase().trim() === normalizedLocality
              );
            }
          }
          
          if (fastestDelivery) {
            list = list.filter(r => r.deliveryTime < 30);
          }
          
          if (list.length > 0) {
            setRestaurants(list);
            setTotalPages(res.data.totalPages || 1);
            setTotalCount(res.data.totalRestaurants || list.length);
            return; // validated results found — skip mock fallback
          }
          // Fall through to mock if validated list is empty
        } else {
          // Robust Geolocation-Aware offline fallback
          let filtered = [...MOCK_RESTAURANTS];
          
          if (!exploreNationwide) {
            // Compute distance of mock elements from user activeCoords
            filtered = filtered.map(r => {
              const coords = r.coordinates?.coordinates || [72.8258, 19.0596];
              const dist = calculateDistance(activeCoords.lat, activeCoords.lng, coords[1], coords[0]);
              return { ...r, distance: dist };
            });

            // Filter by active City — normalized matching
            const normalizedCity = activeCity.toLowerCase().trim();
            filtered = filtered.filter(r => 
              r.city && r.city.toLowerCase().trim() === normalizedCity
            );
            
            if (selectedLocality && selectedLocality !== 'All') {
              const normalizedLocality = selectedLocality.toLowerCase().trim();
              filtered = filtered.filter(r => 
                r.locality && r.locality.toLowerCase().trim() === normalizedLocality
              );
            }
            
            // Filter by distance
            filtered = filtered.filter(r => r.distance <= maxDistance);
          }
          
          // Filter by fastest delivery
          if (fastestDelivery) {
            filtered = filtered.filter(r => r.deliveryTime < 30);
          }

          const limit = 6;
          const startIndex = (page - 1) * limit;
          const paginated = filtered.slice(startIndex, startIndex + limit);

          setRestaurants(paginated);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
          setTotalCount(filtered.length);
        }
      } catch (err) {
        console.error('Discover pipeline fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [searchQuery, tagQuery, cuisineQuery, priceFilter, selectedLocality, activeCity, activeCoords, maxDistance, fastestDelivery, exploreNationwide, page]);

  // Handle Search submits
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    const newParams = {};
    if (searchInput.trim()) newParams.search = searchInput.trim();
    if (tagQuery) newParams.tag = tagQuery;
    if (cuisineQuery && cuisineQuery !== 'All') newParams.cuisine = cuisineQuery;
    if (priceFilter && priceFilter !== 'All') newParams.priceRange = priceFilter;
    setSearchParams(newParams);
  };

  // Change active price range segmented pills
  const handlePriceClick = (range) => {
    setPage(1);
    setPriceFilter(range);
    const newParams = {};
    if (searchQuery) newParams.search = searchQuery;
    if (tagQuery) newParams.tag = tagQuery;
    if (cuisineQuery && cuisineQuery !== 'All') newParams.cuisine = cuisineQuery;
    if (range !== 'All') newParams.priceRange = range;
    setSearchParams(newParams);
  };

  const handleCuisineClick = (cuisine) => {
    setPage(1);
    const newParams = {};
    if (searchQuery) newParams.search = searchQuery;
    if (tagQuery) newParams.tag = tagQuery;
    if (cuisine && cuisine !== 'All') newParams.cuisine = cuisine;
    if (priceFilter && priceFilter !== 'All') newParams.priceRange = priceFilter;
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setPriceFilter('All');
    setSelectedLocality('All');
    setMaxDistance(15);
    setFastestDelivery(false);
    setExploreNationwide(false);
    setPage(1);
    setSearchParams({});
  };

  // Get active address type icons
  const getAddressIcon = (type) => {
    if (type === 'Home') return <Home size={14} className="text-primary" />;
    if (type === 'Work') return <Briefcase size={14} className="text-primary" />;
    return <Building size={14} className="text-primary" />;
  };

  // Compute live computed distances dynamically for rendering
  const computedDistanceStr = (rest) => {
    if (exploreNationwide) return rest.city || 'Nearby';
    let dist = rest.distance;
    if (dist === undefined && rest.coordinates?.coordinates) {
      const restLng = rest.coordinates.coordinates[0];
      const restLat = rest.coordinates.coordinates[1];
      dist = calculateDistance(activeCoords.lat, activeCoords.lng, restLat, restLng);
    }
    return dist ? `${dist.toFixed(1)} km away` : 'Nearby';
  };

  const isRestaurantOutOfRange = (rest) => {
    let dist = rest.distance;
    if (dist === undefined && rest.coordinates?.coordinates) {
      const restLng = rest.coordinates.coordinates[0];
      const restLat = rest.coordinates.coordinates[1];
      dist = calculateDistance(activeCoords.lat, activeCoords.lng, restLat, restLng);
    }
    const isDifferentCity = rest.city && activeCity && rest.city.toLowerCase().trim() !== activeCity.toLowerCase().trim();
    return isDifferentCity || (dist && dist > 50);
  };

  const currentLocalities = CITY_LOCALITIES[activeCity] || [];

  return (
    <div className="container fade-in -mt-10 md:-mt-14 pt-2 px-6 relative" style={{ paddingBottom: '2.5rem' }}>
      
      {/* 1. HEADER AND INDIAN LOCATION PICKER CAPSULE */}
      <div className="text-left mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          {/* Glassmorphic Indian Location Indicator Picker */}
          <div 
            onClick={() => setLocationModalOpen(true)}
            className="glass-floating inline-flex items-center gap-2 border border-[var(--border-glow)] rounded-[16px] py-2 px-4 text-primary font-extrabold text-[12px] uppercase tracking-[0.08em] mb-4 cursor-pointer hover:bg-white/[0.04] transition-all select-none hover:-translate-y-[1px] active:scale-[0.98]"
            title="Switch your Indian delivery region"
          >
            <MapPin size={13} className="text-primary" />
            <span>Delivering to: <strong className="text-text-primary text-[11.5px] tracking-normal font-bold lowercase">{exploreNationwide ? 'nationwide (all cities)' : `${activeLocality}, ${activeCity}`}</strong></span>
            <ChevronDown size={12} className="text-text-muted transition-transform" />
          </div>

          <h1 className="text-[38px] md:text-[42px] mb-3 tracking-[0.01em] font-light leading-tight">
            Discover Kitchens & Restaurants
          </h1>
          <p className="text-text-secondary text-[16px] md:text-[17px] mb-7 max-w-[620px] font-light leading-relaxed">
            {exploreNationwide 
              ? "Explore authentic Indian and international menus from all regions and cities across India."
              : "Explore authentic Indian and international menus customized specifically for your active location coordinates."
            }
          </p>

          {/* Glass Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-[680px] w-full relative z-10">
            <div className="relative flex-1">
              <Search 
                size={18} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" 
              />
              <input 
                type="text" 
                className="glass-input !pl-12 rounded-[16px] h-[50px] font-medium" 
                placeholder="Search dishes, tags, or kitchens..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary rounded-[16px] h-[50px] font-bold px-6">
              Apply Search
            </button>
            
            <button 
              type="button" 
              onClick={() => setMobileFiltersOpen(true)} 
              className="btn btn-secondary rounded-[16px] h-[50px] md:hidden px-4 flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </form>
        </div>

        {/* Localized Recommended Badge Column */}
        <div className="hidden lg:flex flex-col gap-2 pr-2 text-right">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-extrabold">Personalized Taste</span>
          <span className="text-base font-bold text-primary flex items-center gap-1.5 justify-end">
            <IndiaMap size={18} /> Trending {exploreNationwide ? 'in India' : `in ${activeCity}`}
          </span>
        </div>
      </div>

      {/* 2. FILTERS SIDEBAR (DESKTOP) AND GRILL LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
        
        {/* Left Side Filters (Desktop Panel) */}
        <aside 
          className="hidden md:block glass-primary p-6 text-left sticky top-[80px] border-[1.5px] border-[var(--border-light)] shadow-[var(--shadow-ambient)] rounded-[20px] md:-mt-12 relative overflow-visible z-30"
        >
          <div className="noise-overlay" />

          <div className="flex justify-between items-center mb-6 border-b border-[var(--border-light)] pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-primary" />
              <h3 className="text-[17px] font-bold tracking-[0.01em]">Filters</h3>
            </div>
            <button 
              onClick={handleClearFilters}
              className="text-[11px] font-bold text-text-muted hover:text-primary bg-transparent border-none cursor-pointer transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Explore Nationwide Switcher */}
          <div 
            className="mb-5 relative z-10 flex justify-between items-center select-none cursor-pointer group" 
            onClick={() => setExploreNationwide(!exploreNationwide)}
          >
            <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Globe size={14} className={`text-text-muted transition-colors ${exploreNationwide ? 'text-primary' : ''}`} />
              Explore Nationwide
            </span>
            <div className="w-9 h-5 rounded-full bg-surface relative border border-border-light transition-all flex items-center px-0.5 group-hover:border-primary/40">
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${exploreNationwide ? 'bg-primary translate-x-4 shadow-[0_0_6px_rgba(255,90,60,0.4)]' : 'bg-text-muted translate-x-0'}`} 
              />
            </div>
          </div>

          {/* Pricing Range Filters (Indian Rupee Segmented Pills inside Custom Dropdown) */}
          <div className={`mb-5 relative ${openDropdown === 'price' ? 'z-40' : 'z-30'}`}>
            <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-[0.08em] flex items-center gap-1">
              <IndianRupee size={11} className="text-text-muted" /> Price Range
            </h4>
            
            <div className="relative custom-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'price' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <IndianRupee size={12} className="text-primary shrink-0 animate-stir" />
                  {(() => {
                    const activeTier = PRICE_TIERS.find(t => t.value === priceFilter) || PRICE_TIERS[0];
                    return activeTier.value === 'All' ? 'All Budgets' : `${activeTier.value} • ${activeTier.desc}`;
                  })()}
                </span>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'price' ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              {openDropdown === 'price' && (
                <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 animate-slide-in">
                  {PRICE_TIERS.map((tier) => {
                    const isSelected = priceFilter === tier.value;
                    return (
                      <button
                        type="button"
                        key={tier.value}
                        onClick={() => {
                          handlePriceClick(tier.value);
                          setOpenDropdown(null);
                        }}
                        className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer ${isSelected ? 'selected text-primary' : 'text-text-secondary'}`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12.5px] font-bold flex items-center gap-1.5">
                            {tier.value !== 'All' && <span className="bg-primary/10 text-primary text-[10px] py-0.5 px-1.5 rounded font-mono">{tier.value}</span>}
                            {tier.label}
                          </span>
                          <span className="text-[10px] text-text-muted mt-0.5 font-medium">{tier.desc}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* City Locality Filters */}
          {currentLocalities.length > 0 && (
            <div className={`mb-5 relative ${openDropdown === 'locality' ? 'z-40' : 'z-20'} ${exploreNationwide ? 'opacity-40 pointer-events-none' : ''}`}>
              <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-[0.08em] flex items-center gap-1">
                <MapPin size={11} className="text-text-muted" /> Local Service Area
              </h4>
              
              <div className="relative custom-dropdown-container">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'locality' ? null : 'locality')}
                  className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'locality' ? 'active' : ''}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-primary shrink-0" />
                    {selectedLocality === 'All' ? 'All Localities' : selectedLocality}
                  </span>
                  <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'locality' ? 'rotate-180 text-primary' : ''}`} />
                </button>
                
                {openDropdown === 'locality' && (
                  <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 max-h-56 overflow-y-auto animate-slide-in">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocality('All');
                        setOpenDropdown(null);
                      }}
                      className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${selectedLocality === 'All' ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                    >
                      <span>All Localities</span>
                      {selectedLocality === 'All' && <Check size={14} className="text-primary" />}
                    </button>
                    {currentLocalities.map((loc) => {
                      const isSelected = selectedLocality === loc;
                      return (
                        <button
                          type="button"
                          key={loc}
                          onClick={() => {
                            setSelectedLocality(loc);
                            setOpenDropdown(null);
                          }}
                          className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${isSelected ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                        >
                          <span>{loc}</span>
                          {isSelected && <Check size={14} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distance Range Filter */}
          <div className={`mb-5 relative z-10 ${exploreNationwide ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-2.5">
              <h4 className="text-[11px] font-extrabold text-text-muted uppercase tracking-[0.08em] flex items-center gap-1">
                <Compass size={11} className="text-text-muted" /> Search Radius
              </h4>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{maxDistance} km</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="30" 
              step="1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full accent-primary bg-surface h-1.5 rounded-full cursor-pointer appearance-none border border-border-light transition-all hover:opacity-90"
            />
          </div>

          {/* Cuisines Filters */}
          <div className={`mb-6 relative ${openDropdown === 'cuisine' ? 'z-40' : 'z-20'}`}>
            <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-[0.08em] flex items-center gap-1">
              <Tag size={11} className="text-text-muted" /> Cuisines / Categories
            </h4>
            
            <div className="relative custom-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'cuisine' ? null : 'cuisine')}
                className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'cuisine' ? 'active' : ''}`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Tag size={12} className="text-primary shrink-0" />
                  {cuisineQuery === 'All' ? 'All Cuisines' : cuisineQuery}
                </span>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'cuisine' ? 'rotate-180 text-primary' : ''}`} />
              </button>
              
              {openDropdown === 'cuisine' && (
                <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 max-h-56 overflow-y-auto animate-slide-in">
                  {CUISINES.map((c) => {
                    const isSelected = cuisineQuery === c;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => {
                          handleCuisineClick(c);
                          setOpenDropdown(null);
                        }}
                        className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${isSelected ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                      >
                        <span>{c === 'All' ? 'All Cuisines' : c}</span>
                        {isSelected && <Check size={14} className="text-primary font-bold shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Fast Delivery Switcher */}
          <div 
            className="relative z-[1] border-t border-[var(--border-light)] pt-4 flex justify-between items-center select-none cursor-pointer group" 
            onClick={() => setFastestDelivery(!fastestDelivery)}
          >
            <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">Fast Delivery (&lt;30 mins)</span>
            <div className="w-9 h-5 rounded-full bg-surface relative border border-border-light transition-all flex items-center px-0.5 group-hover:border-primary/40">
              <div 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${fastestDelivery ? 'bg-primary translate-x-4 shadow-[0_0_6px_rgba(255,90,60,0.4)]' : 'bg-text-muted translate-x-0'}`} 
              />
            </div>
          </div>
        </aside>

        {/* Right Side Curated Restaurants List Grid */}
        <div className="flex-1">
          <div className="mb-4 pl-1 text-left flex justify-between items-center">
            <span className="text-xs font-bold text-text-muted">
              Found {totalCount} dining options {exploreNationwide ? 'across India' : `in ${activeCity}`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="glass-primary skeleton-box h-[310px] opacity-40" />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
                {restaurants.map((rest, index) => (
                  <motion.div 
                    key={rest._id} 
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    whileHover="hover"
                    className="glass-card p-0 overflow-hidden cursor-pointer text-left border-[1.5px] border-[var(--border-light)] hover:border-primary/20 transition-all duration-300 relative group flex flex-col justify-between" 
                    onClick={() => navigate(`/restaurant/${rest._id}`)}
                  >
                    <div className="noise-overlay" />

                    <div>
                      {/* Image Zoom Wrapper */}
                      <div className="w-full aspect-[16/10] relative overflow-hidden rounded-t-[inherit]">
                        <SafeImage 
                          src={resolveMediaUrl(rest.coverImage)} 
                          alt={rest.name} 
                          variants={{ hover: { scale: 1.05 } }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Custom Price Rating absolute badge */}
                        <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md rounded-[12px] py-[4px] px-[10px] flex items-center gap-1 border border-white/10 shadow-lg z-[5]">
                          <Star size={11} fill="#ffc83b" stroke="#ffc83b" />
                          <span className="text-[12px] font-bold text-white">{rest.rating.toFixed(1)}</span>
                        </div>

                        {/* Local Price Range Tag */}
                        <span className="absolute bottom-3 left-3 bg-black/60 text-white rounded-lg text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-[0.05em] backdrop-blur-sm z-[5]">
                          {rest.priceRange || '₹₹'} • {rest.locality || 'Bandra'}
                        </span>
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="text-[17px] font-bold text-text-primary leading-tight line-clamp-1">{rest.name}</h3>
                        </div>
                        <p className="text-[13px] text-text-secondary mb-3.5 h-[38px] overflow-hidden leading-relaxed">
                          {rest.description}
                        </p>

                        {/* Custom Cuisines */}
                        <div className="flex flex-wrap gap-[4px] mb-3.5 select-none">
                          {rest.cuisines.slice(0, 3).map((c) => (
                            <span key={c} className="text-[9.5px] font-bold text-primary bg-primary/5 border border-primary/10 py-0.5 px-2 rounded-md">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Delivery metadata footer */}
                    <div className="p-5 pt-0">
                      <div className="flex justify-between items-center border-t border-[var(--border-light)] pt-3 text-[12px] text-text-muted font-bold">
                        {isRestaurantOutOfRange(rest) ? (
                          <span className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-0.5 px-2 rounded-md text-[10px] uppercase tracking-wide font-extrabold animate-pulse">
                            <AlertTriangle size={10} className="text-red-500" /> Out of Local Range
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-text-muted" />
                            {rest.deliveryTime} mins
                          </span>
                        )}
                        
                        <span className="text-primary font-bold">
                          {computedDistanceStr(rest)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination indicators */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 mb-8 select-none">
                  <button 
                    onClick={() => {
                      setPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className={`btn btn-secondary btn-pill border border-[var(--border-light)] ${page === 1 ? 'btn-disabled' : ''}`}
                  >
                    Previous
                  </button>
                  <span className="text-[13.5px] font-bold text-text-secondary">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    onClick={() => {
                      setPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className={`btn btn-secondary btn-pill border border-[var(--border-light)] ${page === totalPages ? 'btn-disabled' : ''}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-primary flex-center h-[260px] text-text-secondary flex-col gap-4">
              <div className="noise-overlay" />
              <p className="font-semibold text-[14.5px]">No kitchens found matching your Indian location and filter coordinates.</p>
              <button onClick={handleClearFilters} className="btn btn-secondary btn-pill border border-[var(--border-light)] font-bold text-xs">
                Reset All Filters
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 3. PREMIUM SLIDING BOTTOM ADDRESS SELECTOR DRAWER (DESKTOP/MOBILE MODAL) */}
      {createPortal(
        <AnimatePresence>
          {locationModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-[9999990] p-6 select-none">
            {/* Backdrop blur fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocationModalOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Selector Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="location-modal-panel rounded-[24px] p-7 max-w-[540px] w-full relative z-10 text-left overflow-y-auto max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-5 border-b border-border-light/45 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Select Delivery Location
                </h3>
                <button onClick={() => setLocationModalOpen(false)} className="btn-icon btn-circle w-7 h-7">
                  <X size={13} />
                </button>
              </div>

              {/* Geolocation auto detect button */}
              <button
                type="button"
                onClick={() => {
                  detectGpsLocation();
                  setLocationModalOpen(false);
                }}
                className={`w-full h-11 bg-primary text-white border-none rounded-xl font-bold flex items-center justify-center gap-2 mb-6 cursor-pointer hover:bg-primary-hover active:scale-[0.98] transition-all ${
                  gpsLoading ? 'opacity-75 pointer-events-none' : ''
                }`}
              >
                <Navigation size={14} className={gpsLoading ? 'animate-stir' : ''} />
                {gpsLoading ? 'Locating Coordinate Handshake...' : 'Detect Current GPS Location'}
              </button>

              {/* Saved delivery addresses list */}
              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[11px] font-extrabold text-text-muted mb-3 uppercase tracking-wider">
                    Saved Delivery Addresses
                  </h4>
                  <div className="flex flex-col gap-3.5">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr._id}
                        onClick={() => {
                          selectManualCity(addr.city, addr.area || addr.street);
                          setLocationModalOpen(false);
                        }}
                        className={`p-4 rounded-[16px] border text-left cursor-pointer transition-all flex items-start gap-3 hover:-translate-y-[1px] ${
                          activeLocality === (addr.area || addr.street)
                            ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/5'
                            : 'bg-white/[0.01] border-border-light hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                          {getAddressIcon(addr.addressType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <strong className="text-[13.5px] text-text-primary capitalize">{addr.addressType}</strong>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1.5 truncate leading-relaxed">
                            {addr.houseNumber}, {addr.street}, {addr.area}
                          </p>
                          <p className="text-[11px] text-text-muted mt-1 leading-normal font-semibold">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indian City manual switcher */}
              <div>
                <h4 className="text-[11px] font-extrabold text-text-muted mb-3.5 uppercase tracking-wider">
                  Browse Major Indian Cities
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((city) => {
                    const isSelected = activeCity === city;
                    return (
                      <button
                        type="button"
                        key={city}
                        onClick={() => {
                          selectManualCity(city);
                          setLocationModalOpen(false);
                        }}
                        className={`h-9 rounded-[10px] text-xs font-bold border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-white/[0.02] border-border-light text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 4. MOBILE FILTERS BOTTOM SHEET DRAWER */}
      {createPortal(
        <AnimatePresence>
          {mobileFiltersOpen && (
            <div className="fixed inset-0 flex items-end justify-center z-[9999990] md:hidden">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              className="mobile-filter-sheet rounded-t-[28px] w-full max-h-[85vh] overflow-y-auto p-7 text-left relative z-10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-border-light/45 pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Filter size={16} className="text-primary" />
                    Configure Filters
                  </h3>
                  <button onClick={() => setMobileFiltersOpen(false)} className="btn-icon btn-circle w-7 h-7">
                    <X size={13} />
                  </button>
                </div>

                {/* Explore Nationwide Switcher */}
                <div 
                  className="mb-6 relative z-10 flex justify-between items-center select-none cursor-pointer group border-b border-border-light/45 pb-4" 
                  onClick={() => setExploreNationwide(!exploreNationwide)}
                >
                  <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors flex items-center gap-1.5">
                    <Globe size={14} className={`text-text-muted transition-colors ${exploreNationwide ? 'text-primary' : ''}`} />
                    Explore Nationwide
                  </span>
                  <div className="w-9 h-5 rounded-full bg-surface relative border border-border-light transition-all flex items-center px-0.5 group-hover:border-primary/40">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${exploreNationwide ? 'bg-primary translate-x-4 shadow-[0_0_6px_rgba(255,90,60,0.4)]' : 'bg-text-muted translate-x-0'}`} 
                    />
                  </div>
                </div>

                {/* Price range */}
                <div className={`mb-6 relative ${openDropdown === 'm-price' ? 'z-40' : 'z-30'}`}>
                  <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee size={11} className="text-text-muted" /> Price Range
                  </h4>
                  
                  <div className="relative custom-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'm-price' ? null : 'm-price')}
                      className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'm-price' ? 'active' : ''}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <IndianRupee size={12} className="text-primary shrink-0" />
                        {(() => {
                          const activeTier = PRICE_TIERS.find(t => t.value === priceFilter) || PRICE_TIERS[0];
                          return activeTier.value === 'All' ? 'All Budgets' : `${activeTier.value} • ${activeTier.desc}`;
                        })()}
                      </span>
                      <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'm-price' ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    
                    {openDropdown === 'm-price' && (
                      <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 animate-slide-in">
                        {PRICE_TIERS.map((tier) => {
                          const isSelected = priceFilter === tier.value;
                          return (
                            <button
                              type="button"
                              key={tier.value}
                              onClick={() => {
                                handlePriceClick(tier.value);
                                setOpenDropdown(null);
                              }}
                              className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer ${isSelected ? 'selected text-primary font-bold' : 'text-text-secondary'}`}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[12.5px] font-bold flex items-center gap-1.5">
                                  {tier.value !== 'All' && <span className="bg-primary/10 text-primary text-[10px] py-0.5 px-1.5 rounded font-mono">{tier.value}</span>}
                                  {tier.label}
                                </span>
                                <span className="text-[10px] text-text-muted mt-0.5 font-medium">{tier.desc}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distance Slider */}
                <div className={`mb-6 relative z-10 ${exploreNationwide ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <Compass size={11} className="text-text-muted" /> Distance (Max)
                    </h4>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{maxDistance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="30" 
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full accent-primary bg-surface h-1.5 rounded-full cursor-pointer appearance-none border border-border-light"
                  />
                </div>

                {/* Localities select */}
                {currentLocalities.length > 0 && (
                  <div className={`mb-6 relative ${openDropdown === 'm-locality' ? 'z-40' : 'z-20'} ${exploreNationwide ? 'opacity-40 pointer-events-none' : ''}`}>
                    <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={11} className="text-text-muted" /> Select Locality
                    </h4>
                    
                    <div className="relative custom-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === 'm-locality' ? null : 'm-locality')}
                        className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'm-locality' ? 'active' : ''}`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin size={12} className="text-primary shrink-0" />
                          {selectedLocality === 'All' ? 'All Localities' : selectedLocality}
                        </span>
                        <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'm-locality' ? 'rotate-180 text-primary' : ''}`} />
                      </button>
                      
                      {openDropdown === 'm-locality' && (
                        <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 max-h-48 overflow-y-auto animate-slide-in">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLocality('All');
                              setOpenDropdown(null);
                            }}
                            className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${selectedLocality === 'All' ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                          >
                            <span>All Localities</span>
                            {selectedLocality === 'All' && <Check size={14} className="text-primary" />}
                          </button>
                          {currentLocalities.map((loc) => {
                            const isSelected = selectedLocality === loc;
                            return (
                              <button
                                type="button"
                                key={loc}
                                onClick={() => {
                                  setSelectedLocality(loc);
                                  setOpenDropdown(null);
                                }}
                                className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${isSelected ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                              >
                                <span>{loc}</span>
                                {isSelected && <Check size={14} className="text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cuisines select */}
                <div className={`mb-6 relative ${openDropdown === 'm-cuisine' ? 'z-40' : 'z-10'}`}>
                  <h4 className="text-[11px] font-extrabold text-text-muted mb-2.5 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={11} className="text-text-muted" /> Cuisines / Categories
                  </h4>
                  
                  <div className="relative custom-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === 'm-cuisine' ? null : 'm-cuisine')}
                      className={`dropdown-trigger w-full flex items-center justify-between h-11 px-4 rounded-xl text-xs font-bold select-none cursor-pointer ${openDropdown === 'm-cuisine' ? 'active' : ''}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Tag size={12} className="text-primary shrink-0" />
                        {cuisineQuery === 'All' ? 'All Cuisines' : cuisineQuery}
                      </span>
                      <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${openDropdown === 'm-cuisine' ? 'rotate-180 text-primary' : ''}`} />
                    </button>
                    
                    {openDropdown === 'm-cuisine' && (
                      <div className="dropdown-menu absolute top-[108%] left-0 w-full rounded-xl z-50 overflow-hidden py-1.5 max-h-48 overflow-y-auto animate-slide-in">
                        {CUISINES.map((c) => {
                          const isSelected = cuisineQuery === c;
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                handleCuisineClick(c);
                                setOpenDropdown(null);
                              }}
                              className={`dropdown-option w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer ${isSelected ? 'selected text-primary font-bold' : 'text-text-secondary font-semibold'}`}
                            >
                              <span>{c === 'All' ? 'All Cuisines' : c}</span>
                              {isSelected && <Check size={14} className="text-primary font-bold shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fast Delivery Switcher */}
                <div 
                  className="border-t border-border-light/45 pt-4 flex justify-between items-center select-none cursor-pointer group" 
                  onClick={() => setFastestDelivery(!fastestDelivery)}
                >
                  <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">Fast Delivery (&lt;30 mins)</span>
                  <div className="w-9 h-5 rounded-full bg-surface relative border border-border-light transition-all flex items-center px-0.5 group-hover:border-primary/40">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${fastestDelivery ? 'bg-primary translate-x-4 shadow-[0_0_6px_rgba(255,90,60,0.4)]' : 'bg-text-muted translate-x-0'}`} 
                    />
                  </div>
                </div>
                
                {/* Visual padding helper to guarantee scroll options rendering when dropdowns are open */}
                {/* Visual padding helper to guarantee scroll options rendering when dropdowns are open */}
                <div className="h-44" />
              </div>

              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-11 bg-primary text-white rounded-xl border-none font-bold text-[13.5px] cursor-pointer mt-6 flex items-center justify-center"
              >
                Apply Filters
              </button>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
