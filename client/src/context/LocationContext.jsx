import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

export const LocationContext = createContext();

export const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 
  'Pune', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Goa', 'Kochi', 'Lucknow', 'Indore', 'Surat'
];

export const CITY_LOCALITIES = {
  Mumbai: ['Bandra', 'Colaba', 'Andheri', 'Powai'],
  Delhi: ['Connaught Place', 'Hauz Khas', 'Saket'],
  Bengaluru: ['Indiranagar', 'Koramangala', 'Whitefield'],
  Hyderabad: ['Jubilee Hills', 'Banjara Hills'],
  Kolkata: ['Salt Lake', 'Park Street', 'Colaba'],
  Chennai: ['Nungambakkam', 'Adyar', 'T-Nagar'],
  Pune: ['Koregaon Park', 'Kalyani Nagar', 'Viman Nagar'],
  Ahmedabad: ['Satellite', 'Bodakdev', 'Vastrapur'],
  Jaipur: ['C-Scheme', 'Malviya Nagar', 'Vaishali Nagar'],
  Chandigarh: ['Sector 17', 'Sector 35', 'Sector 22'],
  Goa: ['Panaji', 'Calangute', 'Margao'],
  Kochi: ['Fort Kochi', 'Kakkanad', 'Edappally'],
  Lucknow: ['Hazratganj', 'Gomti Nagar', 'Aliganj'],
  Indore: ['Vijay Nagar', 'Palasia', 'Rajendra Nagar'],
  Surat: ['Adajan', 'Vesu', 'Ghod Dod Road']
};

export const CITY_COORDINATES = {
  Mumbai: { lat: 19.0760, lng: 72.8777, locality: 'Bandra' },
  Delhi: { lat: 28.6304, lng: 77.2177, locality: 'Connaught Place' },
  Bengaluru: { lat: 12.9716, lng: 77.5946, locality: 'Indiranagar' },
  Hyderabad: { lat: 17.4339, lng: 78.4011, locality: 'Jubilee Hills' },
  Chennai: { lat: 13.0827, lng: 80.2707, locality: 'Nungambakkam' },
  Kolkata: { lat: 22.5726, lng: 88.3639, locality: 'Salt Lake' },
  Pune: { lat: 18.5204, lng: 73.8567, locality: 'Koregaon Park' },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, locality: 'Satellite' },
  Jaipur: { lat: 26.9124, lng: 75.7873, locality: 'Connaught Place' },
  Chandigarh: { lat: 30.7333, lng: 76.7794, locality: 'Hauz Khas' },
  Goa: { lat: 15.4909, lng: 73.8180, locality: 'Panaji' },
  Kochi: { lat: 9.9312, lng: 76.2673, locality: 'Fort Kochi' },
  Lucknow: { lat: 26.8467, lng: 80.9462, locality: 'Hazratganj' },
  Indore: { lat: 22.7196, lng: 75.8577, locality: 'Vijay Nagar' },
  Surat: { lat: 21.1702, lng: 72.8311, locality: 'Adajan' }
};

export const LocationProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  const getCachedLocation = () => {
    try {
      const cached = sessionStorage.getItem('savore_detected_location');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  };

  const initialLocation = getCachedLocation();

  const [activeCity, setActiveCity] = useState(initialLocation?.city || 'Mumbai');
  const [activeLocality, setActiveLocality] = useState(initialLocation?.locality || 'Bandra');
  const [activeCoords, setActiveCoords] = useState(initialLocation?.coords || { lat: 19.0596, lng: 72.8258 }); // Bandra coordinates
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const isDetectingGps = useRef(false);

  const persistLocationCache = (city, locality, coords) => {
    try {
      sessionStorage.setItem(
        'savore_detected_location',
        JSON.stringify({
          city,
          locality,
          coords,
          timestamp: Date.now(),
        })
      );
    } catch (_) {}
  };

  // Haversine geodesic distance helper
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch saved addresses from backend when authenticated
  const fetchAddresses = async () => {
    if (!isAuthenticated) return;
    setAddressesLoading(true);
    try {
      const res = await api.get('/auth/addresses');
      if (res.data && res.data.success) {
        const addrList = res.data.data || [];
        setSavedAddresses(addrList);
        
        // Find default address to activate automatically
        const defaultAddr = addrList.find(a => a.isDefault);
        if (defaultAddr) {
          applyAddressState(defaultAddr);
        }
      }
    } catch (err) {
      console.warn('Failed to load user saved addresses:', err.message);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [isAuthenticated]);

  const applyAddressState = (address) => {
    const locality = address.area || address.street || 'Bandra';
    setActiveCity(address.city);
    setActiveLocality(locality);
    
    // Assign coordinates with slight offset based on locality or city default
    const defaults = CITY_COORDINATES[address.city] || CITY_COORDINATES['Mumbai'];
    const coords = { lat: defaults.lat, lng: defaults.lng };
    setActiveCoords(coords);
    persistLocationCache(address.city, locality, coords);
  };

  // Switch city manually
  const selectManualCity = (city, locality = null) => {
    const defaults = CITY_COORDINATES[city] || CITY_COORDINATES['Mumbai'];
    const activeLoc = locality || CITY_LOCALITIES[city]?.[0] || 'Bandra';
    const coords = { lat: defaults.lat, lng: defaults.lng };
    setActiveCity(city);
    setActiveLocality(activeLoc);
    setActiveCoords(coords);
    persistLocationCache(city, activeLoc, coords);
  };

  // Save / Add Address
  const addSavedAddress = async (addressData) => {
    try {
      const res = await api.post('/auth/addresses', addressData);
      if (res.data && res.data.success) {
        await fetchAddresses();
        return res.data.data;
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to save address');
    }
  };

  // Update Address
  const updateSavedAddress = async (id, addressData) => {
    try {
      const res = await api.put(`/auth/addresses/${id}`, addressData);
      if (res.data && res.data.success) {
        await fetchAddresses();
        return res.data.data;
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to update address');
    }
  };

  // Delete Address
  const deleteSavedAddress = async (id) => {
    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      if (res.data && res.data.success) {
        await fetchAddresses();
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to delete address');
    }
  };

  // Toggle Default address
  const toggleDefaultAddress = async (id) => {
    try {
      const res = await api.put(`/auth/addresses/${id}/default`);
      if (res.data && res.data.success) {
        await fetchAddresses();
        const address = savedAddresses.find(a => a._id === id);
        if (address) applyAddressState(address);
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to toggle default address');
    }
  };

  // Find closest Indian city mathematically based on coordinates
  const handleGeoClosestFallback = useCallback((lat, lng) => {
    let closestCity = 'Mumbai';
    let minDistance = Infinity;
    
    Object.keys(CITY_COORDINATES).forEach(city => {
      const coords = CITY_COORDINATES[city];
      const dist = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = city;
      }
    });

    const defaults = CITY_COORDINATES[closestCity];
    const coords = { lat: defaults.lat, lng: defaults.lng };
    setActiveCity(closestCity);
    setActiveLocality(defaults.locality);
    setActiveCoords(coords);
    persistLocationCache(closestCity, defaults.locality, coords);
  }, []);

  // GPS Geolocation and reverse geocoding mapper
  const detectGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }
    if (isDetectingGps.current) {
      console.log('📍 [Location Context] Geolocation detection already in progress. Skipping...');
      return;
    }

    // Check if recent location is already cached within 30 minutes
    const cached = getCachedLocation();
    if (cached && (Date.now() - (cached.timestamp || 0)) < 30 * 60 * 1000) {
      setActiveCity(cached.city);
      setActiveLocality(cached.locality);
      setActiveCoords(cached.coords);
      return;
    }

    isDetectingGps.current = true;
    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setPermissionStatus('granted');
        const { latitude, longitude } = position.coords;
        setActiveCoords({ lat: latitude, lng: longitude });

        try {
          // Attempt reverse geocoding OSM Nominatim API with 2.5s abort controller
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              signal: controller.signal,
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'Savore-Dining-Application'
              }
            }
          );
          clearTimeout(timeoutId);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const parsedCity = addr.city || addr.town || addr.village || addr.state_district || '';
            const parsedLocality = addr.suburb || addr.neighbourhood || addr.road || '';
            
            // Match against Indian cities list
            const matchedCity = CITIES.find(
              c => parsedCity.toLowerCase().includes(c.toLowerCase()) || 
                   c.toLowerCase().includes(parsedCity.toLowerCase())
            );

            if (matchedCity) {
              const locality = parsedLocality || CITY_LOCALITIES[matchedCity]?.[0] || 'Bandra';
              const coords = { lat: latitude, lng: longitude };
              setActiveCity(matchedCity);
              setActiveLocality(locality);
              persistLocationCache(matchedCity, locality, coords);
            } else {
              // Geographically closest Indian city fallback if coordinates are in India but OSM returned custom names
              handleGeoClosestFallback(latitude, longitude);
            }
          } else {
            handleGeoClosestFallback(latitude, longitude);
          }
        } catch (err) {
          handleGeoClosestFallback(latitude, longitude);
        } finally {
          setGpsLoading(false);
          isDetectingGps.current = false;
        }
      },
      (error) => {
        setPermissionStatus('denied');
        setGpsLoading(false);
        isDetectingGps.current = false;
        console.warn('Geolocation permission denied or error occurred:', error.message);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  }, [handleGeoClosestFallback]);

  // Auto-detect GPS location if permission is already granted or granted in real-time
  useEffect(() => {
    if (navigator.permissions && navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        setPermissionStatus(permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          console.log("📍 [Location Context] Geolocation already granted. Auto-detecting coordinates...");
          detectGpsLocation();
        }
        
        permissionStatus.onchange = () => {
          setPermissionStatus(permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            console.log("📍 [Location Context] Geolocation granted in real-time. Auto-detecting coordinates...");
            detectGpsLocation();
          }
        };
      }).catch(err => {
        console.warn("Permissions query geolocation failed:", err.message);
      });
    }
  }, [detectGpsLocation]);

  const defaultAddress = savedAddresses.find(a => a.isDefault) || null;

  const value = {
    activeCity,
    activeLocality,
    activeCoords,
    savedAddresses,
    defaultAddress,
    addressesLoading,
    gpsLoading,
    permissionStatus,
    detectGpsLocation,
    selectManualCity,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    toggleDefaultAddress,
    calculateDistance,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
