/**
 * Utility functions for geocoding and reverse geocoding
 */

/**
 * Interface for location data
 */
export interface LocationData {
  city: string;
  country: string;
  state?: string;
  formatted_address?: string;
  error?: string;
}

/**
 * Reverse geocode coordinates to get location information
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise with location data
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationData> => {
  try {
    // Using the Nominatim OpenStreetMap API for reverse geocoding
    // This is a free service with usage limits, for production consider using a paid service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en', // Request English results
          'User-Agent': 'GuardianVision Application' // Required by Nominatim's terms
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant information
    const locationData: LocationData = {
      city: data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet ||
            'Unknown',
      country: data.address.country || 'Unknown',
      state: data.address.state || data.address.county || undefined,
      formatted_address: data.display_name
    };

    return locationData;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      city: 'Unknown',
      country: 'Unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Cache for geocoding results to minimize API calls
 */
const geocodeCache = new Map<string, LocationData>();

// Track the last request time to implement rate limiting
let lastRequestTime = 0;

// Track pending requests to avoid duplicate requests for the same coordinates
const pendingRequests = new Map<string, Promise<LocationData>>();

/**
 * Get location data with caching and debouncing
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise with location data
 */
export const getLocationData = async (latitude: number, longitude: number): Promise<LocationData> => {
  // Round coordinates to reduce unnecessary API calls for small movements
  // Using 3 decimal places (approx. 110 meters of precision) to reduce flickering
  // This is important to prevent infinite loops and excessive API calls
  const roundedLat = parseFloat(latitude.toFixed(3));
  const roundedLng = parseFloat(longitude.toFixed(3));

  // Create a cache key
  const cacheKey = `${roundedLat},${roundedLng}`;

  // Check if we have this location in cache
  if (geocodeCache.has(cacheKey)) {
    console.log(`Using cached location data for ${roundedLat},${roundedLng}`);
    return geocodeCache.get(cacheKey)!;
  }

  console.log(`Fetching new location data for ${roundedLat},${roundedLng}`);

  // Check if there's already a pending request for these coordinates
  if (pendingRequests.has(cacheKey)) {
    console.log(`Using pending request for ${roundedLat},${roundedLng}`);
    return pendingRequests.get(cacheKey)!;
  }

  // Implement rate limiting (max 1 request per second as per Nominatim usage policy)
  const now = Date.now();
  const timeElapsed = now - lastRequestTime;
  if (timeElapsed < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeElapsed));
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      lastRequestTime = Date.now();
      const locationData = await reverseGeocode(latitude, longitude);

      // Store in cache
      geocodeCache.set(cacheKey, locationData);

      // Remove from pending requests
      // Use a longer timeout to ensure we don't create multiple requests
      setTimeout(() => {
        console.log(`Removing pending request for ${roundedLat},${roundedLng}`);
        pendingRequests.delete(cacheKey);
      }, 500);

      return locationData;
    } catch (error) {
      // Remove from pending requests on error
      pendingRequests.delete(cacheKey);
      throw error;
    }
  })();

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};
