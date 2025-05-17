'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth';
import { useActionState } from 'react';
import { updateUserGeolocation } from '@/app/login/actions';

export function GeolocationHandler() {
  const { userPromise } = useUser();
  const [geolocationAttempted, setGeolocationAttempted] = useState(false);
  const [locationData, setLocationData] = useState<{
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }>({});
  
  const [state, formAction] = useActionState(updateUserGeolocation, {});

  // Request geolocation once when component mounts
  useEffect(() => {
    async function getUserLocation() {
      if (geolocationAttempted) return;
      
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          console.log('Geolocation is not supported by this browser');
          return;
        }

        // Get current position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocationData({ latitude, longitude });
            
            // Use reverse geocoding to get city and country
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
              );
              const data = await response.json();
              
              if (data && data.address) {
                const city = data.address.city || 
                             data.address.town || 
                             data.address.village || 
                             data.address.hamlet;
                             
                const country = data.address.country;
                
                setLocationData(prev => ({ 
                  ...prev, 
                  city, 
                  country 
                }));
                
                // Update user location in database
                if (city && country) {
                  const formData = new FormData();
                  formData.append('latitude', latitude.toString());
                  formData.append('longitude', longitude.toString());
                  formData.append('city', city);
                  formData.append('country', country);
                  formAction(formData);
                }
              }
            } catch (error) {
              console.error('Error during reverse geocoding:', error);
            }
          },
          (error) => {
            console.error('Error getting location:', error.message);
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      } finally {
        setGeolocationAttempted(true);
      }
    }

    // Check if user is logged in before attempting geolocation
    userPromise.then(user => {
      if (user) {
        getUserLocation();
      }
    });
  }, [userPromise, geolocationAttempted, formAction]);

  // This component doesn't render anything
  return null;
} 