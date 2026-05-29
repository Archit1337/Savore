import React, { createContext, useState } from 'react';
import api from '../utils/api';

export const ReelsContext = createContext();

// Reliable public domain food video URLs
// Using commondatastorage (Google's public bucket) + sample-videos.com which have proper CORS headers
const MOCK_REELS = [
  {
    _id: 'mock-reel-1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Perfecting the signature French Duck Breast with citrus orange glaze. 🍊 Crispy skin and tender, melt-in-your-mouth duck breast.',
    likes: ['user-1', 'user-2'],
    comments: [
      { _id: 'c1', user: { username: 'FoodieLover', profilePicture: '' }, text: 'This looks absolutely stunning!' },
      { _id: 'c2', user: { username: 'ParisianChef', profilePicture: '' }, text: 'Exquisite execution of the glaze.' }
    ],
    restaurant: 'mock-rest-1',
    restaurantDetails: {
      name: "L'Ambroisie",
      coverImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
    },
    featuredDish: {
      _id: 'mock-dish-1',
      name: 'Roasted Duck Breast',
      description: 'Crispy pan-seared duck breast drizzled with wild orange glaze.',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80',
      category: 'Mains'
    },
    fallbackDish: {
      _id: 'mock-dish-1',
      name: 'Roasted Duck Breast',
      description: 'Crispy pan-seared duck breast drizzled with wild orange glaze.',
      price: 45.0,
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=400&q=80',
      category: 'Mains'
    },
    fallbackRestaurant: {
      _id: 'mock-rest-1',
      name: "L'Ambroisie",
      coverImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    _id: 'mock-reel-2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    caption: 'Freshly torn basil leaves meeting a scorching stone-baked woodfired Margherita. Pure simplicity, zero compromises. 🍕🌿',
    likes: ['user-3'],
    comments: [
      { _id: 'c3', user: { username: 'PizzaNeapolitan', profilePicture: '' }, text: 'That dough puff is incredible!' }
    ],
    restaurant: 'mock-rest-8',
    restaurantDetails: {
      name: 'Truffle Burger House',
      coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    },
    featuredDish: {
      _id: 'mock-dish-2',
      name: 'Truffle Wagyu Burger',
      description: 'Savoir-faire wagyu beef burger layered with molten aged cheddar and truffle aioli.',
      price: 23.0,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      category: 'Burgers'
    },
    fallbackDish: {
      _id: 'mock-dish-2',
      name: 'Truffle Wagyu Burger',
      description: 'Savoir-faire wagyu beef burger layered with molten aged cheddar and truffle aioli.',
      price: 23.0,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      category: 'Burgers'
    },
    fallbackRestaurant: {
      _id: 'mock-rest-8',
      name: 'Truffle Burger House',
      coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    _id: 'mock-reel-3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    caption: 'Rolling the Signature Dragon Roll with sushi-grade Atlantic salmon, ripe avocado, and sweet unagi glaze. 🍣✨',
    likes: ['user-1', 'user-4', 'user-5'],
    comments: [
      { _id: 'c4', user: { username: 'SashimiQueen', profilePicture: '' }, text: 'Precision is outstanding.' }
    ],
    restaurant: 'mock-rest-3',
    restaurantDetails: {
      name: 'Sakura Sushi',
      coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
    },
    featuredDish: {
      _id: 'mock-dish-3',
      name: 'Signature Dragon Roll',
      description: 'Eel and cucumber inside, layered with avocado, spicy tuna, and unagi glaze.',
      price: 22.0,
      image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=400&q=80',
      category: 'Sushi'
    },
    fallbackDish: {
      _id: 'mock-dish-3',
      name: 'Signature Dragon Roll',
      description: 'Eel and cucumber inside, layered with avocado, spicy tuna, and unagi glaze.',
      price: 22.0,
      image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=400&q=80',
      category: 'Sushi'
    },
    fallbackRestaurant: {
      _id: 'mock-rest-3',
      name: 'Sakura Sushi',
      coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    _id: 'mock-reel-4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'A decadent stream of molten Valrhona hot chocolate meets our warm French chocolate soufflé. 🍫🫠',
    likes: ['user-2', 'user-3', 'user-6'],
    comments: [
      { _id: 'c5', user: { username: 'CocoaMaster', profilePicture: '' }, text: 'That chocolate gloss is perfect.' }
    ],
    restaurant: 'mock-rest-6',
    restaurantDetails: {
      name: 'Le Petit Chocolat',
      coverImage: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'
    },
    featuredDish: {
      _id: 'mock-dish-4',
      name: 'Valrhona Soufflé',
      description: 'Warm 70% dark chocolate souffle with organic cocoa butter.',
      price: 16.0,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      category: 'Warm Cakes'
    },
    fallbackDish: {
      _id: 'mock-dish-4',
      name: 'Valrhona Soufflé',
      description: 'Warm 70% dark chocolate souffle with organic cocoa butter.',
      price: 16.0,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      category: 'Warm Cakes'
    },
    fallbackRestaurant: {
      _id: 'mock-rest-6',
      name: 'Le Petit Chocolat',
      coverImage: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'
    }
  },
  {
    _id: 'mock-reel-5',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    caption: 'Slicing our signature 45-day Dry-Aged Ribeye. Tender, juicy, charred over open flames with sea salt crystals. 🥩🔥',
    likes: ['user-1', 'user-6', 'user-7'],
    comments: [
      { _id: 'c6', user: { username: 'CarnivoreDiet', profilePicture: '' }, text: 'Perfect medium rare blush.' }
    ],
    restaurant: 'mock-rest-4',
    restaurantDetails: {
      name: 'Asador Steakhouse',
      coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    },
    featuredDish: {
      _id: 'mock-dish-5',
      name: 'Dry-Aged Ribeye',
      description: 'A 400g ribeye steak aged 45 days, seared over open flames with sea salt crystals.',
      price: 55.0,
      image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
      category: 'Steaks'
    },
    fallbackDish: {
      _id: 'mock-dish-5',
      name: 'Dry-Aged Ribeye',
      description: 'A 400g ribeye steak aged 45 days, seared over open flames with sea salt crystals.',
      price: 55.0,
      image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
      category: 'Steaks'
    },
    fallbackRestaurant: {
      _id: 'mock-rest-4',
      name: 'Asador Steakhouse',
      coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    }
  }
];

const EMPTY_FEED = { reels: [], page: 1, totalPages: 1 };

// Helper to extract the base Mongoose/Mock ID of a reel, scrubbing virtual loop tags
const getBaseReelId = (id) => {
  if (!id) return '';
  return id.split('-loop')[0].split('-inflated')[0];
};

// Helper to auto-inflate small catalogs up to a virtual minimum of 15 elements to prevent swiping dead-locks
const inflateFeedIfNeeded = (feedArray) => {
  if (!feedArray || feedArray.length === 0) return [];
  if (feedArray.length >= 5) return feedArray;

  let inflated = [...feedArray];
  let loopCount = 0;
  while (inflated.length < 15 && loopCount < 5) {
    const loopPrefix = `loop-inflated-${Date.now()}-${loopCount}-${Math.random()}`;
    const duplicated = feedArray.map((r, i) => ({
      ...r,
      _id: `${getBaseReelId(r._id)}-loop-inflated-${loopPrefix}-${i}`
    }));
    inflated = [...inflated, ...duplicated];
    loopCount++;
  }
  return inflated;
};

export const ReelsProvider = ({ children }) => {
  const [reels, rawSetReelsState] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Intercept state updates to automatically apply virtual auto-inflation
  const setReelsState = (newVal) => {
    rawSetReelsState((prev) => {
      const nextVal = typeof newVal === 'function' ? newVal(prev) : newVal;
      return inflateFeedIfNeeded(nextVal);
    });
  };

  // Derived / Stub States for backwards compatibility
  const [currentFeedKey, setCurrentFeedKey] = useState('global');
  const feeds = {
    global: { reels, page, totalPages },
    [currentFeedKey]: { reels, page, totalPages }
  };

  const preloadRegionFeed = async (city) => {
    // Ignored in universal discovery feed mode
  };

  // Stable setReels implementation
  const setReels = (newReels) => {
    setReelsState(newReels);
  };

  // Fetch Reels Feed (Universal discovery experience, ignoring city filtering)
  const fetchReelsFeed = async (reset = false, city = '', silent = false) => {
    if (loading) return;

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      let nextPage = reset ? 1 : page;
      let isLooping = false;

      if (!reset && nextPage > totalPages) {
        nextPage = 1; // Wrap around to page 1 to enable infinite feed
        isLooping = true;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('page', nextPage);
      queryParams.append('limit', 5);

      const res = await api.get(`/reels?${queryParams.toString()}`);
      
      if (res.data) {
        const newReels = res.data.data;
        if (newReels && newReels.length > 0) {
          let updatedReels;
          if (reset) {
            updatedReels = newReels;
          } else {
            const prevReels = reels;
            if (isLooping) {
              // Suffix IDs during looping to ensure perfect React key uniqueness
              const mappedNewReels = newReels.map((r, i) => ({
                ...r,
                _id: `${getBaseReelId(r._id)}-loop-${Date.now()}-${i}-${Math.random()}`
              }));
              updatedReels = [...prevReels, ...mappedNewReels];
            } else {
              const existingIds = prevReels.map((r) => getBaseReelId(r._id));
              const filteredNew = newReels.filter((r) => !existingIds.includes(getBaseReelId(r._id)));
              updatedReels = [...prevReels, ...filteredNew];
            }
          }

          setReelsState(updatedReels);
          setPage(reset ? 2 : nextPage + 1);
          setTotalPages(res.data.totalPages || 1);
          return;
        }
      }
      // Empty data fallback
      if (reset || !reels || reels.length === 0) {
        setReelsState(MOCK_REELS);
        setPage(1);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('API error fetching reels, falling back to client mock data:', err.message);
      if (reset || !reels || reels.length === 0) {
        setReelsState(MOCK_REELS);
        setPage(1);
        setTotalPages(1);
      } else {
        setError(err.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const toggleLikeReel = async (reelId, userId) => {
    const previousReels = reels;
    const cleanId = getBaseReelId(reelId);

    // Optimistically toggle like locally across ALL virtual duplicates
    if (userId) {
      rawSetReelsState((prev) => 
        prev.map((r) => {
          if (getBaseReelId(r._id) === cleanId) {
            const alreadyLiked = (r.likes || []).includes(userId);
            const updatedLikes = alreadyLiked
              ? (r.likes || []).filter((id) => id.toString() !== userId)
              : [...(r.likes || []), userId];
            return { ...r, likes: updatedLikes };
          }
          return r;
        })
      );
    }

    try {
      const res = await api.post(`/reels/${cleanId}/like`);
      if (res.data && res.data.success) {
        const { likes } = res.data;
        rawSetReelsState((prev) => 
          prev.map((r) => (getBaseReelId(r._id) === cleanId ? { ...r, likes } : r))
        );
        return res.data.isLiked;
      }
    } catch (err) {
      console.error('Failed to toggle like on reel, rolling back:', err.message);
      rawSetReelsState(previousReels);
    }
  };

  const commentOnReel = async (reelId, commentText) => {
    const cleanId = getBaseReelId(reelId);
    try {
      const res = await api.post(`/reels/${cleanId}/comments`, { text: commentText });
      if (res.data && res.data.success) {
        const newComment = res.data.data;
        rawSetReelsState((prev) =>
          prev.map((r) =>
            getBaseReelId(r._id) === cleanId
              ? { ...r, comments: [...(r.comments || []), newComment] }
              : r
          )
        );
        return newComment;
      }
    } catch (err) {
      console.error('Failed to add comment:', err.message);
      throw err;
    }
  };

  const logReelView = async (reelId) => {
    const cleanId = getBaseReelId(reelId);
    try {
      await api.post(`/reels/${cleanId}/view`);
    } catch (err) {
      console.warn('Silent analytics tracking failed for reel view:', err.message);
    }
  };

  const logReelOrderClick = async (reelId) => {
    const cleanId = getBaseReelId(reelId);
    try {
      await api.post(`/reels/${cleanId}/click-order`);
    } catch (err) {
      console.warn('Silent analytics tracking failed for reel order click:', err.message);
    }
  };

  const value = {
    reels,
    feeds,
    loading,
    error,
    totalPages,
    currentFeedKey,
    setCurrentFeedKey,
    fetchReelsFeed,
    preloadRegionFeed,
    toggleLikeReel,
    commentOnReel,
    logReelView,
    logReelOrderClick,
    setReels,
  };

  return <ReelsContext.Provider value={value}>{children}</ReelsContext.Provider>;
};
