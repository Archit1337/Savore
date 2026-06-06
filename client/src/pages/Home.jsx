import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, Sparkles, Navigation, Clock, Star, Play, Compass, MapPin, ChevronDown, X, Home as HomeIcon, Briefcase, Building, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import MascotChef from '../components/MascotChef';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';
import { soundController } from '../components/ChefSystem/SoundController';
import { LocationContext, CITIES, CITY_LOCALITIES, CITY_COORDINATES } from '../context/LocationContext';



const CATEGORIES = [
  { name: 'All Cuisines', tag: '' },
  { name: 'Premium Dining', tag: 'Premium Dining' },
  { name: 'Spicy Fusion', tag: 'Spicy' },
  { name: 'Fresh Sushi', tag: 'Fresh' },
  { name: 'Comfort Food', tag: 'Comfort Food' },
  { name: 'Desserts', tag: 'Desserts' },
];

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80",
    title: "Artisanal Pizza",
    tagline: "Experience Food Like Never Before"
  },
  {
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1600&q=80",
    title: "Edo-style Sushi",
    tagline: "Discover. Order. Enjoy."
  },
  {
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80",
    title: "Dry-Aged Steak Burger",
    tagline: "Experience Food Like Never Before"
  },
  {
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80",
    title: "Valrhona Soufflé",
    tagline: "Discover. Order. Enjoy."
  }
];

const MOCK_RESTAURANTS = [
  {
    _id: 'mock-rest-1',
    name: "L'Ambroisie",
    description: "Experience Parisienne popular dining with modern culinary elegance, featuring signature Italian-French fusion recipes.",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9, deliveryTime: 45, deliveryFee: 12.00,
    tags: ["Chef Recommended", "Michelin Star", "Premium Dining"], cuisines: ["French", "Italian", "European"]
  },
  {
    _id: 'mock-rest-2',
    name: "Saffron Bistro",
    description: "Modern Indian cuisine cooked over authentic clay ovens, fused with aromatic European herbs and spices.",
    coverImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    rating: 4.8, deliveryTime: 30, deliveryFee: 0.00,
    tags: ["Hot Right Now", "Comfort Food", "Spicy"], cuisines: ["Indian", "Fusion", "Vegetarian"]
  },
  {
    _id: 'mock-rest-3',
    name: "Sakura Sushi",
    description: "Authentic Edo-style handrolled sushi, fresh sashimi platters, and organic matcha-infused tea selections.",
    coverImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    rating: 4.7, deliveryTime: 25, deliveryFee: 5.00,
    tags: ["Most Loved", "Fresh", "Healthy"], cuisines: ["Japanese", "Sushi", "Asian"]
  }
];

const MOCK_REELS = [
  {
    _id: 'mock-reel-1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cooking-in-a-modern-kitchen-40506-large.mp4',
    caption: 'Perfecting the signature French Duck Breast with citrus orange glaze. 🍊 Crispy skin and tender duck breast.',
    restaurantDetails: { name: "L'Ambroisie" }
  },
  {
    _id: 'mock-reel-2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-putting-fresh-herbs-on-a-pizza-40292-large.mp4',
    caption: 'Freshly torn basil leaves meeting a scorching stone-baked woodfired Margherita. Pure simplicity. 🍕🌿',
    restaurantDetails: { name: 'Truffle Burger House' }
  },
  {
    _id: 'mock-reel-3',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-preparing-sushi-with-avocado-and-salmon-42022-large.mp4',
    caption: 'Rolling the Signature Dragon Roll with sushi-grade Atlantic salmon, ripe avocado, and sweet unagi glaze. 🍣✨',
    restaurantDetails: { name: 'Sakura Sushi' }
  }
];

function TrendingReelCard({ reel, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const videoUrl = reel?.videoUrl;
  const caption = reel?.caption || 'Culinary Masterpiece';
  const restaurantName = reel?.restaurantDetails?.name || 'Chef Specialty';
  const coverImage = reel?.restaurantDetails?.coverImage;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    if (isHovered) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Hover preview play interrupted:', err.message);
        });
      }
    } else {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) {
        console.warn('Error resetting hover preview video:', e.message);
      }
    }
  }, [isHovered, videoError]);

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="glass-primary rounded-[28px] p-0 overflow-hidden relative h-[390px] cursor-pointer shadow-[var(--shadow-ambient)] bg-[#040406]"
    >
      <div className="noise-overlay" />
      
      {coverImage ? (
        <img 
          src={resolveMediaUrl(coverImage)} 
          alt={restaurantName}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out z-[1] ${
            videoLoaded && isHovered ? 'opacity-35' : 'opacity-85'
          }`}
        />
      ) : (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#181824] to-[#0d0d13] opacity-85 z-[1]"
        />
      )}

      {!videoLoaded && !videoError && (
        <div 
          className="skeleton-box absolute inset-0 opacity-25 z-[1] pointer-events-none" 
        />
      )}

      {videoUrl && !videoError && (
        <video 
          ref={videoRef}
          src={resolveMediaUrl(videoUrl)} 
          muted 
          loop 
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover scale-[1.01] transition-opacity duration-400 ease-in-out z-[2] pointer-events-none ${
            isHovered && videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {videoError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[10px] z-[2]"
        >
          <span className="text-xs text-text-muted font-medium">
            Preview stream unavailable
          </span>
        </div>
      )}

      <div 
        className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d]/95 via-[#0a0a0d]/45 to-transparent pointer-events-none z-[3]"
      />

      <div 
        className="absolute bottom-6 left-6 right-6 z-[4] pointer-events-none"
      >
        <span 
          className="bg-primary text-white text-[11px] font-extrabold py-[5px] px-3 rounded-[10px] uppercase mb-2.5 inline-block tracking-[0.05em]"
        >
          {restaurantName}
        </span>
        <p className="text-white font-bold text-[15.5px] leading-[1.4] line-clamp-2 overflow-hidden text-ellipsis">
          {caption}
        </p>
      </div>
    </motion.div>
  );
}// Coral Weather Animated SVGs
const SunnyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" className="weather-svg-sun" />
      <path d="M12 2v2" className="weather-svg-sun" />
      <path d="M12 20v2" className="weather-svg-sun" />
      <path d="m4.93 4.93 1.41 1.41" className="weather-svg-sun" />
      <path d="m17.66 17.66 1.41 1.41" className="weather-svg-sun" />
      <path d="M2 12h2" className="weather-svg-sun" />
      <path d="M20 12h2" className="weather-svg-sun" />
      <path d="m6.34 17.66-1.41 1.41" className="weather-svg-sun" />
      <path d="m19.07 4.93-1.41 1.41" className="weather-svg-sun" />
    </svg>
  </span>
);

const RainyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" className="weather-svg-cloud" />
      <path d="M16 14v2" className="weather-svg-rain-drop" />
      <path d="M8 14v2" className="weather-svg-rain-drop" />
      <path d="M12 16v2" className="weather-svg-rain-drop" />
    </svg>
  </span>
);

const CloudyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12A5 5 0 0 1 20 8.5h.5a3.5 3.5 0 0 1 2 6.425" opacity="0.6" className="weather-svg-cloud-back" />
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" className="weather-svg-cloud" />
    </svg>
  </span>
);

const ChillyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h16a2 2 0 0 0 0-4" className="weather-svg-wind" />
      <path d="M6 12h12a2 2 0 0 1 0 4" className="weather-svg-wind" />
      <path d="M2 16h8a2 2 0 0 0 0-4" className="weather-svg-wind" />
      <circle cx="18" cy="18" r="1" fill="#FF6A4D" stroke="none" />
      <circle cx="14" cy="6" r="1" fill="#FF6A4D" stroke="none" />
    </svg>
  </span>
);

const StarryIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M19 4v3M17.5 5.5h3" opacity="0.8" strokeWidth="2" />
    </svg>
  </span>
);

const StormyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" className="weather-svg-cloud" />
      <path d="m13 12-3 5h4l-3 5" style={{ stroke: '#FF6A4D', strokeWidth: 2 }} />
    </svg>
  </span>
);

const SnowyIcon = () => (
  <span className="weather-icon-spin flex items-center justify-center">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6A4D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" className="weather-svg-cloud" />
      <path d="M8 16h.01M12 16h.01M16 16h.01M10 20h.01M14 20h.01" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </span>
);

const renderWeatherIcon = (climateType) => {
  switch (climateType) {
    case 'sunny':
      return <SunnyIcon />;
    case 'starry':
      return <StarryIcon />;
    case 'rainy':
      return <RainyIcon />;
    case 'cloudy':
      return <CloudyIcon />;
    case 'stormy':
      return <StormyIcon />;
    case 'snowy':
      return <SnowyIcon />;
    case 'chilly':
    default:
      return <ChillyIcon />;
  }
};

const WEATHER_POOLS = {
  sunny: {
    temp: "74°F",
    lines: [
      "Sun-kissed afternoon: perfect for refreshing Edo-style sashimi.",
      "Bright skies & warm breezes. Indulge in light, vibrant fresh bites.",
      "A glorious day demands the crisp perfection of a cold champagne.",
      "Golden sunlight. Let's paint your palate with fresh, vibrant flavors."
    ],
    chefLines: [
      "Ah, what a beautiful sun-kissed afternoon! Mon ami, the weather calls for the crisp, clean flavor of our fresh Edo-style Salmon Sashimi! 🍣",
      "Bright skies demand bright flavors! Might I suggest our signature chilled Truffle Caprese or a glass of crisp champagne? 🥂",
      "The sun is shining beautifully today! Let's celebrate with light, vibrant dishes crafted just for you! ☀️🥗"
    ]
  },
  starry: {
    temp: "62°F",
    lines: [
      "Clear starry night. Perfect for a cozy glass of Cabernet and truffles.",
      "A calm, clear evening. Let us craft a midnight feast for you.",
      "Under the starlit sky. Savor slow-cooked delicacies and fine wine.",
      "Cool night air. Cozy up with our chef's signature warm creations."
    ],
    chefLines: [
      "Ah, what a beautiful, clear starlit night! Mon ami, cozy up with the rich warmth of our slow-cooked Wagyu Beef Bourguignon! 🥩✨",
      "Under the starry night sky, let us elevate your evening with a glass of robust Cabernet Sauvignon and fresh truffles! 🍷🌌",
      "A cool, calm evening is upon us. Celebrate the night with our molten-core chocolate creations! 🍫💫"
    ]
  },
  rainy: {
    temp: "58°F",
    lines: [
      "Soft rain outside. The perfect companion for a steaming lobster bisque.",
      "Listen to the rain, feel the warmth: slow-cooked comfort awaits.",
      "A rainy day is just an excuse for a rich, warm Valrhona soufflé.",
      "Drizzling skies. Warm the soul with slow-simmered culinary poetry."
    ],
    chefLines: [
      "Soft rain drumming outside... it is the ultimate excuse to wrap yourself in deep comfort with a steaming bowl of Lobster Bisque! 🍲",
      "Rainy skies call for warmth from the inside out. Savor our slow-cooked Wagyu Beef Bourguignon, mon ami! 🥩🌧️",
      "Ah, listen to the rain fall... warm your soul with a rich, hot Valrhona Chocolate Soufflé fresh from the oven! 🍫🧁"
    ]
  },
  cloudy: {
    temp: "65°F",
    lines: [
      "Silver skies. The perfect backdrop for an exquisite glass of red wine.",
      "Misty clouds roll in. Savor a comforting, slow-roasted masterpiece.",
      "Cozy overcast daydreaming. Let our chef craft your warm culinary escape."
    ],
    chefLines: [
      "Cozy silver skies today... wrap yourself in pure luxury with a glass of rich red wine and our dry-aged culinary specials! 🍷",
      "The overcast mist calls for slow-roasted masterpieces. Our Roasted Truffle Chicken is waiting to delight you! 🍗✨",
      "Cloudy daydreams call for comforting food creations. Let me cook up a comforting feast for you! 👨‍🍳🍳"
    ]
  },
  chilly: {
    temp: "48°F",
    lines: [
      "A crisp chill in the air. Warm up with our steaming fusion ramen.",
      "Cold winds outside. Retreat into the warm luxury of rich, hot truffles.",
      "Winter's embrace calls for slow-roasted, hearty culinary treasures.",
      "Chilly evening. Cozy up to a hot plate of sizzling culinary magic."
    ],
    chefLines: [
      "Ooh, there is a crisp chill in the air today! Warm up instantly with a steaming bowl of our 24-hour slow-cooked Spicy Fusion Ramen! 🍜🔥",
      "Cold winds are blowing, mon ami! Seek shelter in the warm luxury of our hot Truffle Gnocchi or sizzling dry-aged steaks! 🥩🍄",
      "Chilly evenings call for cozy culinary magic. Warm your senses with our molten core chocolate creations and robust stews! 🍲🍫"
    ]
  },
  stormy: {
    temp: "52°F",
    lines: [
      "Thunderstorms rolling in. Savor a rich, fiery stew by the fireplace.",
      "Flash of lightning, roll of thunder: perfect excuse for comfort food.",
      "Stormy skies outside. Warm up with our chef's spicy, bold delicacies."
    ],
    chefLines: [
      "Mon dieu, quite a storm raging outside! ⚡ Let me warm you up with our fiery Spicy Szechuan Fusion Noodles! 🍜🔥",
      "Thunder & lightning call for bold flavors! Cozy up with our sizzling hotpots and robust, spiced red wine! 🍷⛈️"
    ]
  },
  snowy: {
    temp: "32°F",
    lines: [
      "Snowflakes falling softly. Indulge in our warm, rich oven masterpieces.",
      "A white winter wonderland. Warm your soul with hot truffle dishes.",
      "Crisp, snowy day. The perfect backdrop for steaming hot culinary magic."
    ],
    chefLines: [
      "Ah, a beautiful blanket of snow outside! ❄️ Cozy up with a piping hot bowl of our Signature Wild Mushroom Truffle Risotto! 🍄🍚",
      "It is a winter wonderland! Let us bring you warmth with a hot, freshly baked chocolate soufflé! 🍫❄️"
    ]
  }
};

export default function Home() {
  const {
    activeCity,
    activeLocality,
    activeCoords,
    savedAddresses,
    selectManualCity,
    detectGpsLocation,
    calculateDistance,
    gpsLoading
  } = useContext(LocationContext);

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

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reelsPreview, setReelsPreview] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleNextBatch = () => {
    if ((activeBatchIndex + 1) * 3 < restaurants.length) {
      setActiveBatchIndex(prev => prev + 1);
    }
  };

  const handlePrevBatch = () => {
    if (activeBatchIndex > 0) {
      setActiveBatchIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    setActiveBatchIndex(0);
  }, [restaurants]);
  
  // Live Weather Concierge State
  const [weatherData, setWeatherData] = useState(() => {
    const hour = new Date().getHours();
    let initialClimate = 'sunny';
    let temp = '74°F';
    let line = "Sun-kissed afternoon: perfect for refreshing Edo-style sashimi.";
    if (hour >= 5 && hour < 11) {
      initialClimate = 'cloudy';
      temp = '65°F';
      line = "Silver skies. The perfect backdrop for an exquisite glass of red wine.";
    } else if (hour >= 11 && hour < 17) {
      initialClimate = 'sunny';
      temp = '74°F';
      line = "Sun-kissed afternoon: perfect for refreshing Edo-style sashimi.";
    } else if (hour >= 17 && hour < 21) {
      initialClimate = 'chilly';
      temp = '48°F';
      line = "A crisp chill in the air. Warm up with our steaming fusion ramen.";
    } else {
      initialClimate = 'starry';
      temp = '62°F';
      line = "Clear starry night. Perfect for a cozy glass of Cabernet and truffles.";
    }
    return {
      climate: initialClimate,
      temp,
      line,
      loading: true
    };
  });

  const { setBubbleText, setCurrentMood, setCommentType } = useChefMood();

  // Weather detection effect
  useEffect(() => {
    let active = true;

    const detectWeather = async () => {
      // 1. Initial fallback based on system time
      const hour = new Date().getHours();
      let initialClimate = 'sunny';
      if (hour >= 5 && hour < 11) {
        initialClimate = 'cloudy';
      } else if (hour >= 11 && hour < 17) {
        initialClimate = 'sunny';
      } else if (hour >= 17 && hour < 21) {
        initialClimate = 'chilly';
      } else {
        initialClimate = 'starry';
      }

      const defaultPool = WEATHER_POOLS[initialClimate];
      const randomLine = defaultPool.lines[Math.floor(Math.random() * defaultPool.lines.length)];

      if (active) {
        setWeatherData({
          climate: initialClimate,
          temp: defaultPool.temp,
          line: randomLine,
          loading: true
        });
      }

      // 2. Fetch real-time weather using selected place coordinates (activeCoords)
      if (activeCoords?.lat && activeCoords?.lng) {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${activeCoords.lat}&longitude=${activeCoords.lng}&current_weather=true`
          );
          const data = await response.json();
          if (data?.current_weather) {
            const tempC = data.current_weather.temperature;
            const tempF = Math.round((tempC * 9) / 5 + 32) + '°F';
            const weathercode = data.current_weather.weathercode;
            const isNight = data.current_weather.is_day !== undefined
              ? data.current_weather.is_day === 0
              : (new Date().getHours() >= 21 || new Date().getHours() < 5);

            // Map weather code
            let parsedClimate = 'sunny';
            if (weathercode === 0 || weathercode === 1) {
              parsedClimate = isNight ? 'starry' : 'sunny';
            } else if (weathercode === 2 || weathercode === 3 || weathercode === 45 || weathercode === 48) {
              parsedClimate = 'cloudy';
            } else if (weathercode >= 95) {
              parsedClimate = 'stormy';
            } else if ((weathercode >= 71 && weathercode <= 77) || weathercode === 85 || weathercode === 86) {
              parsedClimate = 'snowy';
            } else if ((weathercode >= 51 && weathercode <= 67) || (weathercode >= 80 && weathercode <= 82)) {
              parsedClimate = 'rainy';
            } else {
              parsedClimate = 'chilly'; // other/cold
            }

            const pool = WEATHER_POOLS[parsedClimate] || WEATHER_POOLS.sunny;
            const poolLines = pool.lines;
            const newRandomLine = poolLines[Math.floor(Math.random() * poolLines.length)];

            if (active) {
              setWeatherData({
                climate: parsedClimate,
                temp: tempF,
                line: newRandomLine,
                loading: false
              });
            }
          } else {
            if (active) {
              setWeatherData(prev => ({ ...prev, loading: false }));
            }
          }
        } catch (err) {
          console.error("Open-Meteo Weather Fetch Error:", err);
          if (active) {
            setWeatherData(prev => ({ ...prev, loading: false }));
          }
        }
      } else {
        if (active) {
          setWeatherData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    detectWeather();

    return () => {
      active = false;
    };
  }, [activeCoords.lat, activeCoords.lng]);

  // Sync chef bubble with parsed weather state on load
  useEffect(() => {
    if (!weatherData.loading) {
      const timer = setTimeout(() => {
        const pool = WEATHER_POOLS[weatherData.climate];
        const chefMsg = pool.chefLines[Math.floor(Math.random() * pool.chefLines.length)];
        setBubbleText(chefMsg);
        setCurrentMood('active');
        setCommentType('rare');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [weatherData.loading, weatherData.climate]);



  
  // Slide Carousel State
  const [slideIndex, setSlideIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Slide loop every 25 seconds for slow, premium drift
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  // Mouse Parallax Effect
  const handleMouseMove = (e) => {
    const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2); // -1 to 1
    const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2); // -1 to 1
    setMouseOffset({ x, y });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch reels preview (requesting a larger limit to sort the most trending on likes + comments)
        const reelsRes = await api.get('/reels?page=1&limit=1000').catch((err) => {
          console.warn('API reels preview failed, using local mock data:', err.message);
          return null;
        });
        if (reelsRes && reelsRes.data && reelsRes.data.data && reelsRes.data.data.length > 0) {
          // Sort descending based on likes + comments count
          const sortedReels = [...reelsRes.data.data].sort((a, b) => {
            const scoreA = (a.likes?.length || 0) + (a.comments?.length || 0);
            const scoreB = (b.likes?.length || 0) + (b.comments?.length || 0);
            return scoreB - scoreA;
          });
          setReelsPreview(sortedReels.slice(0, 3));
        } else {
          setReelsPreview(MOCK_REELS);
        }

        // Fetch restaurants (querying a larger limit to sort all elite kitchens by rating)
        const restRes = await api.get('/restaurants?page=1&limit=1000').catch((err) => {
          console.warn('API restaurants preview failed, using local mock data:', err.message);
          return null;
        });
        if (restRes && restRes.data && restRes.data.data && restRes.data.data.length > 0) {
          // Sort descending based on rating (highest rated first)
          const sortedRestaurants = [...restRes.data.data].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setRestaurants(sortedRestaurants);
        } else {
          const sortedMock = [...MOCK_RESTAURANTS].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setRestaurants(sortedMock);
        }
      } catch (err) {
        console.error('Failed to load home preview data:', err.message);
        setReelsPreview(MOCK_REELS);
        setRestaurants(MOCK_RESTAURANTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (tag) => {
    if (tag) {
      navigate(`/discover?tag=${encodeURIComponent(tag)}`);
    } else {
      navigate('/discover');
    }
  };

  // Get active address type icons
  const getAddressIcon = (type) => {
    if (type === 'Home') return <HomeIcon size={14} className="text-primary" />;
    if (type === 'Work') return <Briefcase size={14} className="text-primary" />;
    return <Building size={14} className="text-primary" />;
  };

  return (
    <div 
      className="fade-in pb-[100px] w-full" 
      onMouseMove={handleMouseMove}
    >
      {/* 🎬 HERO BACKGROUND — crisp object-cover img, no blur/scale distortion */}
      <div className="absolute top-0 left-0 right-0 h-[680px] overflow-hidden z-0 pointer-events-none">
        {/* Sharp food image — no blur, no scale, pure object-cover */}
        <img
          src={HERO_SLIDES[0].image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-20 dark:opacity-40 brightness-[1.1] dark:brightness-[0.7] select-none"
        />
        {/* Left-side readability fade so text column stays crisp */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_var(--bg-primary)_15%,_transparent_55%)]" />
        {/* Right-side soft edge in light, deeper in dark */}
        <div className="absolute inset-0 bg-[linear-gradient(to_left,_rgba(246,243,238,0.55)_0%,_transparent_50%)] dark:bg-[linear-gradient(to_left,_rgba(4,4,8,0.65)_0%,_transparent_50%)]" />
        {/* Bottom fade into page background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_transparent_35%,_var(--bg-primary)_88%)]" />
      </div>

      <div className="container relative z-[1]">
        {/* HERO CONTENT SECTION */}
        <section className="home-hero-grid">
          {/* Left Text and Search Controls */}
          <motion.div
            className="relative -mt-28 md:-mt-48 z-10"
            animate={{ 
              x: mouseOffset.x * 8,
              y: mouseOffset.y * 6
            }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
          >
            {/* High-contrast radial overlay behind hero text */}
            <div className="absolute -inset-6 md:-inset-10 z-0 pointer-events-none bg-[radial-gradient(circle_at_left_30%,_rgba(246,243,238,0.72)_0%,_transparent_60%)] dark:bg-[radial-gradient(circle_at_left_30%,_rgba(11,15,20,0.72)_0%,_transparent_60%)] rounded-[32px] blur-sm" />
            
            <div className="relative z-10">
              {/* Weather & Location Concierge Live Capsule Section */}
              <div className="flex flex-col items-start mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {/* Weather Concierge Live Capsule */}
                  <motion.div
                    whileHover={{ y: -1 }}
                    className="weather-concierge-badge inline-flex items-center gap-2 select-none !mb-0"
                  >
                    {renderWeatherIcon(weatherData.climate)}
                    <span className="flex items-center gap-1.5 font-bold tracking-[0.06em]">
                      <span className="text-[var(--primary)]">{weatherData.temp}</span>
                      <span className="text-[var(--text-muted)] opacity-50">•</span>
                      <span className="text-[var(--text-primary)] font-semibold text-[12px] capitalize">
                        {weatherData.climate} Vibe
                      </span>
                    </span>
                    <span className="weather-pulse-dot" />
                  </motion.div>

                  {/* Glassmorphic Indian Location Indicator Picker */}
                  <motion.div
                    whileHover={{ y: -1 }}
                    onClick={() => setLocationModalOpen(true)}
                    className="weather-concierge-badge cursor-pointer inline-flex items-center gap-2 select-none active:scale-[0.98] transition-all !mb-0"
                    title="Switch your Indian delivery region"
                  >
                    <MapPin size={13} className="text-primary" />
                    <span className="flex items-center gap-1 font-bold tracking-[0.06em] text-[12px] uppercase">
                      <span className="text-[var(--text-muted)]">Delivering to:</span>
                      <strong className="text-[var(--text-primary)] font-bold tracking-normal lowercase">{activeLocality}, {activeCity}</strong>
                    </span>
                    <ChevronDown size={11} className="text-text-muted transition-transform" />
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={weatherData.line}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="weather-classic-line pl-1 select-none pointer-events-none"
                  >
                    {weatherData.line}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Nunito Bold Hero Headline */}
              <h1 className="hero-headline select-none">
                <span className="hero-headline-hover-group">
                  {"Experience Food".split("").map((char, idx) => (
                    <span
                      key={idx}
                      className="hero-3d-letter"
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>
                <span className="hero-headline-accent">
                  Like Never Before
                </span>
              </h1>


              <p className="text-[19px] text-[var(--text-secondary)] mb-4 max-w-[560px] font-light leading-[1.65]">
                Discover. Savor. Indulge. Immerse your senses in cinema-grade, chef-curated recipe Reels. Order breathtaking culinary masterpieces instantly, and track every dining detail from kitchen to table.
              </p>

              {/* Large Glass Search Panel */}
              <form onSubmit={handleSearchSubmit} className="flex gap-3.5 max-w-[520px] relative z-10">
                <div className="relative flex-1">
                  <Search 
                    size={20} 
                    className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
                  />
                  <input 
                  type="text" 
                  className="glass-input !pl-[50px] rounded-[20px] h-[56px] text-[15px]" 
                  placeholder="Search premium truffles, sushi, steaks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary rounded-[20px] px-8 h-[56px] font-bold"
                >
                  Search
                </button>
              </form>

              {/* CTA Option Buttons */}
              <div className="flex gap-3 mt-3 items-center">
                <button 
                  onClick={() => navigate('/discover')}
                  className="btn btn-primary px-[26px] py-3 text-[14px] rounded-[16px] flex items-center gap-2"
                >
                  <Compass size={16} />
                  Explore Food
                </button>
                <button 
                  onClick={() => navigate('/reels')}
                  className="btn btn-secondary px-[26px] py-3 text-[14px] rounded-[16px] flex items-center gap-2 border-[1.5px] border-[var(--border-light)]"
                >
                  <Play size={16} fill="currentColor" />
                  Watch Reels
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Mascot Column */}
          <motion.div
            animate={{ 
              x: mouseOffset.x * 14,
              y: mouseOffset.y * 10
            }}
            transition={{ type: "spring", stiffness: 50, damping: 14 }}
            className="relative z-20"
          >
            <MascotChef />
          </motion.div>
        </section>

        {/* 🍱 HORIZONTAL QUICK CATEGORIES ROW */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-[30px] flex flex-wrap justify-center gap-2.5 relative z-10"
        >
          {CATEGORIES.slice(1).map((cat) => (
            <button 
              key={cat.name} 
              onClick={() => handleCategoryClick(cat.tag)} 
              className="chip text-[13px] px-[22px] py-2.5"
            >
              {cat.name}
            </button>
          ))}
        </motion.div>

        {/* 🎥 SOCIAL REELS PREVIEW (TRENDING BITES) WITH VIEWPORT SPRING */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[100px] text-left"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <Flame size={26} className="text-[var(--primary)]" />
              <h2 className="text-[32px] tracking-[0.02em] font-light">Trending Bites</h2>
            </div>
            <button 
              onClick={() => navigate('/reels')} 
              className="btn btn-secondary btn-pill text-[13px] border-[1.5px] border-[var(--border-light)] px-[22px] py-2.5"
            >
              Watch All Reels →
            </button>
          </div>

          <div 
            className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-7"
          >
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="glass-primary skeleton-box h-[380px] opacity-40" />
              ))
            ) : reelsPreview.length > 0 ? (
              reelsPreview.slice(0, 3).map((reel) => (
                <TrendingReelCard 
                  key={reel._id} 
                  reel={reel} 
                  onClick={() => navigate('/reels', { state: { initialReelId: reel._id } })} 
                />
              ))
            ) : (
              <div className="glass-primary flex-center h-[140px] text-[var(--text-secondary)] col-span-full">
                <div className="noise-overlay" />
                No culinary reels available.
              </div>
            )}
          </div>
        </motion.section>

        {/* 🏪 CURATED ELITE RESTAURANTS SECTION WITH VIEWPORT REVEAL */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[120px] text-left"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <Navigation size={26} className="text-[var(--accent)]" />
              <h2 className="text-[32px] tracking-[0.02em] font-light">Curated Elite Kitchens</h2>
            </div>
            <div className="flex items-center gap-3">
              {restaurants.length > 3 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrevBatch}
                    className="btn btn-secondary btn-pill p-2.5 flex items-center justify-center border-[1.5px] border-[var(--border-light)] disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={activeBatchIndex === 0}
                    aria-label="Previous Batch"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextBatch}
                    className="btn btn-secondary btn-pill p-2.5 flex items-center justify-center border-[1.5px] border-[var(--border-light)] disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={(activeBatchIndex + 1) * 3 >= restaurants.length}
                    aria-label="Next Batch"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <button 
                onClick={() => navigate('/discover')} 
                className="btn btn-secondary btn-pill text-[13px] border-[1.5px] border-[var(--border-light)] px-[22px] py-2.5"
              >
                Explore All Kitchens →
              </button>
            </div>
          </div>

          <div className="relative min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBatchIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[30px]"
              >
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="glass-primary skeleton-box h-[320px] opacity-40" />
                  ))
                ) : restaurants.length > 0 ? (
                  restaurants.slice(activeBatchIndex * 3, (activeBatchIndex + 1) * 3).map((rest) => (
                    <motion.div 
                      key={rest._id} 
                      whileHover={{ y: -8 }}
                      onClick={() => navigate(`/restaurant/${rest._id}`)}
                      className="glass-card p-0 overflow-hidden cursor-pointer rounded-[28px] border-[1.5px] border-[var(--border-light)]"
                    >
                      <div className="noise-overlay" />
                      
                      {/* Cover Image with soft zoom capability */}
                      <div className="w-full aspect-[16/10] relative overflow-hidden rounded-t-[inherit]">
                        <SafeImage 
                          src={resolveMediaUrl(rest.coverImage)} 
                          alt={rest.name} 
                          className="w-full h-full duration-800 transition-transform ease-apple"
                        />
                        
                        {/* Rating Badge */}
                        <div 
                          className="absolute top-4 right-4 bg-[#0a0a0d]/70 backdrop-blur-[10px] rounded-[12px] px-3 py-1 flex items-center gap-1.25 border-[1.5px] border-white/10"
                        >
                          <Star size={13} fill="#ffc83b" stroke="#ffc83b" />
                          <span className="text-[13px] font-extrabold text-white">{rest.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Meta details */}
                      <div className="p-[26px] text-left">
                        <h3 className="text-[22px] mb-2 font-normal">{rest.name}</h3>
                        <p className="text-[14px] text-[var(--text-secondary)] mb-4 block h-11 overflow-hidden leading-[1.5]">
                          {rest.description}
                        </p>
                        
                        {/* Cuisines Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4.5">
                          {rest.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--surface-container)] px-2.5 py-[5px] rounded-[8px]">
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between border-t-[1.5px] border-[var(--border-light)] pt-[18px] text-[13px] text-[var(--text-muted)] font-semibold">
                          {isRestaurantOutOfRange(rest) ? (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-0.5 px-2 rounded-md text-[10px] uppercase tracking-wide font-extrabold animate-pulse">
                              <AlertTriangle size={10} className="text-red-500" /> Out of Local Range
                            </span>
                          ) : (
                            <span className="flex items-center gap-[5px]">
                              <Clock size={13} />
                              {rest.deliveryTime} mins
                            </span>
                          )}
                          <span>
                            Delivery: {rest.deliveryFee === 0 ? 'FREE' : formatPrice(rest.deliveryFee)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="glass-primary flex-center h-[140px] text-[var(--text-secondary)] col-span-full">
                    <div className="noise-overlay" />
                    No curated kitchens registered.
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      {/* PREMIUM SLIDING BOTTOM ADDRESS SELECTOR DRAWER (DESKTOP/MOBILE MODAL) */}
      <AnimatePresence>
        {locationModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 select-none">
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
                            : 'bg-[var(--surface)] border-border-light text-text-secondary hover:text-text-primary hover:bg-[var(--surface-hover)]'
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
      </AnimatePresence>
    </div>
  );
}
