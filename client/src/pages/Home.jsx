import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, animate } from 'framer-motion';
import { Search, Flame, Sparkles, Film, Navigation, Clock, Star, Play, Compass, MapPin, ChevronDown, X, Home as HomeIcon, Briefcase, Building, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import MascotChef from '../components/MascotChef';
import api from '../utils/api';
import { formatPrice } from '../utils/priceFormatter';
import { resolveMediaUrl } from '../utils/mediaResolver';
import SafeImage from '../components/SafeImage';
import { useChefMood } from '../components/ChefSystem/ChefMoodEngine';
import { soundController } from '../components/ChefSystem/SoundController';
import { LocationContext, CITIES, CITY_LOCALITIES, CITY_COORDINATES } from '../context/LocationContext';
import { ThemeContext } from '../context/ThemeContext';

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

// Dark mode hero pool — rotates randomly between these four
const DARK_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80", // moody artisanal pizza
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80", // vibrant editorial food spread
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80", // grilled steak & asparagus, dark background
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1600&q=80", // moody rustic Italian pasta
];

// Light mode hero pool — rotates randomly between these four
const LIGHT_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=1600&q=80", // minimalist gourmet pasta, clean white plate
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1600&q=80", // al-fresco brunch spread
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80", // vibrant gourmet salad platter
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1600&q=80", // French toast with berries, golden morning light
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

  const { setBubbleText, setCurrentMood, setCommentType } = useChefMood();

  // 🧑‍🍳 Scroll-Driven Hero Folding & Chef Smile Animation
  const { scrollY } = useScroll();
  const smoothScrollY = useMotionValue(scrollY.get());

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScrollYChange = (latest) => {
      const isScrollingUp = latest < lastScrollY;
      lastScrollY = latest;

      if (latest <= 5) {
        smoothScrollY.set(0);
      } else if (isScrollingUp) {
        animate(smoothScrollY, latest, {
          type: "spring",
          stiffness: 350,
          damping: 30,
          mass: 0.1
        });
      } else {
        animate(smoothScrollY, latest, {
          type: "spring",
          stiffness: 100,
          damping: 24,
          mass: 1.0
        });
      }
    };

    const unsubscribe = scrollY.on ? scrollY.on("change", handleScrollYChange) : scrollY.onChange(handleScrollYChange);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else if (unsubscribe && typeof unsubscribe.stop === 'function') {
        unsubscribe.stop();
      }
    };
  }, [scrollY, smoothScrollY]);
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

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 15 && currentScroll < 850) {
        setForceChefSmile(true);
      } else {
        setForceChefSmile(false);
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setForceChefSmile(false);
      }, 400); // Soft, natural reset 400ms after scroll events stop
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

  // Hero background random image index (0-3) — switches every 9s
  const [heroImgIdx, setHeroImgIdx] = useState(() => Math.floor(Math.random() * DARK_HERO_IMAGES.length));
  const [isBoxHovered, setIsBoxHovered] = useState(false);
  const [steamParticles, setSteamParticles] = useState([]);
  const lastBoxHoveredRef = useRef(false);

  const playSizzleSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
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
    setIsBoxHovered((prev) => !prev);
    playSizzleSound();
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

  // Hero background image rotator — cycles through available images every 9s
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImgIdx((prev) => (prev + 1) % DARK_HERO_IMAGES.length);
    }, 9000);
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
      <motion.div 
        variants={bgRevealVariant}
        initial="hidden"
        animate={isPageReady ? "visible" : "hidden"}
        className="absolute top-0 left-0 right-0 h-[680px] overflow-hidden z-0 pointer-events-none"
      >
        {/* ── DARK pool: images always mounted, opacity 0 when not active ── */}
        {DARK_HERO_IMAGES.map((imgSrc, idx) => (
          <motion.img
            key={`dark-hero-${idx}`}
            src={imgSrc}
            alt="" aria-hidden="true"
            animate={{ opacity: isDark && heroImgIdx === idx ? 0.40 : 0 }}
            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.7] select-none pointer-events-none"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ))}

        {/* ── LIGHT pool: images always mounted, opacity 0 when not active ── */}
        {LIGHT_HERO_IMAGES.map((imgSrc, idx) => (
          <motion.img
            key={`light-hero-${idx}`}
            src={imgSrc}
            alt="" aria-hidden="true"
            animate={{ opacity: !isDark && heroImgIdx === idx ? 0.58 : 0 }}
            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 w-full h-full object-cover object-[center_35%] brightness-[1.0] saturate-[1.06] select-none pointer-events-none"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ))}
        {/* Left-side readability fade so text column stays crisp */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,_var(--bg-primary)_18%,_transparent_58%)]" />
        {/* Right-side soft edge — lighter in light mode so image shows through more */}
        <div className="absolute inset-0 bg-[linear-gradient(to_left,_rgba(246,243,238,0.28)_0%,_transparent_50%)] dark:bg-[linear-gradient(to_left,_rgba(11,15,20,0.65)_0%,_transparent_50%)]" />
        {/* Bottom fade into page background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_transparent_40%,_var(--bg-primary)_90%)]" />
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
              {/* Weather & Location Concierge Live Capsule Section */}
              <motion.div style={{ x: driftX1, y: driftY1, scale: driftScale1, opacity: driftOpacity1, rotate: driftRot1, rotateY: driftRotY1, perspective: 1000 }}>
                <motion.div 
                  variants={conciergeRevealVariant}
                  initial="hidden"
                  animate={isPageReady ? "visible" : "hidden"}
                  className="flex flex-col items-start mb-6"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {/* Weather Concierge Live Capsule */}
                    <motion.div
                      whileHover={{ y: -2, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
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
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      onClick={() => setLocationModalOpen(true)}
                      className="weather-concierge-badge cursor-pointer inline-flex items-center gap-2 select-none transition-all !mb-0"
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
                </motion.div>
              </motion.div>

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
                      className="relative inline-flex items-center justify-center cursor-pointer"
                      onMouseEnter={handleMouseEnter}
                      style={{ display: 'inline-flex' }}
                    >
                      {/* Invisible spacer to maintain layout size and shape */}
                      <span className="opacity-0 pointer-events-none select-none">
                        Like Never Before
                      </span>

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

                      {/* 1. Box Back/Interior Layer */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                        <motion.div
                          style={{ width: 110, height: 95 }}
                          animate={isBoxHovered ? { opacity: 1, scale: 1.25, y: [0, -3, 0] } : { opacity: 0, scale: 0.5, y: 15 }}
                          transition={isBoxHovered ? {
                            y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                            opacity: { duration: 0.45 },
                            scale: { duration: 0.45 }
                          } : {
                            duration: 0.45,
                            ease: [0.34, 1.56, 0.64, 1]
                          }}
                        >
                          <svg className="w-full h-full" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="interiorGrad" x1="50" y1="40" x2="50" y2="74" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#1C0909" />
                                <stop offset="100%" stopColor="#351818" />
                              </linearGradient>
                            </defs>
                            {/* Shadow underlay */}
                            <rect x="20" y="44" width="60" height="36" rx="6" fill="rgba(0,0,0,0.22)" filter="blur(2px)" />
                            {/* Dark interior of the box */}
                            <rect x="21" y="40" width="58" height="34" rx="4" fill="url(#interiorGrad)" />
                            {/* Warm food glow radiating from inside */}
                            <ellipse cx="50" cy="57" rx="18" ry="10" fill="var(--primary)" opacity="0.4" filter="blur(3px)" />
                          </svg>
                        </motion.div>
                      </div>

                      {/* 2. The Animating Text */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
                        <motion.span
                          className="select-none pointer-events-none"
                          animate={isBoxHovered ? {
                            y: 20,
                            scale: 0.15,
                            opacity: 0,
                          } : {
                            y: 0,
                            scale: 1,
                            opacity: 1,
                          }}
                          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                        >
                          Like Never Before
                        </motion.span>
                      </div>

                      {/* 3. Box Front Face & Lids Layer */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
                        <motion.div
                          style={{ width: 110, height: 95 }}
                          animate={isBoxHovered ? { opacity: 1, scale: 1.25, y: [0, -3, 0] } : { opacity: 0, scale: 0.5, y: 15 }}
                          transition={isBoxHovered ? {
                            y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                            opacity: { duration: 0.45 },
                            scale: { duration: 0.45 }
                          } : {
                            duration: 0.45,
                            ease: [0.34, 1.56, 0.64, 1]
                          }}
                        >
                          <svg className="w-full h-full" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              {/* Box Front Face Gradient */}
                              <linearGradient id="boxFrontGrad" x1="50" y1="40" x2="50" y2="76" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="var(--primary)" />
                                <stop offset="100%" stopColor="var(--primary-pressed)" />
                              </linearGradient>
                              {/* Left Lid Flap Gradient */}
                              <linearGradient id="leftFlapGrad" x1="20" y1="34" x2="50" y2="40" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="var(--primary-hover)" />
                                <stop offset="100%" stopColor="var(--primary)" />
                              </linearGradient>
                              {/* Right Lid Flap Gradient */}
                              <linearGradient id="rightFlapGrad" x1="80" y1="34" x2="50" y2="40" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="var(--primary-hover)" />
                                <stop offset="100%" stopColor="var(--primary)" />
                              </linearGradient>
                              {/* Shiny Gloss Overlay */}
                              <linearGradient id="glossGrad" x1="20" y1="40" x2="80" y2="76" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                                <stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
                                <stop offset="50.1%" stopColor="rgba(255,255,255,0)" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                              </linearGradient>
                            </defs>

                            {/* Main Front Face */}
                            <rect x="20" y="40" width="60" height="36" rx="6" fill="url(#boxFrontGrad)" stroke="var(--primary-pressed)" strokeWidth="1.2" />
                            {/* Shiny Gloss Layer */}
                            <rect x="20" y="40" width="60" height="36" rx="6" fill="url(#glossGrad)" pointerEvents="none" />
                            
                            {/* Inner thin decorative border representing high-end packaging */}
                            <rect x="23" y="43" width="54" height="30" rx="4.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                            
                            {/* Subtle cardboard vertical grain lines */}
                            <g opacity="0.05">
                              <line x1="26" y1="43" x2="26" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="32" y1="43" x2="32" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="38" y1="43" x2="38" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="44" y1="43" x2="44" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="56" y1="43" x2="56" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="62" y1="43" x2="62" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="68" y1="43" x2="68" y2="73" stroke="#000" strokeWidth="0.8" />
                              <line x1="74" y1="43" x2="74" y2="73" stroke="#000" strokeWidth="0.8" />
                            </g>

                            {/* HOT & FRESH Premium sub-label */}
                            <text 
                              x="50" 
                              y="52" 
                              textAnchor="middle" 
                              fill="rgba(255,255,255,0.65)" 
                              fontSize="4.2" 
                              fontWeight="700" 
                              letterSpacing="0.18em"
                              fontFamily="sans-serif"
                            >
                              HOT & FRESH
                            </text>

                            {/* Printed savoré label (with shadow for depth) */}
                            <text 
                              x="50" 
                              y="62.5" 
                              textAnchor="middle" 
                              fill="rgba(0,0,0,0.18)" 
                              fontSize="9.5" 
                              fontWeight="900" 
                              letterSpacing="0.05em"
                              fontFamily="sans-serif"
                            >
                              savoré
                            </text>
                            <text 
                              x="50" 
                              y="62" 
                              textAnchor="middle" 
                              fill="#ffffff" 
                              fontSize="9.5" 
                              fontWeight="900" 
                              letterSpacing="0.05em"
                              fontFamily="sans-serif"
                            >
                              savoré
                            </text>

                            {/* Sleek handle cutout in center-bottom */}
                            <rect x="44" y="67" width="12" height="4" rx="2" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                            {/* Left Lid Flap */}
                            <motion.polygon 
                              points="20,40 50,40 48,34 22,34" 
                              fill="url(#leftFlapGrad)" 
                              stroke="var(--primary-pressed)" 
                              strokeWidth="0.8"
                              style={{ transformOrigin: "20px 40px" }}
                              animate={isBoxHovered ? {
                                rotate: [0, -120, -120, 0],
                              } : {
                                rotate: 0
                              }}
                              transition={isBoxHovered ? {
                                times: [0, 0.25, 0.75, 1],
                                duration: 1.2,
                                ease: "easeInOut"
                              } : {
                                duration: 0.3
                              }}
                            />

                            {/* Right Lid Flap */}
                            <motion.polygon 
                              points="80,40 50,40 52,34 78,34" 
                              fill="url(#rightFlapGrad)" 
                              stroke="var(--primary-pressed)" 
                              strokeWidth="0.8"
                              style={{ transformOrigin: "80px 40px" }}
                              animate={isBoxHovered ? {
                                rotate: [0, 120, 120, 0],
                              } : {
                                rotate: 0
                              }}
                              transition={isBoxHovered ? {
                                times: [0, 0.25, 0.75, 1],
                                duration: 1.2,
                                ease: "easeInOut"
                              } : {
                                duration: 0.3
                              }}
                            />
                          </svg>
                        </motion.div>
                      </div>
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
                  onSubmit={handleSearchSubmit} 
                  className="flex gap-3.5 max-w-[520px] relative z-10"
                >
                  <div className="relative flex-1">
                    <Search 
                      size={20} 
                      className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
                    />
                    <input 
                      type="text" 
                      className="glass-input !pl-[50px] !pr-[44px] rounded-[20px] h-[56px] text-[15px]" 
                      placeholder="Search premium truffles, sushi, steaks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                  <button 
                    onClick={() => navigate('/reels')}
                    className="btn btn-secondary px-[26px] py-3 text-[14px] rounded-[16px] flex items-center gap-2 border-[1.5px] border-[var(--border-light)]"
                  >
                    <Play size={16} fill="currentColor" />
                    Watch Reels
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Mascot Column */}
          <motion.div
            variants={mascotRevealVariant}
            initial="hidden"
            animate={isPageReady ? "visible" : "hidden"}
            className="relative z-20"
            style={{ x: chefX }}
          >
            <motion.div
              animate={{ 
                x: mouseOffset.x * 14,
                y: mouseOffset.y * 10
              }}
              transition={{ type: "spring", stiffness: 50, damping: 14 }}
            >
              <MascotChef forceSmile={forceChefSmile} />
            </motion.div>
          </motion.div>
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
              className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-medium block transition-all duration-500 group-hover:tracking-[0.35em] group-hover:text-white"
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
                    className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-[1200px] object-cover transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] filter grayscale-[30%] brightness-[40%] group-hover:grayscale-0 group-hover:brightness-[80%] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:from-black/85 group-hover:via-black/25" />
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
                      className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
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
                  restaurants.slice(activeBatchIndex * 3, (activeBatchIndex + 1) * 3).map((rest) => (
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
    </div>
  );
}
