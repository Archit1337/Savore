import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';
import { Search, Flame, Sparkles, Film, Navigation, Clock, Star, Play, Compass, MapPin, ChevronDown, ChevronUp, X, Home as HomeIcon, Briefcase, Building, AlertTriangle, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import MascotChef from '../components/MascotChef';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';
import Hero3DBackground from '../components/Hero3DBackground';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';
import { soundController } from '../components/ChefSystem/SoundController';
import { LocationContext, CITIES, CITY_LOCALITIES, CITY_COORDINATES } from '../context/LocationContext';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const bgRevealVariant = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: {
    opacity: 1,
    scale: 1.0,
    transition: {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const topBannerVariant = {
  hidden: { opacity: 0, y: -35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const conciergeRevealVariant = {
  hidden: { opacity: 0, y: -30, x: 0 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      delay: 0.12,
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const headlineRevealVariant = {
  hidden: { opacity: 0, x: -50, y: 0 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: 0.25,
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const descRevealVariant = {
  hidden: { opacity: 0, x: -30, y: 20 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: 0.38,
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const searchRevealVariant = {
  hidden: { opacity: 0, x: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1.0,
    transition: {
      delay: 0.5,
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const ctaRevealVariant = {
  hidden: { opacity: 0, y: 15, x: 35 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      delay: 0.62,
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const mascotRevealVariant = {
  hidden: { opacity: 0, x: 65, y: 10, scale: 0.93, rotate: 4 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1.0,
    rotate: 0,
    transition: {
      delay: 0.45,
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 40,
    y: 15,
    scale: 0.90,
    rotate: 6,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const categoriesRevealVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1.0,
    transition: {
      delay: 0.75,
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const batchContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    }
  }
};

const batchCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -12, 
    transition: { 
      duration: 0.3, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};



const getCityCoordsLabel = (cityName) => {
  const coords = {
    'Mumbai': '19.076° N, 72.877° E',
    'Delhi': '28.613° N, 77.209° E',
    'Bengaluru': '12.971° N, 77.594° E',
    'Hyderabad': '17.385° N, 78.486° E',
    'Chennai': '13.082° N, 80.270° E',
    'Kolkata': '22.572° N, 88.363° E',
    'Pune': '18.520° N, 73.856° E',
    'Ahmedabad': '23.022° N, 72.571° E',
    'Jaipur': '26.912° N, 75.787° E',
    'Chandigarh': '30.733° N, 76.779° E',
    'Goa': '15.299° N, 74.124° E',
    'Kochi': '9.931° N, 76.267° E'
  };
  return coords[cityName] || '20.593° N, 78.962° E';
};

const CATEGORIES = [
  { name: 'All Cuisines', tag: '' },
  { name: 'Premium Dining', tag: 'Premium Dining' },
  { name: 'Spicy Fusion', tag: 'Spicy' },
  { name: 'Fresh Sushi', tag: 'Fresh' },
  { name: 'Comfort Food', tag: 'Comfort Food' },
  { name: 'Desserts', tag: 'Desserts' },
];

const PILLARS_DATA = [
  {
    num: "01",
    title: "Open Stage",
    desc: "Any restaurant, from neighborhood gems to five-star kitchens, can claim their spot on Savoré. List your menu, tell your story, and let the city discover what you cook.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85"
  },
  {
    num: "02",
    title: "Thermal Precision",
    desc: "Our custom packaging and transit protocols lock in core heat signatures, ensuring dishes arrive at the exact kitchen-exit temperature.",
    image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=1200&q=85"
  },
  {
    num: "03",
    title: "Cinema Feed",
    desc: "Watch real-time desaturated cinematic reels from the hot pans of active kitchens before placing your order. Dine with visual confirmation.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85"
  }
];

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=2400&q=95",
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
      "Ah, what a beautiful sun-kissed afternoon! Mon ami, the weather calls for the crisp, clean flavor of our fresh Edo-style Salmon Sashimi!",
      "Bright skies demand bright flavors! Might I suggest our signature chilled Truffle Caprese or a glass of crisp champagne?",
      "The sun is shining beautifully today! Let's celebrate with light, vibrant dishes crafted just for you!"
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
      "Ah, what a beautiful, clear starlit night! Mon ami, cozy up with the rich warmth of our slow-cooked Wagyu Beef Bourguignon!",
      "Under the starry night sky, let us elevate your evening with a glass of robust Cabernet Sauvignon and fresh truffles!",
      "A cool, calm evening is upon us. Celebrate the night with our molten-core chocolate creations!"
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
      "Soft rain drumming outside... it is the ultimate excuse to wrap yourself in deep comfort with a steaming bowl of Lobster Bisque!",
      "Rainy skies call for warmth from the inside out. Savor our slow-cooked Wagyu Beef Bourguignon, mon ami!",
      "Ah, listen to the rain fall... warm your soul with a rich, hot Valrhona Chocolate Soufflé fresh from the oven!"
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
      "Cozy silver skies today... wrap yourself in pure luxury with a glass of rich red wine and our dry-aged culinary specials!",
      "The overcast mist calls for slow-roasted masterpieces. Our Roasted Truffle Chicken is waiting to delight you!",
      "Cloudy daydreams call for comforting food creations. Let me cook up a comforting feast for you!"
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
      "Ooh, there is a crisp chill in the air today! Warm up instantly with a steaming bowl of our 24-hour slow-cooked Spicy Fusion Ramen!",
      "Cold winds are blowing, mon ami! Seek shelter in the warm luxury of our hot Truffle Gnocchi or sizzling dry-aged steaks!",
      "Chilly evenings call for cozy culinary magic. Warm your senses with our molten core chocolate creations and robust stews!"
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
      "Mon dieu, quite a storm raging outside! Let me warm you up with our fiery Spicy Szechuan Fusion Noodles!",
      "Thunder & lightning call for bold flavors! Cozy up with our sizzling hotpots and robust, spiced red wine!"
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
      "Ah, a beautiful blanket of snow outside! Cozy up with a piping hot bowl of our Signature Wild Mushroom Truffle Risotto!",
      "It is a winter wonderland! Let us bring you warmth with a hot, freshly baked chocolate soufflé!"
    ]
  }
};

// Dynamic, hardware-accelerated weather animations that overlay the search input
function SearchBarWeatherAnimation({ climate, isVisible }) {
  const { isDark } = useContext(ThemeContext);
  const animOpacityClass = isVisible ? 'opacity-100' : 'opacity-0';

  switch (climate) {
    case 'sunny': {
      const rayColor1 = isDark ? 'rgba(255, 200, 120, 0.08)' : 'rgba(245, 158, 11, 0.16)';
      const rayColor2 = isDark ? 'rgba(255, 225, 160, 0.14)' : 'rgba(251, 191, 36, 0.24)';
      const warmthColor = isDark ? 'rgba(255, 225, 170, 0.05)' : 'rgba(251, 191, 36, 0.10)';
      const spot1Color = isDark ? 'rgba(255, 235, 180, 0.16)' : 'rgba(245, 158, 11, 0.22)';
      const spot2Color = isDark ? 'rgba(255, 210, 130, 0.12)' : 'rgba(217, 119, 6, 0.18)';
      
      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <style>{`
            @keyframes sunRaySweep {
              0% { transform: translateX(-35%) rotate(-6deg); opacity: 0.35; }
              50% { opacity: 0.65; }
              100% { transform: translateX(35%) rotate(6deg); opacity: 0.35; }
            }
            @keyframes sunSpotPulse1 {
              0%, 100% { opacity: 0.1; transform: translate(0, 0) scale(0.9); }
              50% { opacity: 0.35; transform: translate(15px, -4px) scale(1.1); }
            }
            @keyframes sunSpotPulse2 {
              0%, 100% { opacity: 0.3; transform: translate(0, 0) scale(1.05); }
              50% { opacity: 0.1; transform: translate(-10px, 3px) scale(0.9); }
            }
            .sunny-ray-glow {
              background: linear-gradient(135deg, 
                transparent 35%, 
                ${rayColor1} 46%, 
                ${rayColor2} 50%, 
                ${rayColor1} 54%, 
                transparent 65%
              );
              animation: sunRaySweep 14s ease-in-out infinite alternate;
              filter: blur(8px);
            }
            .sunny-warmth {
              background: radial-gradient(circle at 15% 30%, ${warmthColor} 0%, transparent 65%);
            }
            .sunny-spot-1 {
              background: radial-gradient(circle, ${spot1Color} 0%, transparent 70%);
              animation: sunSpotPulse1 8s ease-in-out infinite alternate;
            }
            .sunny-spot-2 {
              background: radial-gradient(circle, ${spot2Color} 0%, transparent 70%);
              animation: sunSpotPulse2 10s ease-in-out infinite alternate;
            }
          `}</style>
          <div className="absolute inset-0 sunny-warmth" />
          <div className="absolute -inset-x-[40%] -inset-y-12 sunny-ray-glow" />
          <div className="absolute top-[10%] left-[25%] w-24 h-10 sunny-spot-1" />
          <div className="absolute bottom-[10%] right-[30%] w-32 h-12 sunny-spot-2" />
        </div>
      );
    }
    case 'rainy':
      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <svg className="w-full h-full opacity-22" xmlns="http://www.w3.org/2000/svg">
            <style>{`
              @keyframes rainFall {
                0% { transform: translate(0, -20px); opacity: 0; }
                50% { opacity: 0.6; }
                100% { transform: translate(-10px, 40px); opacity: 0; }
              }
              .rain-drop-line {
                stroke: var(--primary);
                stroke-width: 1;
                animation: rainFall 1.2s linear infinite;
              }
            `}</style>
            <line x1="10%" y1="0" x2="10%" y2="12" className="rain-drop-line" style={{ animationDelay: '0s', animationDuration: '1s' }} />
            <line x1="30%" y1="0" x2="30%" y2="12" className="rain-drop-line" style={{ animationDelay: '0.2s', animationDuration: '1.1s' }} />
            <line x1="50%" y1="0" x2="50%" y2="12" className="rain-drop-line" style={{ animationDelay: '0.4s', animationDuration: '0.9s' }} />
            <line x1="70%" y1="0" x2="70%" y2="12" className="rain-drop-line" style={{ animationDelay: '0.1s', animationDuration: '1.05s' }} />
            <line x1="90%" y1="0" x2="90%" y2="12" className="rain-drop-line" style={{ animationDelay: '0.3s', animationDuration: '0.95s' }} />
          </svg>
        </div>
      );
    case 'stormy':
      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <style>{`
            @keyframes rainFallStorm {
              0% { transform: translate(0, -20px); opacity: 0; }
              50% { opacity: 0.7; }
              100% { transform: translate(-15px, 40px); opacity: 0; }
            }
            @keyframes lightningFlash {
              0%, 94%, 96%, 98%, 100% { opacity: 0; }
              95%, 97% { opacity: 0.6; }
            }
            .storm-drop-line {
              stroke: var(--primary);
              stroke-width: 1.1;
              animation: rainFallStorm 0.8s linear infinite;
            }
            .lightning-flash-overlay {
              background: rgba(255, 90, 60, 0.05);
              animation: lightningFlash 7s infinite;
            }
          `}</style>
          <div className="absolute inset-0 lightning-flash-overlay w-full h-full rounded-[20px] pointer-events-none" />
          <svg className="w-full h-full absolute inset-0 opacity-25" xmlns="http://www.w3.org/2000/svg">
            <line x1="15%" y1="0" x2="15%" y2="14" className="storm-drop-line" style={{ animationDelay: '0s' }} />
            <line x1="35%" y1="0" x2="35%" y2="14" className="storm-drop-line" style={{ animationDelay: '0.15s' }} />
            <line x1="55%" y1="0" x2="55%" y2="14" className="storm-drop-line" style={{ animationDelay: '0.3s' }} />
            <line x1="75%" y1="0" x2="75%" y2="14" className="storm-drop-line" style={{ animationDelay: '0.08s' }} />
            <line x1="95%" y1="0" x2="95%" y2="14" className="storm-drop-line" style={{ animationDelay: '0.22s' }} />
          </svg>
        </div>
      );
    case 'starry':
      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <style>{`
              @keyframes starTwinkle {
                0%, 100% { opacity: 0.1; transform: scale(0.8); }
                50% { opacity: 0.75; transform: scale(1.1); }
              }
              .star-point {
                fill: #ffd166;
                animation: starTwinkle 3s infinite ease-in-out;
                transform-origin: center;
              }
            `}</style>
            <circle cx="20%" cy="30%" r="1" className="star-point" style={{ animationDelay: '0s' }} />
            <circle cx="45%" cy="70%" r="1.2" className="star-point" style={{ animationDelay: '0.5s' }} />
            <circle cx="65%" cy="40%" r="1" className="star-point" style={{ animationDelay: '1.4s' }} />
            <circle cx="85%" cy="60%" r="1.3" className="star-point" style={{ animationDelay: '0.9s' }} />
          </svg>
        </div>
      );
    case 'snowy': {
      const snowflakeColor = isDark ? '#ffffff' : '#708090';
      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <style>{`
              @keyframes snowDrift {
                0% { transform: translate(0, -10px); opacity: 0; }
                50% { opacity: 0.75; }
                100% { transform: translate(5px, 35px); opacity: 0; }
              }
              .snow-flake {
                fill: ${snowflakeColor};
                animation: snowDrift 3s linear infinite;
              }
            `}</style>
            <circle cx="15%" cy="0" r="1.2" className="snow-flake" style={{ animationDelay: '0s', animationDuration: '2.5s' }} />
            <circle cx="35%" cy="0" r="1.6" className="snow-flake" style={{ animationDelay: '0.8s', animationDuration: '3s' }} />
            <circle cx="55%" cy="0" r="1.2" className="snow-flake" style={{ animationDelay: '1.5s', animationDuration: '2.7s' }} />
            <circle cx="75%" cy="0" r="2.2" className="snow-flake" style={{ animationDelay: '0.4s', animationDuration: '3.2s' }} />
            <circle cx="95%" cy="0" r="1.5" className="snow-flake" style={{ animationDelay: '1s', animationDuration: '2.8s' }} />
          </svg>
        </div>
      );
    }
    case 'cloudy':
    default: {
      const svgOpacityClass = isDark ? 'opacity-35' : 'opacity-45';
      const windLineColor = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(50, 65, 90, 0.48)';
      const cloudColor = isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(80, 95, 120, 0.46)';
      const peakWindOpacity = isDark ? 0.35 : 0.50;
      const peakCloudOpacity = isDark ? 0.40 : 0.55;

      return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden rounded-[20px] transition-opacity duration-500 ease-out z-20 ${animOpacityClass}`}>
          <svg className={`w-full h-full ${svgOpacityClass}`} xmlns="http://www.w3.org/2000/svg">
            <style>{`
              @keyframes windLineBlow {
                0% { transform: translateX(-60px); opacity: 0; }
                10% { opacity: ${peakWindOpacity}; }
                90% { opacity: ${peakWindOpacity}; }
                100% { transform: translateX(540px); opacity: 0; }
              }
              @keyframes cloudDrift {
                0% { transform: translateX(-40px); opacity: 0; }
                10% { opacity: ${peakCloudOpacity}; }
                90% { opacity: ${peakCloudOpacity}; }
                100% { transform: translateX(540px); opacity: 0; }
              }
              .wind-line {
                stroke: ${windLineColor};
                stroke-width: 1;
                stroke-dasharray: 6, 10;
                animation: windLineBlow 6s linear infinite;
              }
              .vector-cloud {
                fill: ${cloudColor};
                animation: cloudDrift 20s linear infinite;
              }
            `}</style>
            
            {/* Wind blowing line vectors */}
            <line x1="0" y1="35%" x2="35" y2="35%" className="wind-line" style={{ animationDelay: '0s', animationDuration: '5.5s' }} />
            <line x1="0" y1="65%" x2="45" y2="65%" className="wind-line" style={{ animationDelay: '2.2s', animationDuration: '6s' }} />
            <line x1="0" y1="50%" x2="30" y2="50%" className="wind-line" style={{ animationDelay: '1.1s', animationDuration: '7s' }} />

            {/* Faint vector clouds drifting */}
            <g className="vector-cloud" style={{ animationDelay: '0s', animationDuration: '22s' }}>
              <path d="M 0,25 Q 5,16 12,18 Q 18,12 25,18 Q 30,16 34,22 C 37,23 37,27 34,28 Q 32,29 20,29 C 10,29 0,29 0,25 Z" transform="scale(0.8) translate(10, 5)" />
            </g>
            <g className="vector-cloud" style={{ animationDelay: '7s', animationDuration: '18s' }}>
              <path d="M 0,25 Q 5,16 12,18 Q 18,12 25,18 Q 30,16 34,22 C 37,23 37,27 34,28 Q 32,29 20,29 C 10,29 0,29 0,25 Z" transform="scale(0.65) translate(100, 16)" />
            </g>
            <g className="vector-cloud" style={{ animationDelay: '13s', animationDuration: '26s' }}>
              <path d="M 0,25 Q 5,16 12,18 Q 18,12 25,18 Q 30,16 34,22 C 37,23 37,27 34,28 Q 32,29 20,29 C 10,29 0,29 0,25 Z" transform="scale(0.7) translate(70, -2)" />
            </g>
          </svg>
        </div>
      );
    }
  }
}

export default function Home() {
  const { user, isAuthenticated } = useContext(AuthContext);
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

  const { isDark } = useContext(ThemeContext);

  const [isPageReady, setIsPageReady] = useState(false);


  useEffect(() => {
    if (!window.savoreLoaderComplete) {
      const interval = setInterval(() => {
        if (window.savoreLoaderComplete) {
          setIsPageReady(true);
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => {
        setIsPageReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

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

  // Scroll lock — prevent main page scroll when the location modal is open
  useEffect(() => {
    if (locationModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [locationModalOpen]);

  const [hoveredPillar, setHoveredPillar] = useState(null);

  // Savoré Pillars Scroll Parallax refs and hooks
  const pillarsRef = useRef(null);
  const { scrollYProgress: pillarsScrollProgress } = useScroll({
    target: pillarsRef,
    offset: ["start end", "end start"]
  });

  // Parallax Y translations
  const col1Y = useTransform(pillarsScrollProgress, [0, 0.5, 1], [40, 0, -40]);
  const col2Y = useTransform(pillarsScrollProgress, [0, 0.5, 1], [15, 0, -15]);
  const col3Y = useTransform(pillarsScrollProgress, [0, 0.5, 1], [65, 0, -65]);

  // Floating rotation angles
  const col1Rotate = useTransform(pillarsScrollProgress, [0, 0.5, 1], [-1.5, 0, 1.5]);
  const col2Rotate = useTransform(pillarsScrollProgress, [0, 0.5, 1], [0.8, 0, -0.8]);
  const col3Rotate = useTransform(pillarsScrollProgress, [0, 0.5, 1], [-1.2, 0, 1.2]);

  // Fade-in/out opacity
  const colOpacity = useTransform(pillarsScrollProgress, [0.05, 0.25, 0.75, 0.95], [0, 1, 1, 0]);

  // Smooth springs
  const col1YSpring = useSpring(col1Y, { stiffness: 85, damping: 26 });
  const col2YSpring = useSpring(col2Y, { stiffness: 85, damping: 26 });
  const col3YSpring = useSpring(col3Y, { stiffness: 85, damping: 26 });

  const col1RotateSpring = useSpring(col1Rotate, { stiffness: 85, damping: 26 });
  const col2RotateSpring = useSpring(col2Rotate, { stiffness: 85, damping: 26 });
  const col3RotateSpring = useSpring(col3Rotate, { stiffness: 85, damping: 26 });

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

  const [showFloatingLocation, setShowFloatingLocation] = useState(false);
  const [isPastScrollThreshold, setIsPastScrollThreshold] = useState(false);
  const [isPillHovered, setIsPillHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);

  useEffect(() => {
    let wasPast = false;
    let wasFloating = false;

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const isPastThreshold = scrollPos > 120;
      
      if (isPastThreshold !== wasPast) {
        wasPast = isPastThreshold;
        setIsPastScrollThreshold(isPastThreshold);
      }
      
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const distanceToBottom = docHeight - windowHeight - scrollPos;
      
      // Hide location selector when within 380px of page bottom to avoid overlapping footer
      const isCloseToFooter = distanceToBottom < 380;
      const shouldShowFloating = isPastThreshold && !isCloseToFooter;

      if (shouldShowFloating !== wasFloating) {
        wasFloating = shouldShowFloating;
        setShowFloatingLocation(shouldShowFloating);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getSearchPlaceholder = () => {
    switch (weatherData.climate) {
      case 'sunny':
        return "Search Gelato, Mango Lassi, Sushi...";
      case 'rainy':
      case 'stormy':
        return "Search Ramen, Masala Chai, Samosas...";
      case 'snowy':
      case 'chilly':
        return "Search Hot Pot, Gajar Halwa, Jalebi...";
      case 'starry':
      default:
        return "Search Pizza, Sushi, Biryani...";
    }
  };

  const { setBubbleText, setCurrentMood, setCommentType } = useChefMood();

  // 🧑‍🍳 Scroll-Driven Hero Folding & Chef Smile Animation
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 120, damping: 26, mass: 0.25 });
  const [showChef, setShowChef] = useState(false);
  const [flameParticles, setFlameParticles] = useState([]);
  const [isCookingClicked, setIsCookingClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [forceChefSmile, setForceChefSmile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const scrollTimeoutRef = { current: null };
    let isSmiling = false;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const shouldSmile = currentScroll > 15 && currentScroll < 850;
      
      if (shouldSmile !== isSmiling) {
        isSmiling = shouldSmile;
        setForceChefSmile(shouldSmile);
      }

      if (isSmiling) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          isSmiling = false;
          setForceChefSmile(false);
        }, 400);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // --- Element 1: Concierge / Weather Badge ---
  const driftX1 = useTransform(smoothScrollY, [0, 320], [0, isMobile ? 0 : 150]);
  const driftY1 = useTransform(smoothScrollY, [0, 320], [0, isMobile ? 100 : 25]);
  const driftScale1 = useTransform(smoothScrollY, [0, 320], [1, 0.94]);
  const driftOpacity1 = useTransform(smoothScrollY, [0, 320], [1, 0]);
  const driftRot1 = useTransform(smoothScrollY, [0, 320], [0, isMobile ? 0 : 1.5]);
  const driftRotY1 = useTransform(smoothScrollY, [0, 320], [0, isMobile ? 0 : -4]);

  // --- Element 2: Hero Headline ---
  const driftX2 = useTransform(smoothScrollY, [0, 480], [0, isMobile ? 0 : 120]);
  const driftY2 = useTransform(smoothScrollY, [0, 480], [0, isMobile ? 140 : 40]);
  const driftScale2 = useTransform(smoothScrollY, [0, 480], [1, 0.94]);
  const driftOpacity2 = useTransform(smoothScrollY, [0, 480], [1, 0]);
  const driftRot2 = useTransform(smoothScrollY, [0, 480], [0, isMobile ? 0 : -1.2]);
  const driftRotY2 = useTransform(smoothScrollY, [0, 480], [0, isMobile ? 0 : -3]);

  // --- Element 3: Description ---
  const driftX3 = useTransform(smoothScrollY, [0, 600], [0, isMobile ? 0 : 90]);
  const driftY3 = useTransform(smoothScrollY, [0, 600], [0, isMobile ? 180 : 55]);
  const driftScale3 = useTransform(smoothScrollY, [0, 600], [1, 0.94]);
  const driftOpacity3 = useTransform(smoothScrollY, [0, 600], [1, 0]);
  const driftRot3 = useTransform(smoothScrollY, [0, 600], [0, isMobile ? 0 : 1.0]);
  const driftRotY3 = useTransform(smoothScrollY, [0, 600], [0, isMobile ? 0 : -2.5]);

  // --- Element 4: Search Bar ---
  const driftX4 = useTransform(smoothScrollY, [0, 720], [0, isMobile ? 0 : 60]);
  const driftY4 = useTransform(smoothScrollY, [0, 720], [0, isMobile ? 220 : 70]);
  const driftScale4 = useTransform(smoothScrollY, [0, 720], [1, 0.94]);
  const driftOpacity4 = useTransform(smoothScrollY, [0, 720], [1, 0]);
  const driftRot4 = useTransform(smoothScrollY, [0, 720], [0, isMobile ? 0 : -0.8]);
  const driftRotY4 = useTransform(smoothScrollY, [0, 720], [0, isMobile ? 0 : -2]);

  // --- Element 5: CTA Buttons ---
  const driftX5 = useTransform(smoothScrollY, [0, 800], [0, isMobile ? 0 : 40]);
  const driftY5 = useTransform(smoothScrollY, [0, 800], [0, isMobile ? 250 : 85]);
  const driftScale5 = useTransform(smoothScrollY, [0, 800], [1, 0.94]);
  const driftOpacity5 = useTransform(smoothScrollY, [0, 800], [1, 0]);
  const driftRot5 = useTransform(smoothScrollY, [0, 800], [0, isMobile ? 0 : 0.6]);
  const driftRotY5 = useTransform(smoothScrollY, [0, 800], [0, isMobile ? 0 : -1.5]);

  // --- Mascot Chef: Slide to Center ---
  const chefX = useTransform(smoothScrollY, [0, 750], [0, isMobile ? 0 : -360]);

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


  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [steamParticles, setSteamParticles] = useState([]);
  const lastBoxHoveredRef = useRef(false);

  const playSizzleSound = () => {
    try {
      soundController.initContext();
      const ctx = soundController.ctx;
      if (!ctx) return;
      
      const bufferSize = ctx.sampleRate * 0.8; // 0.8s duration
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate high-frequency white noise for sizzle
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      // Filter out low rumble frequencies, keep crisp sizzle/steam hiss
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6000;
      filter.Q.value = 1;
      
      // Soften the high hiss edge
      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.value = 11000;
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      // Quick, soft fade-in to avoid speaker clicking
      gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.04);
      // Exponential volume decay over 0.75 seconds
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
      
      noiseNode.connect(filter);
      filter.connect(lpFilter);
      lpFilter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noiseNode.start();
    } catch (e) {
      console.warn("Sizzle sound synthesis error:", e);
    }
  };

  const handleMouseEnter = () => {
    setIsBoxHovered(true);
    playSizzleSound();
  };

  const handleMouseLeave = () => {
    setIsBoxHovered(false);
  };

  useEffect(() => {
    let interval;
    if (isBoxHovered) {
      // 1. Release initial steam immediately upon opening
      const initialSteam = Array.from({ length: 3 }).map((_, i) => ({
        id: `${Date.now()}-open-initial-${i}-${Math.random()}`,
        x: -20 + i * 16 + (Math.random() - 0.5) * 8,
        y: -15,
        delay: i * 0.08,
      }));
      setSteamParticles((prev) => [...prev, ...initialSteam]);
      setTimeout(() => {
        setSteamParticles((prev) => prev.filter((p) => !initialSteam.some((n) => n.id === p.id)));
      }, 3000); // 3000ms matches 2.2s float duration plus delay

      // 2. Continual steam release every 900ms while it remains open
      interval = setInterval(() => {
        const newSteam = Array.from({ length: 2 }).map((_, i) => ({
          id: `${Date.now()}-open-loop-${i}-${Math.random()}`,
          x: -15 + i * 15 + (Math.random() - 0.5) * 8,
          y: -15,
          delay: i * 0.1,
        }));
        setSteamParticles((prev) => [...prev, ...newSteam]);
        setTimeout(() => {
          setSteamParticles((prev) => prev.filter((p) => !newSteam.some((n) => n.id === p.id)));
        }, 3000);
      }, 900);
    } else {
      // 3. One final burst of steam when it closes (6 wisps)
      if (lastBoxHoveredRef.current === true) {
        const closeSteam = Array.from({ length: 6 }).map((_, i) => ({
          id: `${Date.now()}-close-${i}-${Math.random()}`,
          x: -25 + i * 10 + (Math.random() - 0.5) * 6,
          y: -15,
          delay: i * 0.06,
        }));
        setSteamParticles((prev) => [...prev, ...closeSteam]);
        setTimeout(() => {
          setSteamParticles((prev) => prev.filter((p) => !closeSteam.some((n) => n.id === p.id)));
        }, 3000);
      }
    }
    lastBoxHoveredRef.current = isBoxHovered;

    return () => clearInterval(interval);
  }, [isBoxHovered]);

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
      {/* 🎬 HERO BACKGROUND — Interactive 3D Canvas Background */}
      <motion.div 
        variants={bgRevealVariant}
        initial="hidden"
        animate={isPageReady ? "visible" : "hidden"}
        className="absolute top-0 left-0 right-0 h-[840px] overflow-hidden z-0 pointer-events-none"
      >
        <Hero3DBackground chefVisible={showChef} />

        {/* Left-side readability fade so text column stays crisp */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, var(--bg-primary) 18%, transparent 58%)' }} />
        
        {/* Right-side soft edge */}
        <div className="absolute inset-0 dark:hidden" style={{ background: 'linear-gradient(to left, rgba(246,243,238,0.28) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 hidden dark:block" style={{ background: 'linear-gradient(to left, rgba(11,15,20,0.65) 0%, transparent 50%)' }} />
        
        {/* Dynamic Weather Ambient Vignette Overlay */}
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at right 30% top 30%, ${
              weatherData.climate === 'sunny' ? 'rgba(255, 106, 77, 0.05)' :
              weatherData.climate === 'rainy' ? 'rgba(255, 159, 67, 0.04)' :
              weatherData.climate === 'starry' ? 'rgba(255, 190, 118, 0.05)' :
              weatherData.climate === 'snowy' ? 'rgba(255, 250, 240, 0.04)' :
              weatherData.climate === 'stormy' ? 'rgba(255, 106, 77, 0.04)' :
              'rgba(255, 106, 77, 0.04)'
            } 0%, transparent 60%)`
          }}
        />

        {/* Bottom fade into page background (MUST BE LAST to mask all layers seamlessly) */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg-primary) 98%, var(--bg-primary) 100%)' }} />
      </motion.div>

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
              {/* Spacing spacer to replace the weather capsule block and keep typography clean */}
              <div className="h-6" />

              {/* Nunito Bold Hero Headline */}
              <motion.div style={{ x: driftX2, y: driftY2, scale: driftScale2, opacity: driftOpacity2, rotate: driftRot2, rotateY: driftRotY2, perspective: 1000 }}>
                <motion.h1 
                  variants={headlineRevealVariant}
                  initial="hidden"
                  animate={isPageReady ? "visible" : "hidden"}
                  className="hero-headline select-none"
                >
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
                    <span 
                      className="relative inline-flex items-center justify-center cursor-pointer select-none"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      style={{ display: 'inline-flex' }}
                    >
                      {/* Steam Release Particles */}
                      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
                        {steamParticles.map((sp) => (
                          <motion.div
                            key={sp.id}
                            className="absolute"
                            style={{
                              left: `calc(50% + ${sp.x}px)`,
                              top: `calc(50% + ${sp.y}px)`,
                            }}
                            initial={{ opacity: 0, y: 0, scale: 0.6, filter: 'blur(0.5px)' }}
                            animate={{
                              opacity: [0, 0.45, 0],
                              y: -45 - Math.random() * 35,
                              x: (Math.random() - 0.5) * 20,
                              scale: [0.6, 1.4, 2.2],
                            }}
                            transition={{
                              duration: 2.2,
                              delay: sp.delay,
                              ease: "easeOut",
                            }}
                          >
                            <svg width="15" height="30" viewBox="0 0 15 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path 
                                d="M 7,30 Q 12,20 2,15 T 7,0" 
                                stroke="currentColor" 
                                strokeWidth="3.5" 
                                fill="none" 
                                strokeLinecap="round"
                                className="text-[var(--text-secondary)] opacity-50 dark:text-white dark:opacity-30"
                              />
                            </svg>
                          </motion.div>
                        ))}
                      </div>

                      {/* Static text, fully visible and styled */}
                      <span>
                        Like Never Before
                      </span>
                    </span>
                  </span>
                </motion.h1>
              </motion.div>

              <motion.div style={{ x: driftX3, y: driftY3, scale: driftScale3, opacity: driftOpacity3, rotate: driftRot3, rotateY: driftRotY3, perspective: 1000 }}>
                <motion.p 
                  variants={descRevealVariant}
                  initial="hidden"
                  animate={isPageReady ? "visible" : "hidden"}
                  className="text-[19px] text-[var(--text-secondary)] mb-4 max-w-[560px] font-light leading-[1.65]"
                >
                  Discover. Savor. Indulge. Immerse your senses in cinema-grade, chef-curated recipe Reels. Order breathtaking culinary masterpieces instantly, and track every dining detail from kitchen to table.
                </motion.p>
              </motion.div>

              {/* Large Glass Search Panel */}
              <motion.div style={{ x: driftX4, y: driftY4, scale: driftScale4, opacity: driftOpacity4, rotate: driftRot4, rotateY: driftRotY4, perspective: 1000 }}>
                <motion.form 
                  variants={searchRevealVariant}
                  initial="hidden"
                  animate={isPageReady ? "visible" : "hidden"}
                  onMouseEnter={() => setSearchHovered(true)}
                  onMouseLeave={() => setSearchHovered(false)}
                  onSubmit={handleSearchSubmit} 
                  className="flex gap-3.5 max-w-[520px] relative z-10"
                >
                  <div className="relative flex-1">
                    <Search 
                      size={20} 
                      className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-20" 
                    />
                    <input 
                      type="text" 
                      className="glass-input !pl-[50px] !pr-[48px] rounded-[20px] h-[56px] text-[15px] relative z-10 bg-transparent" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                    />
                    
                    {/* Premium Animated Placeholder Overlay */}
                    {!searchQuery && (
                      <div className="absolute left-[50px] right-[48px] top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none select-none z-10 h-6 flex items-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={searchHovered || searchFocused ? 'weather' : 'food'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 0.75, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.20, ease: "easeInOut" }}
                            className="text-[var(--text-secondary)] text-[14px] whitespace-nowrap w-full"
                          >
                            {!(searchHovered || searchFocused) ? (
                              <motion.span
                                animate={{ x: [0, -50, 0] }}
                                transition={{ 
                                  repeat: Infinity, 
                                  repeatType: "reverse", 
                                  duration: 7, 
                                  ease: "easeInOut",
                                  delay: 1.5
                                }}
                                className="inline-block"
                              >
                                {getSearchPlaceholder()}
                              </motion.span>
                            ) : (
                              <span className="text-primary/95 font-medium tracking-wide">
                                {`Today: ${weatherData.climate ? weatherData.climate.charAt(0).toUpperCase() + weatherData.climate.slice(1) : 'Sunny'} • ${weatherData.temp || '74°F'} — Search your craving...`}
                              </span>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}
                    
                    {/* Subtle Search Bar Weather Animation Layer */}
                    {!weatherData.loading && (
                      <SearchBarWeatherAnimation 
                        climate={weatherData.climate} 
                        isVisible={!searchFocused && !searchHovered} 
                      />
                    )}
                    
                    {/* Clean Inline Weather HUD SVG (Display Only) */}
                    {!weatherData.loading && (
                      <div 
                        className={`absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-20 text-primary transition-all duration-300 ease-out ${
                          (!searchFocused && !searchHovered) ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
                        }`}
                      >
                        {renderWeatherIcon(weatherData.climate)}
                      </div>
                    )}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <AnimatePresence>
                        {searchQuery && (
                          <motion.button
                            type="button"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                            onClick={() => setSearchQuery("")}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <X size={16} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-[20px] px-8 h-[56px] font-bold"
                  >
                    Search
                  </button>
                </motion.form>
              </motion.div>

              {/* CTA Option Buttons */}
              <motion.div style={{ x: driftX5, y: driftY5, scale: driftScale5, opacity: driftOpacity5, rotate: driftRot5, rotateY: driftRotY5, perspective: 1000 }}>
                <motion.div 
                  variants={ctaRevealVariant}
                  initial="hidden"
                  animate={isPageReady ? "visible" : "hidden"}
                  className="flex gap-3 mt-3 items-center"
                >
                  <button 
                    onClick={() => navigate('/discover')}
                    className="btn btn-primary px-[26px] py-3 text-[14px] rounded-[16px] flex items-center gap-2"
                  >
                    <Compass size={16} />
                    Explore Food
                  </button>
                  <motion.button 
                    onClick={() => navigate('/reels')}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    initial="rest"
                    className="btn btn-secondary px-[26px] py-3 text-[14px] rounded-[16px] flex items-center gap-2 border-[1.5px] border-[var(--border-light)] relative overflow-hidden group transition-shadow duration-300"
                  >
                    {/* Premium Shimmer Line */}
                    <motion.div
                      className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -skew-x-12 pointer-events-none"
                      variants={{
                        hover: {
                          left: "150%",
                          transition: { duration: 0.85, ease: "easeInOut" }
                        }
                      }}
                    />
                    
                    {/* Animated Play Icon */}
                    <motion.span
                      variants={{
                        rest: { scale: 1, rotate: 0 },
                        hover: { 
                          scale: [1, 1.28, 1.15],
                          rotate: [0, -10, 15, 0],
                          transition: { duration: 0.55, ease: "easeOut" }
                        }
                      }}
                      className="flex items-center justify-center text-primary dark:text-[#FF8A72]"
                    >
                      <Play size={16} fill="currentColor" />
                    </motion.span>
                    
                    <span className="relative z-10">Watch Reels</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Mascot Column */}
          <AnimatePresence>
            {showChef && (
              <motion.div
                key="mascot-chef-container"
                variants={mascotRevealVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative z-20 flex flex-col items-center justify-end md:-ml-[37%]"
              >
                <motion.div style={{ x: chefX }} className="flex flex-col items-center justify-end relative w-full h-full">
                  <motion.div
                    className="relative"
                    animate={{ 
                      x: mouseOffset.x * 14,
                      y: mouseOffset.y * 10
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 14 }}
                  >
                    {/* Floating Close Button positioned beautifully relative to the chat/character */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowChef(false);
                        soundController.playClick();
                      }}
                      className="absolute -top-4 -right-12 z-50 bg-[#1A1A1A]/80 hover:bg-[#2A2A2A] hover:border-white/30 text-white rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl hover:scale-105 active:scale-95 transition-all pointer-events-auto cursor-pointer"
                      title="Hide Chef"
                    >
                      <X size={15} className="text-white/90" />
                    </button>

                    <MascotChef forceSmile={forceChefSmile} />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SAVORÉ EDITORIAL PILLARS */}
        <div className="mt-4 mb-24 w-full max-w-[1200px] mx-auto px-6 relative z-10">
          {/* ── "Why Savoré" Section Header ── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.06,
                  delayChildren: 0.02,
                }
              }
            }}
            className="mb-10 text-left cursor-default group w-fit"
          >
            <motion.span 
              variants={{
                hidden: { opacity: 0, x: -12 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-medium block transition-all duration-500 group-hover:tracking-[0.35em] group-hover:text-[var(--text-primary)] dark:group-hover:text-white"
            >
              The Standard
            </motion.span>
            <motion.h2 
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-[36px] md:text-[48px] font-light tracking-[-0.02em] mt-2 leading-[1.1] transition-all duration-500" 
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Why <span className="italic text-[var(--primary)] transition-all duration-500 inline-block group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(244,117,96,0.4)]">Savoré</span>
            </motion.h2>
            <motion.div 
              variants={{
                hidden: { scaleX: 0 },
                visible: { scaleX: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
              }}
              style={{ originX: 0 }}
              className="mt-5 h-px w-[80px] bg-gradient-to-r from-[var(--primary)]/60 to-transparent transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-[140px] group-hover:from-[var(--primary)]"
            />
          </motion.div>

          {/* ── Film Strip Accordion ── */}
          <motion.div 
            variants={categoriesRevealVariant}
            initial="hidden"
            animate={isPageReady ? "visible" : "hidden"}
            ref={pillarsRef}
            className="relative w-full h-[600px] md:h-[500px] border-y border-[var(--border-light)]/25"
          >
            {/* 🎬 Sliding Focus Indicator */}
            <div 
              className="focus-indicator pointer-events-none z-20"
              style={{
                opacity: hoveredPillar === null ? 0 : 1,
                '--desktop-left': hoveredPillar === null ? '0%' : `${20 * hoveredPillar}%`,
                '--desktop-width': hoveredPillar === null ? `${100 / 3}%` : '60%',
                '--mobile-top': hoveredPillar === null ? '0%' : `${20 * hoveredPillar}%`,
                '--mobile-height': hoveredPillar === null ? `${100 / 3}%` : '60%',
              }}
            >
              {/* Desktop vertical bleeding extensions */}
              <div className="hidden md:block indicator-line-v bottom-full left-0 h-[80px]" style={{ '--line-dir': 'to top' }} />
              <div className="hidden md:block indicator-line-v top-full left-0 h-[80px]" style={{ '--line-dir': 'to bottom' }} />
              <div className="hidden md:block indicator-line-v bottom-full right-0 h-[80px]" style={{ '--line-dir': 'to top' }} />
              <div className="hidden md:block indicator-line-v top-full right-0 h-[80px]" style={{ '--line-dir': 'to bottom' }} />

              {/* Mobile horizontal bleeding extensions */}
              <div className="block md:hidden indicator-line-h right-full top-0 w-[60px]" style={{ '--line-dir': 'to left' }} />
              <div className="block md:hidden indicator-line-h left-full top-0 w-[60px]" style={{ '--line-dir': 'to right' }} />
              <div className="block md:hidden indicator-line-h right-full bottom-0 w-[60px]" style={{ '--line-dir': 'to left' }} />
              <div className="block md:hidden indicator-line-h left-full bottom-0 w-[60px]" style={{ '--line-dir': 'to right' }} />
            </div>

            {/* Accordion Panels */}
            {PILLARS_DATA.map((pillar, index) => (
              <motion.div
                key={index}
                onMouseEnter={() => setHoveredPillar(index)}
                onMouseLeave={() => setHoveredPillar(null)}
                style={{ 
                  y: index === 0 ? col1YSpring : index === 1 ? col2YSpring : col3YSpring, 
                  rotate: index === 0 ? col1RotateSpring : index === 1 ? col2RotateSpring : col3RotateSpring, 
                  opacity: colOpacity,
                  '--desktop-left': hoveredPillar === null 
                    ? `${(100 / 3) * index}%` 
                    : `${(index <= hoveredPillar ? 20 * index : 20 * (index - 1) + 60)}%`,
                  '--desktop-width': hoveredPillar === null 
                    ? `${100 / 3}%` 
                    : `${(hoveredPillar === index ? 60 : 20)}%`,
                  '--mobile-top': hoveredPillar === null 
                    ? `${(100 / 3) * index}%` 
                    : `${(index <= hoveredPillar ? 20 * index : 20 * (index - 1) + 60)}%`,
                  '--mobile-height': hoveredPillar === null 
                    ? `${100 / 3}%` 
                    : `${(hoveredPillar === index ? 60 : 20)}%`,
                }}
                className={`pillar-panel flex flex-col justify-end p-8 text-left cursor-pointer overflow-hidden group relative z-10 ${
                  hoveredPillar !== null && hoveredPillar !== index ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* 🖼️ Cinematic Image Background */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={pillar.image} 
                    alt={pillar.title}
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-[1200px] object-cover [transition:transform_0.65s_cubic-bezier(0.16,1,0.3,1),_filter_0.65s_cubic-bezier(0.16,1,0.3,1)] filter grayscale-[30%] brightness-[40%] group-hover:grayscale-0 group-hover:brightness-[80%] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10 [transition:background_0.65s_cubic-bezier(0.16,1,0.3,1)] group-hover:from-black/85 group-hover:via-black/25" />
                  <div className="noise-overlay z-20" />
                </div>

                {/* 📝 Content Overlay */}
                <div className="relative z-30 flex flex-col h-full justify-between">
                  <div>
                    <span className="text-[40px] md:text-[48px] font-extralight tracking-tighter text-white/50 font-serif block leading-none transition-colors duration-500 group-hover:text-[var(--primary)]">
                      {pillar.num}
                    </span>
                  </div>
                  
                  <div className="mt-auto max-w-[280px]">
                    <h3 className="text-[18px] md:text-[20px] font-medium tracking-[0.05em] uppercase text-white shrink-0 whitespace-nowrap">
                      {pillar.title}
                    </h3>
                    <div 
                      className="[transition:opacity_0.65s_cubic-bezier(0.16,1,0.3,1),_max-height_0.65s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                      style={{
                        opacity: hoveredPillar === index || hoveredPillar === null ? 1 : 0,
                        maxHeight: hoveredPillar === index || hoveredPillar === null ? "160px" : "0px",
                        pointerEvents: hoveredPillar === index || hoveredPillar === null ? "auto" : "none"
                      }}
                    >
                      <p className="text-[13px] md:text-[14px] text-gray-300 leading-relaxed font-light mt-3">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Film grain separator (not on last panel) */}
                {index < PILLARS_DATA.length - 1 && <div className="film-grain-separator" />}
              </motion.div>
            ))}
          </motion.div>
        </div>

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
                variants={batchContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[30px]"
              >
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="glass-primary skeleton-box h-[320px] opacity-40" />
                  ))
                ) : restaurants.length > 0 ? (
                  restaurants.slice(activeBatchIndex * 3, (activeBatchIndex + 1) * 3).map((rest) => {
                    const isOwnRest = isAuthenticated && user && (rest.owner === user._id || rest.owner?._id === user._id);
                    return (
                      <motion.div 
                        key={rest._id} 
                        variants={batchCardVariants}
                        whileHover={{ y: -8 }}
                        onClick={() => navigate(`/restaurant/${rest._id}`)}
                        className="glass-card p-0 overflow-hidden cursor-pointer rounded-[28px] border border-[var(--border-light)] group h-full flex flex-col"
                      >
                        <div className="noise-overlay" />
                        
                        {/* Cover Image with soft zoom capability */}
                        <div className="w-full aspect-[16/10] relative overflow-hidden rounded-t-[inherit]">
                          {isOwnRest && (
                            <div className="absolute top-3.5 left-3.5 bg-[#d9a752] text-white rounded-[12px] py-[4px] px-[10px] flex items-center gap-1 shadow-lg z-10 text-[10px] font-extrabold uppercase tracking-wider">
                              <ShieldCheck size={11} />
                              My Kitchen
                            </div>
                          )}
                          <SafeImage 
                            src={resolveMediaUrl(rest.coverImage)} 
                            alt={rest.name} 
                            className="w-full h-full transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                          />
                        </div>

                      {/* Meta details */}
                      <div className="p-[26px] text-left flex-grow flex flex-col">
                        <div className="flex justify-between items-baseline mb-2 gap-2">
                          <h3 className="text-[20px] font-normal tracking-tight transition-colors duration-500 group-hover:text-[var(--primary)]">{rest.name}</h3>
                          <div className="flex items-center gap-1 text-[var(--accent)] font-semibold text-[13px] shrink-0">
                            <Star 
                              size={13} 
                              fill="#ffc83b" 
                              stroke="#ffc83b" 
                              className="transition-transform duration-500 ease-apple group-hover:scale-120 group-hover:rotate-[15deg]"
                            />
                            <span className="text-[13px] font-bold text-[var(--text-primary)]">{rest.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <p className="text-[14px] text-[var(--text-secondary)] mb-4 line-clamp-2 leading-[1.5]">
                          {rest.description}
                        </p>
                        
                        {/* Cuisines Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                          {rest.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] uppercase tracking-[0.05em] font-medium text-[var(--text-secondary)] bg-[var(--surface-bright)] border border-[var(--border-light)] px-2.5 py-[5px] rounded-[6px]">
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between border-t border-[var(--border-light)] pt-[18px] text-[13px] text-[var(--text-muted)] font-medium tracking-wide">
                          {isRestaurantOutOfRange(rest) ? (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 py-0.5 px-2 rounded-md text-[10px] uppercase tracking-wide font-extrabold">
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
                    );
                  })
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
      {createPortal(
        <AnimatePresence>
          {locationModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-[1000] p-6 select-none">
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
                  <div className="grid grid-cols-4 gap-2">
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
                          className={`h-[52px] rounded-xl text-[11px] font-bold border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white/[0.02] border-white/5 text-text-secondary hover:text-text-primary hover:bg-white/[0.06]'
                          }`}
                        >
                          <span>{city}</span>
                          <span className={`text-[8px] font-normal tracking-wide ${isSelected ? 'text-white/60' : 'text-text-muted/65'}`}>
                            {getCityCoordsLabel(city)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-8" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Floating Location Selector FAB */}
      <AnimatePresence>
        {showFloatingLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-[90] pointer-events-auto"
          >
            <div
              onMouseEnter={() => setIsPillHovered(true)}
              onMouseLeave={() => setIsPillHovered(false)}
              className="relative w-[210px] h-12 flex items-center justify-end select-none"
            >
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="relative flex items-center justify-start rounded-full bg-surface-bright/85 backdrop-blur-md border border-[var(--border-light)] text-[12.5px] font-bold text-text-primary shadow-2xl hover:border-primary/45 select-none group cursor-pointer h-12 pl-[16.5px] transition-[width,transform,background-color,border-color] duration-220 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98] will-change-[width,transform]"
                style={{
                  width: isPillHovered ? '200px' : '48px',
                }}
              >
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <MapPin size={15} className="text-primary z-10 animate-pulse" />
                  <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-sm scale-75 group-hover:scale-110 transition-transform" />
                </div>
                
                <div
                  className="absolute left-11 flex items-center justify-between whitespace-nowrap overflow-hidden pointer-events-none transition-opacity duration-220 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[opacity]"
                  style={{
                    width: '144px',
                    opacity: isPillHovered ? 1 : 0,
                  }}
                >
                  <div className="flex flex-col items-start leading-tight pr-1 flex-shrink-0">
                    <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">Delivering to</span>
                    <span className="text-[12px] font-bold text-text-primary capitalize group-hover:text-primary transition-colors max-w-[120px] truncate">
                      {activeLocality || activeCity || 'Select Location'}
                    </span>
                  </div>
                  <ChevronUp size={12} className="text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Let Chef Savoré Cook" FAB */}
      <AnimatePresence>
        {!showChef && !isPastScrollThreshold && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-[90] pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => {
                if (isCookingClicked) return;
                setIsCookingClicked(true);
                soundController.playSizzle();

                // Generate 16 flame burst particles around the border
                const particles = Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
                  // Distribute from the borders of the expanded pill
                  const radiusX = Math.cos(angle) * (60 + Math.random() * 80);
                  const radiusY = Math.sin(angle) * (30 + Math.random() * 40);
                  return {
                    id: Math.random() + i,
                    x: radiusX,
                    y: radiusY,
                    scale: 0.4 + Math.random() * 0.8,
                    delay: Math.random() * 0.08,
                  };
                });
                setFlameParticles(particles);

                setTimeout(() => {
                  soundController.playWhoosh();
                }, 280);

                setTimeout(() => {
                  setShowChef(true);
                  setIsCookingClicked(false);
                  setFlameParticles([]);
                }, 600);
              }}
              className={`relative overflow-hidden flex items-center justify-start rounded-full bg-surface/75 dark:bg-surface-bright/70 backdrop-blur-md border border-[var(--border-light)] hover:border-primary/50 text-text-primary shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] h-12 px-3.5 hover:scale-[1.03] hover:-translate-y-[1px] active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1.15)] cursor-pointer group select-none ${isCookingClicked ? 'w-[226px]' : 'w-12 hover:w-[226px]'}`}
            >
              {/* Particle Flame Burst elements */}
              {flameParticles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y - 25, // Float upwards slightly
                    scale: [0.8 * p.scale, 1.4 * p.scale, 0],
                    opacity: [1, 0.9, 0],
                    rotate: [0, 120 * (Math.random() > 0.5 ? 1 : -1)]
                  }}
                  transition={{
                    duration: 0.58,
                    ease: "easeOut",
                    delay: p.delay,
                  }}
                  className="absolute top-1/2 left-6 w-3 h-3 bg-gradient-to-t from-primary via-[#FF7B62] to-[#FFD066] rounded-full blur-[0.8px] pointer-events-none z-[100]"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 70%, 75% 100%, 25% 100%, 0% 70%)"
                  }}
                />
              ))}

              {/* Radial gradient glow behind the icon */}
              <div className="absolute top-1/2 left-6 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary/20 rounded-full blur-md opacity-70 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

              {/* Icon slot (stays centered when collapsed) */}
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 z-10 pointer-events-none">
                <Flame size={15} className={`text-primary fill-primary/10 transition-transform duration-300 ${isCookingClicked ? 'scale-125 animate-ping' : 'animate-pulse group-hover:scale-110'}`} />
              </div>

              {/* Sliding glass sheen reflection on hover */}
              <div className="absolute inset-0 w-[40%] h-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/15 to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[350%] transition-transform duration-[1100ms] ease-in-out pointer-events-none" />

              {/* Hidden text container that expands and fades in on hover */}
              <div className={`flex items-center whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1.15)] pointer-events-none ${isCookingClicked ? 'opacity-100 w-[162px] ml-3' : 'opacity-0 group-hover:opacity-100 w-0 group-hover:w-[162px] ml-0 group-hover:ml-3'}`}>
                <span className="font-bold tracking-[0.05em] text-[11.5px] uppercase text-text-primary group-hover:text-primary transition-colors">
                  Let Chef Savoré Cook!
                </span>
                <ChevronRight size={13} className="ml-1 text-primary opacity-80" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
