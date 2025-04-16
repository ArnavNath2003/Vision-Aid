import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, Loader } from 'lucide-react';
import './GuardianVision.css';
import { getLocationData, LocationData } from '../../utils/geocodingUtils';

interface LocationIndicatorProps {
  geoStatus: 'inactive' | 'active' | 'error';
  currentLocation: GeolocationPosition | null;
  locationUpdateTime: string;
  matchFound: boolean;
}

const LocationIndicator: React.FC<LocationIndicatorProps> = ({
  geoStatus,
  currentLocation,
  locationUpdateTime,
  matchFound
}) => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reference to store the timeout ID for debouncing
  const debounceTimerRef = useRef<number | null>(null);

  // Reference to store the previous coordinates to avoid unnecessary updates
  const prevCoordsRef = useRef<{lat: number, lng: number} | null>(null);

  // Effect to fetch location data when coordinates change with debouncing
  useEffect(() => {
    let isMounted = true;

    const fetchLocationData = async () => {
      if (!currentLocation) return;

      // Get current coordinates
      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;

      // Round coordinates to reduce unnecessary updates
      const roundedLat = parseFloat(lat.toFixed(3));
      const roundedLng = parseFloat(lng.toFixed(3));

      // Check if coordinates have changed significantly
      if (
        prevCoordsRef.current &&
        prevCoordsRef.current.lat === roundedLat &&
        prevCoordsRef.current.lng === roundedLng
      ) {
        return; // Skip if coordinates haven't changed significantly
      }

      // Update previous coordinates
      prevCoordsRef.current = { lat: roundedLat, lng: roundedLng };

      // Always show loading state when fetching new data
      setIsLoading(true);

      try {
        console.log(`LocationIndicator: Fetching data for ${lat}, ${lng}`);
        const data = await getLocationData(lat, lng);

        if (isMounted) {
          console.log('LocationIndicator: Setting location data', data);
          setLocationData(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('LocationIndicator: Error fetching location data:', error);
        if (isMounted) {
          // Set default location data on error to prevent continuous retries
          setLocationData({
            city: 'Unknown',
            country: 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          setIsLoading(false);
        }
      }
    };

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (currentLocation) {
      // Debounce the location update to prevent flickering
      // Use a longer debounce time to reduce API calls and prevent infinite loops
      debounceTimerRef.current = setTimeout(() => {
        console.log('LocationIndicator: Debounce timer expired, fetching location data');
        fetchLocationData();
      }, 1000); // 1000ms debounce time
    } else {
      setLocationData(null);
    }

    return () => {
      isMounted = false;
      // Clear the timeout on cleanup
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentLocation]);

  if (geoStatus === 'inactive') {
    return null;
  }

  // Format coordinates to be more readable
  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  return (
    <div className={`location-indicator ${geoStatus} ${matchFound ? 'match-found' : ''}`}>
      {geoStatus === 'active' && currentLocation ? (
        <>
          <div className="location-header">
            <MapPin size={16} className="location-icon" />
            <span>Location Tracking Active</span>
          </div>
          <div className="location-details">
            <div className="coordinate-row">
              <span className="coordinate-label">Lat:</span>
              <span className="coordinate-value">{formatCoordinate(currentLocation.coords.latitude)}</span>
            </div>
            <div className="coordinate-row">
              <span className="coordinate-label">Long:</span>
              <span className="coordinate-value">{formatCoordinate(currentLocation.coords.longitude)}</span>
            </div>

            {/* Display city and country information */}
            {isLoading ? (
              <div className="location-address loading">
                <Loader size={12} className="loading-icon" />
                <span>Loading location data...</span>
              </div>
            ) : locationData ? (
              <div className="location-address">
                <div className="address-row">
                  <span className="address-label">City:</span>
                  <span className="address-value">{locationData.city}</span>
                </div>
                {locationData.state && (
                  <div className="address-row">
                    <span className="address-label">State:</span>
                    <span className="address-value">{locationData.state}</span>
                  </div>
                )}
                <div className="address-row">
                  <span className="address-label">Country:</span>
                  <span className="address-value">{locationData.country}</span>
                </div>
              </div>
            ) : null}

            {locationUpdateTime && (
              <div className="location-update-time">
                Updated: {locationUpdateTime}
              </div>
            )}
            {matchFound && (
              <div className="location-match-alert">
                Match location recorded
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="location-error">
          <AlertTriangle size={16} className="location-icon error" />
          <span>Location unavailable</span>
        </div>
      )}
    </div>
  );
};

export default LocationIndicator;
