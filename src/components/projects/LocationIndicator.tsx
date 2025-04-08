import React from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import './GuardianVision.css';

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
