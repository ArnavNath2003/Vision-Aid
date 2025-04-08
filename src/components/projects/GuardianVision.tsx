import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  Camera,
  X
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import './GuardianVision.css';
import { useFaceApiModels } from '../../hooks/useFaceApiModels';
import LocalMedia from './LocalMedia';
// Import Dashboard component
import DashboardComponent from './Dashboard';
// Import Settings component
import Settings from './Settings';
// Import LocationIndicator component
import LocationIndicator from './LocationIndicator';
// Import Toast component
import Toast from '../Toast';
// Import custom icons
import cctvIcon from '../../assets/icons/cctv.svg';
import droneIcon from '../../assets/icons/drone.svg';
import webcamIcon from '../../assets/icons/webcam.svg';

export interface FaceMatch {
  label: string;
  distance: number;
  timestamp: Date;
  location?: GeolocationPosition;
  confidence: number;
  found?: boolean;
  source?: string;
}

export interface ProcessedFace {
  descriptor: Float32Array;
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
  match?: FaceMatch;
}

interface FaceEncoding {
  descriptor: Float32Array;
  label: string;
}

const GuardianVision: React.FC = () => {
  // All state hooks
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedSinks, setSelectedSinks] = useState<string[]>([]);
  const [sourceImages, setSourceImages] = useState<string[]>([]);
  const [sourceImage, setSourceImage] = useState<string | null>(null); // Keep for backward compatibility
  const [processedFaces, setProcessedFaces] = useState<ProcessedFace[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [faceEncodings, setFaceEncodings] = useState<FaceEncoding[]>([]);
  const [referenceImagesCount, setReferenceImagesCount] = useState<number>(0);
  const [minRecommendedImages] = useState<number>(3);
  const maxAllowedImages = 5; // Changed from useState to a constant since it's not changing
  const [showReferenceWarning, setShowReferenceWarning] = useState<boolean>(false);

  // State for pending images (uploaded but not processed)
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imagesReadyToProcess, setImagesReadyToProcess] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState(0.6);
  const [frameSkip, setFrameSkip] = useState(2);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);
  const [matchHistory, setMatchHistory] = useState<FaceMatch[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [matchThresholdSlider, setMatchThresholdSlider] = useState(60);
  const [showDashboard, setShowDashboard] = useState(false);
  // State for toast notifications
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: 'success' | 'error' | 'info' | 'warning'}>>([]);
  const [isToastActive, setIsToastActive] = useState<boolean>(false);
  // State to track geolocation status
  const [geoStatus, setGeoStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [locationUpdateTime, setLocationUpdateTime] = useState<string>('');
  // We'll use the existing referenceImagesCount state

  // All refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Import the custom hook for model loading
  const MODEL_URL = `${window.location.origin}/weights`;
  // The useFaceApiModels hook uses IndexedDB for caching models when offlineMode is enabled
  const { error: modelsError, modelsLoaded: faceApiModelsLoaded } = useFaceApiModels(MODEL_URL, offlineMode);

  // Update state based on the hook results
  useEffect(() => {
    if (modelsError) {
      setModelError('Failed to load face detection models. Please refresh the page.');
      console.error('Model loading error:', modelsError);
    }

    if (faceApiModelsLoaded) {
      setModelsLoaded(true);
      console.log('Face API models loaded and ready to use');
    }
  }, [modelsError, faceApiModelsLoaded]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    // Make matching more lenient by adjusting the threshold
    // Higher threshold = more lenient matching
    // Adding 0.15 to make it much more lenient for better face recognition
    setMatchThreshold(1 - (matchThresholdSlider / 100) + 0.15);
  }, [matchThresholdSlider]);

  // Effect to handle geolocation tracking based on the geolocationEnabled setting
  useEffect(() => {
    let watchId: number | null = null;

    if (geolocationEnabled) {
      if (navigator.geolocation) {
        setGeoStatus('active');

        // Get initial position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation(position);
            const now = new Date();
            setLocationUpdateTime(now.toLocaleTimeString());
            console.log('Geolocation enabled, initial position acquired');
          },
          (error) => {
            console.error('Geolocation error:', error);
            setGeoStatus('error');
          }
        );

        // Set up continuous tracking
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation(position);
            const now = new Date();
            setLocationUpdateTime(now.toLocaleTimeString());
          },
          (error) => {
            console.error('Geolocation tracking error:', error);
            setGeoStatus('error');
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );

        console.log('Geolocation tracking started');
      } else {
        console.warn('Geolocation is not supported by this browser');
        setGeoStatus('error');
      }
    } else {
      setGeoStatus('inactive');
      if (currentLocation) {
        // Clear location data when disabled
        setCurrentLocation(null);
        setLocationUpdateTime('');
        console.log('Geolocation disabled, location data cleared');
      }
    }

    // Cleanup function to stop tracking when component unmounts or setting changes
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log('Geolocation tracking stopped');
      }
    };
  }, [geolocationEnabled, currentLocation]);

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const
  };

  // Model loading is now handled by the useFaceApiModels hook

  // Note: processSourceImage has been replaced by processReferenceImage
  // which supports multiple reference images for better face recognition

  // Create a state variable to store the latest match results for display
  const [matchResults, setMatchResults] = useState<string>('');

  // State to track whether panels are expanded or collapsed
  const [isDebugPanelExpanded, setIsDebugPanelExpanded] = useState<boolean>(false); // Collapsed by default
  const [isMetricsPanelExpanded, setIsMetricsPanelExpanded] = useState<boolean>(false); // Collapsed by default

  // State for connection settings
  const [showCctvSettings, setShowCctvSettings] = useState<boolean>(false);
  const [showDroneSettings, setShowDroneSettings] = useState<boolean>(false);
  const [cctvConnected, setCctvConnected] = useState<boolean>(false);
  const [droneConnected, setDroneConnected] = useState<boolean>(false);

  // State for LocalMedia component
  const [showLocalMedia, setShowLocalMedia] = useState<boolean>(false);

  // CCTV connection settings
  const [cctvSettings, setCctvSettings] = useState({
    ipAddress: '192.168.1.100',
    port: '8080',
    username: 'admin',
    password: '',
    protocol: 'rtsp'
  });

  // Drone connection settings
  const [droneSettings, setDroneSettings] = useState({
    droneId: 'DJI-1234',
    connectionType: 'wifi',
    ssid: 'Drone-Network',
    password: '',
    channel: '5'
  });

  // Create refs to store the last dimensions and counts for logging optimization
  const lastWidthRef = useRef<number>(0);
  const lastHeightRef = useRef<number>(0);
  const lastFaceCountRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);

  const matchFace = (descriptor: Float32Array): { isMatch: boolean; confidence: number } => {
    if (faceEncodings.length === 0) {
      setMatchResults('No face encodings available for matching');
      return { isMatch: false, confidence: 0 };
    }

    let bestMatch = {
      distance: Number.MAX_VALUE,
      isMatch: false,
      confidence: 0
    };

    // Start building the match results string without clearing console
    // This prevents the console from blinking
    let resultsLog = `Matching with threshold: ${matchThreshold.toFixed(2)} (lower is stricter)\n`;

    // Group encodings by person (based on label prefix)
    const personEncodings: { [key: string]: FaceEncoding[] } = {};

    for (const encoding of faceEncodings) {
      // Extract image ID from label (e.g., "Image_1_2" -> "Image_1")
      const imageId = encoding.label.split('_').slice(0, 2).join('_');

      if (!personEncodings[imageId]) {
        personEncodings[imageId] = [];
      }

      personEncodings[imageId].push(encoding);
    }

    resultsLog += `Grouped encodings into ${Object.keys(personEncodings).length} images\n`;

    // For each image, calculate average distance across all their encodings
    for (const imageId in personEncodings) {
      try {
        const encodings = personEncodings[imageId];
        let totalDistance = 0;
        let minDistance = Number.MAX_VALUE;

        // Find the minimum distance among all encodings for this image
        resultsLog += `\nMatching against ${imageId}:\n`;
        for (const encoding of encodings) {
          const distance = faceapi.euclideanDistance(descriptor, encoding.descriptor);
          totalDistance += distance;
          minDistance = Math.min(minDistance, distance);
          resultsLog += `  - Distance to ${encoding.label}: ${distance.toFixed(4)}\n`;
        }

        // Calculate average distance (weighted toward minimum distance)
        const avgDistance = (minDistance * 0.7) + (totalDistance / encodings.length * 0.3);
        resultsLog += `  - Min distance: ${minDistance.toFixed(4)}, Avg weighted distance: ${avgDistance.toFixed(4)}\n`;

        // Update best match if this person is a better match
        if (avgDistance < bestMatch.distance) {
          const isMatch = avgDistance < matchThreshold;
          const confidence = (1 - avgDistance) * 100;

          bestMatch = {
            distance: avgDistance,
            isMatch,
            confidence
          };

          resultsLog += `  - New best match: ${imageId}, distance: ${avgDistance.toFixed(4)}, ` +
                      `isMatch: ${isMatch}, confidence: ${confidence.toFixed(2)}%\n`;
        }
      } catch (error) {
        resultsLog += `Error matching against image ${imageId}: ${error}\n`;
      }
    }

    // Add a summary of the best match
    resultsLog += `\n=== MATCH RESULT ===\n`;
    resultsLog += `Best match: ${bestMatch.isMatch ? 'MATCH FOUND' : 'NO MATCH'}\n`;
    resultsLog += `Confidence: ${bestMatch.confidence.toFixed(2)}%\n`;
    resultsLog += `Distance: ${bestMatch.distance.toFixed(4)} (threshold: ${matchThreshold.toFixed(2)})\n`;

    // Update the match results state
    setMatchResults(resultsLog);

    // Use a single console.log with a dynamic label to avoid cluttering
    // This will update the same line in the console instead of adding new lines
    if (frameCountRef.current % 15 === 0) {
      // Use a consistent label so the browser can group identical console messages
      console.log('%cFace Match Results', 'color: #8a2be2; font-weight: bold', bestMatch);
    }

    return {
      isMatch: bestMatch.isMatch,
      confidence: bestMatch.confidence
    };
  };

  const processWebcamFrame = async (video: HTMLVideoElement, canvas: HTMLCanvasElement, _previousDetections: any[] = []): Promise<any[]> => {
    try {
      // Double-check video is ready
      if (video.readyState < 2) {
        console.log('Video not ready for processing in processWebcamFrame');
        return [];
      }

      // Ensure canvas dimensions match video dimensions
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      if (displaySize.width === 0 || displaySize.height === 0) {
        console.log('Invalid video dimensions, skipping frame');
        return [];
      }

      // Update canvas dimensions if needed
      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        console.log(`Updated canvas dimensions to: ${canvas.width}x${canvas.height}`);
      }

      faceapi.matchDimensions(canvas, displaySize);

      // Get canvas context with willReadFrequently flag to optimize performance
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Could not get canvas context');
        return [];
      }

      // Only log dimensions on first frame or when they change
      if (canvas.width !== lastWidthRef.current || canvas.height !== lastHeightRef.current) {
        console.log('Processing webcam frame with dimensions:', canvas.width, 'x', canvas.height);
        lastWidthRef.current = canvas.width;
        lastHeightRef.current = canvas.height;
      }

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // First draw the video frame on the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add a slight overlay to reduce flickering
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Check if we have face encodings to match against
      if (faceEncodings.length === 0) {
        console.warn('No face encodings available for matching');
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('No reference faces available', canvas.width / 2, canvas.height / 2);
        return [];
      }

      // Determine which face detection model to use
      let detectionOptions;

      if (performanceMode) {
        // Use TinyYolov2 in performance mode
        detectionOptions = new faceapi.TinyYolov2Options({
          scoreThreshold: 0.5,
          inputSize: 224
        });
      } else {
        // Use SSD MobileNet with very permissive parameters to detect more challenging faces
        detectionOptions = new faceapi.SsdMobilenetv1Options({
          // Use a very low confidence threshold to detect more faces
          minConfidence: 0.2,
          // Increase the number of results to consider more potential faces
          maxResults: 15
        });
      }

      // Detect faces
      // Increment frame counter
      frameCountRef.current += 1;

      // Only log this once every 60 frames to reduce console spam
      if (frameCountRef.current % 60 === 0) {
        console.log('%cDetecting faces...', 'color: #4682b4; font-style: italic');
      }

      const detections = await faceapi.detectAllFaces(video, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Only log face count when it changes and not too frequently
      if (detections.length !== lastFaceCountRef.current && frameCountRef.current % 15 === 0) {
        console.log(`%cFaces detected: ${detections.length}`, 'color: #4682b4; font-weight: bold');
        lastFaceCountRef.current = detections.length;
      }

      // If no faces detected, show a message
      if (detections.length === 0) {
        // Draw a message on canvas
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('No faces detected', canvas.width / 2, canvas.height / 2);
        return [];
      }

      // Resize detections to match display size
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Draw landmarks directly to ensure they appear
      // Only log this once every 120 frames to minimize console output
      if (frameCountRef.current % 120 === 0) {
        console.log('%cRendering landmarks', 'color: #9370db; font-style: italic');
      }
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Draw custom landmarks for better visibility
      resizedDetections.forEach(detection => {
        if (detection.landmarks && detection.landmarks.positions) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw larger landmarks
          ctx.fillStyle = '#00ff00';
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;

          // Draw points
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      });

      // Also draw detections with boxes
      faceapi.draw.drawDetections(canvas, resizedDetections);

      // We'll also handle drawing our custom landmarks in renderDetections
      // This gives us more control over the appearance

      // Process each detected face
      resizedDetections.forEach(detection => {
        // Match face against stored encodings
        const { isMatch, confidence } = matchFace(detection.descriptor);
        console.log(`Face match result: isMatch=${isMatch}, confidence=${confidence.toFixed(2)}%`);

        // Record match if found and geolocation is enabled
        if (isMatch && currentLocation) {
          const newMatch: FaceMatch = {
            label: 'Match',
            distance: 1 - (confidence / 100),
            timestamp: new Date(),
            location: currentLocation,
            confidence
          };
          handleMatch(newMatch);
        }

        // Draw box around face with match information
        const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
          label: isMatch
            ? showConfidence ? `Match: ${confidence.toFixed(2)}%` : 'Match'
            : 'No Match',
          boxColor: isMatch ? '#00ff00' : '#ff0000',
          lineWidth: 2
        });

        drawBox.draw(canvas);

        // Apply privacy blur if needed
        if (privacyMode && !isMatch) {
          const box = detection.detection.box;
          ctx.filter = 'blur(10px)';
          ctx.drawImage(
            video,
            box.x, box.y, box.width, box.height,
            box.x, box.y, box.width, box.height
          );
          ctx.filter = 'none';
        } else {
          // Draw facial landmarks with improved stability
          const landmarks = detection.landmarks;

          // Set styles based on match status
          const color = isMatch ? '#00ff00' : '#ff0000';
          const glowColor = isMatch ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

          // Draw the facial landmark lines first (underneath)
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';

          // Add glow effect to lines
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 8;

          // Connect landmarks with lines
          ctx.moveTo(landmarks.positions[0].x, landmarks.positions[0].y);
          for (let i = 1; i < landmarks.positions.length; i++) {
            ctx.lineTo(landmarks.positions[i].x, landmarks.positions[i].y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw points for each landmark on top
          landmarks.positions.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = color;

            // Add glow effect to points
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Add a white center to each point for better visibility
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
          });
        }

        // Add processed face to state for display
        const processedFace: ProcessedFace = {
          descriptor: detection.descriptor,
          detection: detection.detection,
          landmarks: detection.landmarks,
          match: isMatch ? {
            label: 'Match',
            distance: 1 - (confidence / 100),
            timestamp: new Date(),
            confidence
          } : undefined
        };

        // Update processed faces (only keep faces from the current session)
        setProcessedFaces(prev => {
          // Only keep up to 5 most recent faces to avoid clutter
          const newFaces = [...prev, processedFace];
          return newFaces.slice(-5); // Keep only the last 5 faces
        });
      });

      // Return the processed detections with match information
      // Add detailed logging to help diagnose issues
      const processedDetections = resizedDetections.map(detection => {
        const { isMatch, confidence } = matchFace(detection.descriptor);

        // Log detection details
        console.log('Processing detection:', {
          box: detection.detection.box,
          landmarksCount: detection.landmarks.positions.length,
          isMatch,
          confidence
        });

        return {
          detection: detection.detection,
          landmarks: detection.landmarks,
          descriptor: detection.descriptor,
          match: { isMatch, confidence }
        };
      });

      console.log(`Processed ${processedDetections.length} detections`);
      return processedDetections;
    } catch (error) {
      console.error('Error in processWebcamFrame:', error);
      return [];
    }
  };

  // Function to select key facial landmarks for a cleaner look
  const selectKeyFacialLandmarks = (allPoints: Array<{x: number, y: number}>) => {
    // If we don't have enough points, return all of them
    if (allPoints.length < 20) return allPoints;

    // Select key points for face outline and major features
    // These indices are based on the 68-point facial landmark model
    // used by face-api.js
    const keyIndices = [
      // Jaw line (fewer points)
      0, 4, 8, 12, 16,
      // Right eyebrow (outer and inner corners)
      17, 21,
      // Left eyebrow (inner and outer corners)
      22, 26,
      // Nose bridge (top and bottom)
      27, 30,
      // Nose tip
      33,
      // Right eye (corners and top/bottom)
      36, 39,
      // Left eye (corners and top/bottom)
      42, 45,
      // Mouth (corners, top, bottom)
      48, 51, 54, 57
    ];

    // Return only the key points
    return keyIndices.map(index => {
      // Make sure the index is valid
      if (index < allPoints.length) {
        return allPoints[index];
      }
      // Fallback to first point if index is invalid
      return allPoints[0];
    });
  };

  // Helper function to apply a blur effect to an image region
  // This is a simple box blur implementation for privacy mode
  const applyBlurEffect = (imageData: ImageData, radius: number, width: number, height: number): ImageData => {
    // Create a copy of the image data to work with
    const pixels = new Uint8ClampedArray(imageData.data);
    const output = new Uint8ClampedArray(imageData.data.length);

    // Simple box blur algorithm
    // We're using a dynamic count for each pixel instead of a fixed divisor

    // For each pixel in the image
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;

        // Sample the surrounding pixels
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const i = (py * width + px) * 4;

            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
            a += pixels[i + 3];
            count++;
          }
        }

        // Calculate the average color
        const i = (y * width + x) * 4;
        output[i] = r / count;
        output[i + 1] = g / count;
        output[i + 2] = b / count;
        output[i + 3] = a / count;
      }
    }

    // Create a new ImageData object with the blurred data
    return new ImageData(output, width, height);
  };

  // Function to render detections without running face detection again
  const renderDetections = (video: HTMLVideoElement, canvas: HTMLCanvasElement, detections: any[]) => {
    try {
      // Get canvas context with willReadFrequently flag
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      console.log(`Rendering ${detections.length} detections on canvas ${canvas.width}x${canvas.height}`);

      // Clear and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add a slight overlay to reduce flickering
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all detections
      detections.forEach(detection => {
        // Make sure we have valid detection data
        if (!detection || !detection.detection || !detection.detection.box) {
          console.error('Invalid detection object:', detection);
          return;
        }

        // Draw box around face with match information
        const { isMatch, confidence } = detection.match || { isMatch: false, confidence: 0 };

        // Log the box we're about to draw
        console.log('Drawing box:', detection.detection.box);

        // Apply privacy mode - blur non-matching faces if enabled
        if (privacyMode && !isMatch) {
          try {
            // Get the face region
            const box = detection.detection.box;
            const faceRegion = ctx.getImageData(box.x, box.y, box.width, box.height);

            // Apply a blur effect to the face region
            // This is a simple blur implementation - in a production app, you'd use a more sophisticated algorithm
            const blurRadius = 10;
            const blurredFace = applyBlurEffect(faceRegion, blurRadius, box.width, box.height);

            // Put the blurred face back on the canvas
            ctx.putImageData(blurredFace, box.x, box.y);

            console.log('Applied blur to non-matching face (privacy mode)');
          } catch (error) {
            console.error('Error applying privacy blur:', error);
          }
        }

        const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
          label: isMatch
            ? showConfidence ? `Match: ${confidence.toFixed(2)}%` : 'Match'
            : 'No Match',
          boxColor: isMatch ? '#00ff00' : '#ff0000',
          lineWidth: 2
        });

        // Draw the box
        drawBox.draw(canvas);

        // Draw facial landmarks with improved stability
        try {
          // Make sure landmarks exist
          if (!detection.landmarks || !detection.landmarks.positions || detection.landmarks.positions.length === 0) {
            console.error('No landmarks found in detection:', detection);
            return;
          }

          const landmarks = detection.landmarks;
          console.log(`Drawing landmarks with ${landmarks.positions.length} points`);

          // Set styles based on match status
          const color = isMatch ? '#00ff00' : '#ff0000';
          const glowColor = isMatch ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';

          // Select key facial landmarks instead of using all of them
          // This makes the overlay look cleaner and less like a filter
          const keyPoints = selectKeyFacialLandmarks(landmarks.positions);
          console.log(`Selected ${keyPoints.length} key points for landmarks`);

          if (keyPoints.length > 0) {
            // Draw face outline with thicker lines
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 4; // Even thicker lines
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            // Add stronger glow effect to lines
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 12;

            // Connect key landmarks with lines
            ctx.moveTo(keyPoints[0].x, keyPoints[0].y);
            for (let i = 1; i < keyPoints.length; i++) {
              ctx.lineTo(keyPoints[i].x, keyPoints[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw much larger points for each key landmark
            keyPoints.forEach((point: { x: number; y: number }) => {
              // Draw outer glow
              ctx.beginPath();
              ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI); // Much bigger dots (8px)
              ctx.fillStyle = color;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 15; // Stronger glow
              ctx.fill();
              ctx.shadowBlur = 0;

              // Add a larger white center for better visibility
              ctx.beginPath();
              ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI); // Bigger white center (3px)
              ctx.fillStyle = 'white';
              ctx.fill();
            });

            // Draw a label above the face
            const box = detection.detection.box;
            const labelY = box.y - 10;
            const labelX = box.x + box.width / 2;

            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;
            ctx.fillText(isMatch
              ? (showConfidence ? `MATCH ${confidence.toFixed(0)}%` : 'MATCH')
              : 'NO MATCH',
              labelX, labelY);
            ctx.shadowBlur = 0;
          } else {
            console.warn('No key points selected for landmarks');
          }
        } catch (error) {
          console.error('Error drawing landmarks:', error);
        }
      });
    } catch (error) {
      console.error('Error rendering detections:', error);
    }
  };

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Get current pending images and add the new ones
    const currentPendingImages = [...pendingImages];
    const fileArray = Array.from(files);

    // Add new files to the existing array
    const combinedFiles = [...currentPendingImages, ...fileArray];

    // Limit to maxAllowedImages if needed
    const finalFiles = combinedFiles.slice(0, maxAllowedImages);
    setPendingImages(finalFiles);

    // Check if we have multiple files
    const fileCount = finalFiles.length;
    console.log(`Added new images. Total: ${fileCount} reference images ready to process`);

    // Update reference images count (but don't process yet)
    setReferenceImagesCount(fileCount);

    // Show warning if fewer than recommended images
    if (fileCount < minRecommendedImages) {
      setShowReferenceWarning(true);
      console.warn(`Only ${fileCount} reference images provided. For better accuracy, ${minRecommendedImages} or more are recommended.`);
    } else {
      setShowReferenceWarning(false);
    }

    // Set flag to show the process button
    setImagesReadyToProcess(true);
  };

  // New function to process the pending images when the user clicks the Process button
  const processReferenceImages = async () => {
    if (pendingImages.length === 0) {
      alert('Please upload reference images first');
      return;
    }

    // Check if we have too many images
    if (pendingImages.length > maxAllowedImages) {
      alert(`You can only process up to ${maxAllowedImages} reference images. Please remove some images.`);
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(10);

      // Clear previous processed faces when starting a new processing session
      setProcessedFaces([]);

      // Process all images
      const fileCount = pendingImages.length;
      const newSourceImages: string[] = [];
      const allEncodings: FaceEncoding[] = [];
      const allDescriptors: Float32Array[] = [];

      // Process each image sequentially
      for (let i = 0; i < fileCount; i++) {
        const file = pendingImages[i];
        const imageData = await readFileAsDataURL(file);

        if (!imageData) continue;

        const img = new Image();
        img.src = imageData;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Process this image
        setUploadProgress(10 + Math.floor((i / fileCount) * 70)); // Update progress based on current image
        const { success, encodings, descriptors } = await processReferenceImage(img, i);

        if (success) {
          newSourceImages.push(imageData);
          allEncodings.push(...encodings);
          allDescriptors.push(...descriptors);
        }
      }

      // If we have at least one successful image
      if (newSourceImages.length > 0) {
        // Update state with all processed images
        setSourceImages(newSourceImages);
        setSourceImage(newSourceImages[0]); // Set first image as primary for backward compatibility

        // Create a face matcher with all descriptors
        if (allDescriptors.length > 0) {
          const labeledDescriptors = new faceapi.LabeledFaceDescriptors('User', allDescriptors);
          const faceMatcher = new faceapi.FaceMatcher([labeledDescriptors], matchThreshold);
          setFaceMatcher(faceMatcher);
          setFaceEncodings(allEncodings);

          console.log(`Created face matcher with ${allDescriptors.length} descriptors`);
          setSelectedSource('upload');
        } else {
          // Show a helpful error message if no faces were detected
          alert('No faces were detected in your reference images. Please try different images with clearer faces, better lighting, or more frontal face angles.');
          console.warn('No face descriptors were generated from the reference images');
        }
      }

      setUploadProgress(100); // Complete progress

      // Reset the pending images and ready flag after processing
      setPendingImages([]);
      setImagesReadyToProcess(false);

      console.log('Reference images processed successfully');
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to read a file as data URL
  const readFileAsDataURL = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve(null);
          return;
        }
        resolve(event.target.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Process a single reference image
  const processReferenceImage = async (img: HTMLImageElement, index: number): Promise<{ success: boolean; encodings: FaceEncoding[]; descriptors: Float32Array[] }> => {
    try {
      console.log(`Processing reference image ${index + 1}`);

      // Determine which face detection model to use based on performanceMode setting
      let detectionOptions;

      if (performanceMode) {
        // Use TinyYolov2 in performance mode
        detectionOptions = new faceapi.TinyYolov2Options({
          scoreThreshold: 0.5,
          inputSize: 224
        });
        console.log(`Using TinyYolov2 (performance mode) for face detection on image ${index + 1}`);
      } else {
        // Use SSD MobileNet with very permissive parameters to detect more challenging faces
        detectionOptions = new faceapi.SsdMobilenetv1Options({
          // Use a very low confidence threshold to detect more faces
          minConfidence: 0.2,
          // Increase the number of results to consider more potential faces
          maxResults: 15
        });
        console.log(`Using optimized SSD MobileNet for face detection on image ${index + 1}`);
      }

      const detections = await faceapi.detectAllFaces(img, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        console.warn(`No faces detected in reference image ${index + 1}`);
        return { success: false, encodings: [], descriptors: [] };
      }

      console.log(`Detected ${detections.length} faces in reference image ${index + 1}`);

      // Create encodings for this image
      const encodings = detections.map((detection, i) => ({
        descriptor: detection.descriptor,
        label: `Image_${index + 1}_${i + 1}`
      }));

      // Extract descriptors
      const descriptors = detections.map(detection => detection.descriptor);

      return {
        success: true,
        encodings,
        descriptors
      };
    } catch (error) {
      console.error(`Error processing reference image ${index + 1}:`, error);
      return { success: false, encodings: [], descriptors: [] };
    }
  };

  // Global variable to track if processing is active
  const processingActive = useRef(false);

  const handleWebcamStream = async () => {
    if (!videoRef.current || !webcamCanvasRef.current) {
      console.error('Video or canvas reference not available');
      return;
    }

    // Set the processing active flag
    processingActive.current = true;

    const video = videoRef.current;
    const canvas = webcamCanvasRef.current;

    console.log('Starting webcam stream processing');
    console.log('Video readyState:', video.readyState);
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('isWebcamActive state:', isWebcamActive);
    console.log('processingActive ref:', processingActive.current);

    // Wait for video to be properly initialized if dimensions are not available
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video dimensions not ready, waiting...');
      await new Promise<void>((resolve) => {
        const checkDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Video dimensions now available:', video.videoWidth, 'x', video.videoHeight);
            resolve();
          } else {
            setTimeout(checkDimensions, 100);
          }
        };
        checkDimensions();
      });
    }

    // Now set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);

    const displaySize = { width: canvas.width, height: canvas.height };
    faceapi.matchDimensions(canvas, displaySize);

    // Store the last detection results to reduce flickering
    let lastDetections: any[] = [];
    let frameCount = 0;
    let lastFrameTime = 0;
    let stableFrameCounter = 0;

    // Define the frame processing function
    const processFrame = async (timestamp: number) => {
      // Only process if enough time has passed (throttle for performance)
      // Limit to ~30fps for smooth rendering

      if (timestamp - lastFrameTime < 1000 / 30) { // Limit rendering to ~30fps
        requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTime = timestamp;

      // Apply frameSkip setting - only process every Nth frame
      // frameCount is incremented each time this function is called
      frameCount++;
      if (frameCount % frameSkip !== 0) {
        // Skip this frame based on frameSkip setting
        requestAnimationFrame(processFrame);
        return;
      }

      // Check if processing should continue
      if (!processingActive.current) {
        console.log('Processing has been stopped');
        return;
      }

      // Check if video element is still valid
      if (!video) {
        console.log('Video element no longer available');
        processingActive.current = false;
        return;
      }

      // Check if video is ready for processing
      if (video.paused || video.ended) {
        console.log('Video is paused or ended, will retry');
        requestAnimationFrame(processFrame);
        return;
      }

      // Check video readyState
      if (video.readyState < 2) {
        console.log('Video not ready yet (readyState < 2), will retry');
        requestAnimationFrame(processFrame);
        return;
      }

      try {
        frameCount++;

        // Run face detection on every frame to ensure dynamic movement
        // This ensures the landmarks move with the face in real-time
        const newDetections = await processWebcamFrame(video, canvas, lastDetections);

        if (newDetections && newDetections.length > 0) {
          // Update last detections with new ones
          lastDetections = newDetections;
          stableFrameCounter = 0; // Reset stability counter

          // Immediately render the new detections
          renderDetections(video, canvas, lastDetections);
        } else {
          // If no faces detected, increment stability counter
          stableFrameCounter++;

          // If we've had several frames with no detections, clear lastDetections
          if (stableFrameCounter > 5) {
            lastDetections = [];
          } else if (lastDetections.length > 0) {
            // Still render the last known detections for a few frames
            // to reduce flickering when face detection temporarily fails
            renderDetections(video, canvas, lastDetections);
          }
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }

      // Continue processing frames if still active
      if (processingActive.current) {
        requestAnimationFrame(processFrame);
      } else {
        console.log('Processing has been stopped');
      }
    };

    // Start processing frames
    requestAnimationFrame(processFrame);
    console.log('Frame processing started');
  };

  const stopWebcam = () => {
    // Stop the frame processing
    processingActive.current = false;

    // Stop the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Update the state
    setIsWebcamActive(false);

    console.log('Webcam stopped, processing deactivated');
  };

  const startWebcam = async () => {
    // Clear processed faces when starting a new webcam session
    setProcessedFaces([]);
    if (sourceImages.length === 0 && !sourceImage) {
      alert('Please upload at least one reference image first');
      // Redirect to the upload section
      setSelectedSource('upload');
      return;
    }

    // Show warning if fewer than recommended images
    if (referenceImagesCount < minRecommendedImages) {
      setShowReferenceWarning(true);
      console.warn(`Only ${referenceImagesCount} reference images provided. For better accuracy, ${minRecommendedImages} or more are recommended.`);
    }

    // Check if we have face encodings to match against
    if (faceEncodings.length === 0) {
      console.warn('No face encodings available for matching');
      alert('No faces were detected in your reference images. Please try different images with clearer faces, better lighting, or more frontal face angles.');
      return;
    }

    console.log('Starting webcam with face encodings:', faceEncodings);

    try {
      // Stop any existing webcam stream
      stopWebcam();

      // Models should already be loaded by the useFaceApiModels hook
      if (!faceApiModelsLoaded) {
        console.log('Waiting for face detection models to load...');
        // Wait for models to load instead of trying to load them directly
        await new Promise(resolve => {
          const checkModels = () => {
            if (faceApiModelsLoaded) {
              resolve(true);
            } else {
              setTimeout(checkModels, 500);
            }
          };
          checkModels();
        });
      }

      // Set up camera constraints
      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } as MediaTrackConstraints
      };

      try {
        const preferredCameraId = await getPreferredCamera();
        if (preferredCameraId) {
          constraints.video = {
            ...(constraints.video as MediaTrackConstraints),
            deviceId: { ideal: preferredCameraId }
          };
        }
      } catch (error) {
        console.log('Could not get preferred camera, using default');
      }

      console.log('Attempting to start webcam with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store the stream reference
      streamRef.current = stream;

      if (videoRef.current) {
        // Set up video element
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true; // Mute to avoid feedback

        // Clear any previous processed faces
        setProcessedFaces([]);

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = async () => {
            try {
              // Start playing the video
              await video.play();
              console.log('Video play() successful');
              resolve();
            } catch (playError) {
              console.error('Error playing video:', playError);
              alert('Error starting video stream. Please try again.');
              stopWebcam();
            }
          };
        });

        // Reset the processing flag
        processingActive.current = false;

        // Set webcam as active BEFORE starting processing
        setIsWebcamActive(true);
        console.log('Video is playing, starting face detection');
        console.log('Match threshold set to:', matchThreshold);

        // Give a small delay to ensure everything is ready
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            console.log('Starting webcam stream after delay');
            handleWebcamStream();
          } else {
            console.log('Video not ready yet, waiting a bit longer');
            setTimeout(() => {
              if (videoRef.current) {
                console.log('Trying again after additional delay');
                handleWebcamStream();
              }
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please ensure you have granted camera permissions.');
      stopWebcam();
    }
  };

  const getPreferredCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available cameras:', videoDevices.map(d => ({
        label: d.label || 'Unnamed camera',
        id: d.deviceId
      })));

      if (videoDevices.length === 0) {
        console.log('No cameras found');
        return null;
      }

      const preferredCamera = videoDevices.find(device => {
        const label = device.label.toLowerCase();
        return (
          label.includes('truevision') ||
          label.includes('hp') ||
          label.includes('webcam') ||
          label.includes('integrated') ||
          label.includes('built-in')
        );
      });

      if (preferredCamera) {
        console.log('Using camera:', preferredCamera.label);
        return preferredCamera.deviceId;
      }

      console.log('Using default camera:', videoDevices[0].label);
      return videoDevices[0].deviceId;
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return null;
    }
  };

  const renderProcessedFaces = () => {
    if (processedFaces.length === 0) return null;

    // Get only the faces from the current session (based on sourceImages count)
    const currentSessionFaces = processedFaces.slice(-Math.min(processedFaces.length, sourceImages.length));

    if (currentSessionFaces.length === 0) return null;

    return (
      <div className="metrics-panel">
        <div className="metrics-header" onClick={() => setIsMetricsPanelExpanded(!isMetricsPanelExpanded)}>
          <h3>Face Recognition Metrics</h3>
          <button
            className="metrics-toggle"
            title={isMetricsPanelExpanded ? "Collapse" : "Expand"}
          >
            {isMetricsPanelExpanded ? "−" : "+"}
          </button>
        </div>

        <div className={`metrics-content ${isMetricsPanelExpanded ? 'expanded' : 'collapsed'}`}>
          {currentSessionFaces.map((face, index) => (
            <div key={index} className="processed-face-info">
              <div className="metric-row">
                <span className="metric-label">Face ID:</span>
                <span className="metric-value">Image_{index + 1}</span>
              </div>

              {face.match && (
                <>
                  {showConfidence && (
                    <div className="metric-row">
                      <span className="metric-label">Match Confidence:</span>
                      <span className="metric-value confidence-value">
                        {((1 - face.match.distance) * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <div className="metric-row">
                    <span className="metric-label">{showConfidence ? 'Distance Score' : 'Match Status'}:</span>
                    <span className="metric-value">
                      {showConfidence ? face.match.distance.toFixed(4) : 'Positive Match'}
                    </span>
                  </div>
                </>
              )}

              <div className="metric-row">
                <span className="metric-label">Status:</span>
                <span className={`metric-value status-value ${face.match ? 'status-match' : 'status-nomatch'}`}>
                  {face.match ? 'MATCH FOUND' : 'NO MATCH'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sourceOptions = [
    { id: 'image', label: 'Upload Image', icon: <Upload /> },
    { id: 'webcam', label: 'Camera', icon: <Camera /> },
  ];

  // Real-world search sources
  const sinkOptions = [
    { id: 'cctv', label: 'CCTV Cameras', icon: <img src={cctvIcon} alt="CCTV" className="custom-icon" /> },
    { id: 'drones', label: 'Drones', icon: <img src={droneIcon} alt="Drone" className="custom-icon" /> },
    { id: 'local', label: 'Local Media', icon: <Upload /> },
  ];

  // Testing options
  const testingOptions = [
    { id: 'webcam', label: 'Live Webcam', icon: <img src={webcamIcon} alt="Webcam" className="custom-icon" /> },
  ];

  // This function is used to process video files for face detection
  // It's currently not used directly but kept for future functionality
  /* @ts-ignore */
  const processVideo = async (video: HTMLVideoElement) => {
    const canvas = mediaCanvasRef.current;
    if (!canvas || !faceMatcher) {
      console.warn('Cannot process video: canvas or faceMatcher not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Cannot process video: canvas context not available');
      return;
    }

    console.log('Setting up video processing...');

    const processFrame = async () => {
      if (video.paused || video.ended) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Determine which face detection model to use based on performanceMode setting
      let detectionOptions;

      if (performanceMode) {
        // Use TinyYolov2 in performance mode
        detectionOptions = new faceapi.TinyYolov2Options({
          scoreThreshold: 0.5,
          inputSize: 224
        });
        console.log('Using TinyYolov2 (performance mode) for local media processing');
      } else {
        // Use SSD MobileNet with very permissive parameters to detect more challenging faces
        detectionOptions = new faceapi.SsdMobilenetv1Options({
          // Use a very low confidence threshold to detect more faces
          minConfidence: 0.2,
          // Increase the number of results to consider more potential faces
          maxResults: 15
        });
        console.log('Using optimized SSD MobileNet for local media processing');
      }

      const detections = await faceapi.detectAllFaces(canvas, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, {
        width: canvas.width,
        height: canvas.height
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      resizedDetections.forEach(detection => {
        const match = faceMatcher.findBestMatch(detection.descriptor);
        const isMatch = match.distance < matchThreshold;
        const confidence = (1 - match.distance) * 100;

        // Apply privacy mode - blur non-matching faces if enabled
        if (privacyMode && !isMatch) {
          try {
            // Get the face region
            const box = detection.detection.box;
            const faceRegion = ctx.getImageData(box.x, box.y, box.width, box.height);

            // Apply a blur effect to the face region
            const blurRadius = 10;
            const blurredFace = applyBlurEffect(faceRegion, blurRadius, box.width, box.height);

            // Put the blurred face back on the canvas
            ctx.putImageData(blurredFace, box.x, box.y);

            console.log('Applied blur to non-matching face in local media (privacy mode)');
          } catch (error) {
            console.error('Error applying privacy blur in local media:', error);
          }
        }

        const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
          label: isMatch
            ? showConfidence ? `Match: ${confidence.toFixed(2)}%` : 'Match'
            : 'No Match',
          boxColor: isMatch ? '#00ff00' : '#ff0000',
          lineWidth: 2
        });
        drawBox.draw(canvas);
      });

      requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      processFrame();
      console.log('Video processing started');
    });
  };

  if (modelError) {
    return (
      <div className="error-message">
        {modelError}
      </div>
    );
  }

  if (!modelsLoaded) {
    return (
      <div className="loading-message">
        <div className="loading-spinner" />
        <h2 className="loading-title">Loading Face Detection Models</h2>
        <p className="loading-subtitle">Preparing advanced facial recognition capabilities...</p>
        <div className="loading-progress">
          <div className="loading-progress-bar"></div>
        </div>
      </div>
    );
  }

  const handleSourceOptionClick = (optionId: string) => {
    // Clear processed faces when switching sources
    setProcessedFaces([]);

    if (optionId === 'webcam') {
      setShowCamera(true);
      setSelectedSource(null);
    } else if (optionId === 'cctv') {
      // Show CCTV connection settings
      setShowCctvSettings(true);
      setSelectedSource(null);
    } else if (optionId === 'drones') {
      // Show drone connection settings
      setShowDroneSettings(true);
      setSelectedSource(null);
    } else if (optionId === 'local') {
      // Show local media component
      setShowLocalMedia(true);
      setSelectedSource(null);
    } else {
      // Always set the selected source to the option clicked
      // This ensures the upload UI stays visible when clicking on it again
      setSelectedSource(optionId);

      // If it's the image option and we have pending images, show them
      if (optionId === 'image' && pendingImages.length > 0) {
        // Generate preview images for any pending images that don't have previews yet
        const previewPendingImages = async () => {
          // Only generate previews if we don't have source images yet
          if (sourceImages.length < pendingImages.length) {
            const newSourceImages = [...sourceImages];

            // Generate previews for any new pending images
            for (let i = sourceImages.length; i < pendingImages.length; i++) {
              const file = pendingImages[i];
              const imageData = await readFileAsDataURL(file);
              if (imageData) {
                newSourceImages.push(imageData);
              }
            }

            // Update source images with previews
            if (newSourceImages.length > sourceImages.length) {
              setSourceImages(newSourceImages);
              if (!sourceImage && newSourceImages.length > 0) {
                setSourceImage(newSourceImages[0]);
              }
            }
          }
        };

        previewPendingImages();
      }
    }
  };

  const renderActionButton = () => {
    // Always show the button, but disable it if no source image
    const noSourceImage = !sourceImage;

    return (
      <div className="webcam-controls">
        {!isWebcamActive ? (
          <button
            className="webcam-button start-button"
            onClick={startWebcam}
            disabled={isProcessing}
            title={noSourceImage ? 'Please upload reference images first' : 'Start face detection'}
          >
            <Camera size={20} />
            Start Detection
          </button>
        ) : (
          <button
            className="webcam-button stop-button"
            onClick={stopWebcam}
          >
            <X size={20} />
            Stop Detection
          </button>
        )}
      </div>
    );
  };

  const handleCameraCapture = (imageData: string) => {
    // Get current images and add the new one
    const currentImages = [...sourceImages];
    const currentPendingImages = [...pendingImages];

    // Add the new image to the list
    currentImages.push(imageData);

    // Set the first image as the primary source image if none exists
    if (!sourceImage) {
      setSourceImage(imageData);
    }

    // Update the source images array
    setSourceImages(currentImages);
    setShowCamera(false);
    setSelectedSource(null);

    // Create a File object from the image data
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const timestamp = new Date().getTime();
    const file = new File([blob], `camera-capture-${timestamp}.jpg`, { type: mimeString });

    // Add the new file to pending images
    currentPendingImages.push(file);
    setPendingImages(currentPendingImages);

    // Update reference images count
    const newCount = currentImages.length;
    setReferenceImagesCount(newCount);

    // Show warning if fewer than recommended images
    if (newCount < minRecommendedImages) {
      setShowReferenceWarning(true);
      console.warn(`Only ${newCount} reference images provided. For better accuracy, ${minRecommendedImages} or more are recommended.`);
    } else {
      setShowReferenceWarning(false);
    }

    // Set flag to show the process button
    setImagesReadyToProcess(true);

    console.log(`Camera capture added. Total images: ${newCount}`);
  };

  // We don't need a separate function for camera captures since processReferenceImages handles both

  const CameraCapture: React.FC<{ onCapture: (image: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.enabled = false;
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
    }, []);

    useEffect(() => {
      let mounted = true;

      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });

          if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          alert('Unable to access camera');
          onClose();
        }
      };

      startCamera();

      return () => {
        mounted = false;
        stopCamera();
      };
    }, [onClose, stopCamera]);

    const captureImage = useCallback(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg');
          stopCamera();
          onCapture(imageData);
          onClose();
        }
      }
    }, [onCapture, onClose, stopCamera]);

    const handleClose = useCallback(() => {
      stopCamera();
      requestAnimationFrame(() => {
        onClose();
      });
    }, [onClose, stopCamera]);

    return (
      <div className="camera-capture-modal">
        <div className="camera-capture-content">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-preview"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} data-will-read-frequently="true" />
          <div className="camera-controls">
            <button onClick={captureImage} className="capture-button">
              Take Photo
            </button>
            <button onClick={handleClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const exportMatchHistory = () => {
    // Create a comprehensive export object with all relevant data
    const exportData = {
      matchHistory,
      processedFaces: processedFaces.map(face => ({
        // Convert Float32Array to regular array for JSON serialization
        descriptor: Array.from(face.descriptor),
        detection: {
          box: face.detection.box,
          score: face.detection.score,
          classScore: face.detection.classScore
        },
        match: face.match
      })),
      stats: {
        totalSearches: matchHistory.length,
        matchesFound: matchHistory.filter(match => match.distance < 0.6).length,
        referenceImagesCount: sourceImages.length,
        timestamp: new Date().toISOString()
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'guardian-vision-data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearMatchHistory = () => {
    setMatchHistory([]);
  };

  // Handle CCTV settings change
  const handleCctvSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCctvSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Drone settings change
  const handleDroneSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDroneSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Connect to CCTV
  const connectToCctv = () => {
    // Simulate connection process
    setIsProcessing(true);
    setTimeout(() => {
      // Randomly decide if a device is available (for demo purposes)
      const deviceAvailable = Math.random() > 0.5;

      if (deviceAvailable) {
        setCctvConnected(true);
        setShowCctvSettings(false);
        // Show success message
        alert('Successfully connected to CCTV camera');
      } else {
        // Show no device available message
        alert('No CCTV device available at the specified address. Please check your connection settings and try again.');
      }

      setIsProcessing(false);
    }, 2000);
  };

  // Connect to Drone
  const connectToDrone = () => {
    // Simulate connection process
    setIsProcessing(true);
    setTimeout(() => {
      // Randomly decide if a device is available (for demo purposes)
      const deviceAvailable = Math.random() > 0.5;

      if (deviceAvailable) {
        setDroneConnected(true);
        setShowDroneSettings(false);
        // Show success message
        alert('Successfully connected to drone');
      } else {
        // Show no device available message
        alert('No drone available with the specified ID. Please check your connection settings and try again.');
      }

      setIsProcessing(false);
    }, 2000);
  };

  const Tutorial: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
      <div className="tutorial-overlay">
        <div className="tutorial-content">
          <h2>How to Use Guardian Vision</h2>
          <p className="tutorial-intro">Guardian Vision helps you locate missing persons using advanced facial recognition technology. Follow these steps to get started:</p>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <h3>Step 1: Upload Reference Images</h3>
              <p>Upload 3-5 clear photos of the person you're looking for. Multiple reference images improve recognition accuracy.</p>
            </div>
            <div className="tutorial-step">
              <h3>Step 2: Choose Search Method</h3>
              <p>Select from available search sources:</p>
              <ul>
                <li><strong>Local Media</strong>: Upload images or videos from your device</li>
                <li><strong>Live Webcam</strong>: Use your computer's camera for testing</li>
                <li><strong>CCTV Cameras</strong>: Connect to surveillance networks</li>
                <li><strong>Drone Feeds</strong>: Connect to aerial surveillance</li>
              </ul>
            </div>
            <div className="tutorial-step">
              <h3>Step 3: Test Face Recognition</h3>
              <p>Use the "Start Detection" button to test how the face recognition model works with your reference images. This is for testing purposes only.</p>
            </div>
            <div className="tutorial-step">
              <h3>Step 4: Review Results</h3>
              <p>Matches will be highlighted with confidence scores. View match details in the processed results section.</p>
            </div>
            <div className="tutorial-step">
              <h3>Step 5: Use the Dashboard</h3>
              <p>Access the Dashboard to view analytics, recent searches, and performance metrics. Use the Refresh button to update data and Clear History to remove search records.</p>
            </div>
          </div>
          <button className="tutorial-close" onClick={onClose}>Got it!</button>
        </div>
      </div>
    );
  };

  // Old Dashboard component removed

  // Function to add a toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Prevent spam by checking if a toast is already active
    if (isToastActive) return;

    setIsToastActive(true);

    const newToast = {
      id: Date.now(),
      message,
      type
    };
    setToasts(prevToasts => [...prevToasts, newToast]);

    // Allow new toasts after 3 seconds
    setTimeout(() => {
      setIsToastActive(false);
    }, 3000);

    // Remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== newToast.id));
    }, 4000);
  };

  const handleMatch = (match: FaceMatch) => {
    // Determine if this is a successful match based on the distance
    const isFound = match.distance < 0.6; // Threshold for considering a match as "found"

    // Determine the source based on selected sinks or current context
    let source = 'unknown';
    if (selectedSinks.length > 0) {
      source = selectedSinks[0];
    } else if (showLocalMedia) {
      source = 'local';
    } else if (isWebcamActive) {
      source = 'webcam';
    }

    // Add found property and source to the match
    const enhancedMatch = {
      ...match,
      found: isFound,
      source: source,
      timestamp: new Date() // Ensure we have a timestamp
    };

    // Show toast notification for match with location if geolocation is enabled
    if (isFound && geolocationEnabled && match.location) {
      const lat = match.location.coords.latitude.toFixed(6);
      const lng = match.location.coords.longitude.toFixed(6);
      addToast(`Match found at location: ${lat}, ${lng}`, 'success');
    }

    // Update match history
    console.log('Adding match to history:', enhancedMatch);
    setMatchHistory(prev => [enhancedMatch, ...prev]);

    if (geolocationEnabled) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          setMatchHistory(prev => [{
            ...enhancedMatch,
            location: position
          }, ...prev.slice(1)]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className={`guardian-vision-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prevToasts => prevToasts.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      <div className="guardian-header">
        <Link to="/projects" className="back-button">
          <ArrowLeft />
          <span>Back to Projects</span>
        </Link>
        <div className="header-controls">
          <div className="theme-switch-wrapper">
            <label className="guardian-theme-switch">
              <input
                type="checkbox"
                checked={!isDarkMode}
                onChange={() => setIsDarkMode(!isDarkMode)}
              />
              <div className="guardian-slider">
                <div className="guardian-gooey-ball"></div>
                <div className="guardian-gooey-icons">
                  <svg className="guardian-sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    <path d="M12 5V3M12 21v-2M5 12H3m18 0h-2M6.4 6.4L5 5m12.6 12.6l1.4 1.4M6.4 17.6L5 19m12.6-12.6L19 5"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <svg className="guardian-moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <motion.main
        className="guardian-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="title">Guardian Vision</h1>
        <p className="description">
          Advanced facial recognition system for locating missing persons through multiple surveillance sources.
          <span className="feature-badge">Optimized for improved side-profile detection</span>
        </p>

        <Settings
          showConfidence={showConfidence}
          setShowConfidence={setShowConfidence}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          geolocationEnabled={geolocationEnabled}
          setGeolocationEnabled={setGeolocationEnabled}
          offlineMode={offlineMode}
          setOfflineMode={setOfflineMode}
          showAdvancedSettings={showAdvancedSettings}
          setShowAdvancedSettings={setShowAdvancedSettings}
          matchThresholdSlider={matchThresholdSlider}
          setMatchThresholdSlider={setMatchThresholdSlider}
          frameSkip={frameSkip}
          setFrameSkip={setFrameSkip}
          performanceMode={performanceMode}
          setPerformanceMode={setPerformanceMode}
          onOpenDashboard={() => setShowDashboard(true)}
        />

        <div className="action-buttons">
          <button
            className="action-button"
            onClick={() => setShowTutorial(true)}
          >
            Tutorial
          </button>
          <button
            className="action-button"
            onClick={() => setShowDashboard(true)}
          >
            Dashboard
          </button>
          <button
            className="action-button"
            onClick={exportMatchHistory}
          >
            Export Data
          </button>
        </div>

        <section className="source-section">
          <h2>Select Reference Images</h2>
          <p className="reference-description">
            For best results, provide 3-5 different images of the person you want to recognize.
            Using multiple reference images significantly improves recognition accuracy.
          </p>
          <div className="source-options">
            {sourceOptions.map((option) => (
              <motion.button
                key={option.id}
                className={`source-option ${selectedSource === option.id ? 'selected' : ''}`}
                onClick={() => {
                  handleSourceOptionClick(option.id);
                  // If there are pending images, show them
                  if (option.id === 'image' && pendingImages.length > 0) {
                    setImagesReadyToProcess(true);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option.icon}
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>

          {selectedSource === 'image' && (
            <div className="upload-container">
              <label className="file-input-label">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleSourceUpload(e);
                    e.target.value = '';
                    setSelectedSource(null);
                  }}
                  className="file-input"
                />
                <span>
                  {pendingImages.length > 0
                    ? `${pendingImages.length} files selected (${minRecommendedImages}-${maxAllowedImages} recommended)`
                    : `Choose files or drag them here (${minRecommendedImages}-${maxAllowedImages} recommended)`
                  }
                </span>
              </label>

              {/* Process button - only shown when images are ready to process */}
              {imagesReadyToProcess && (
                <motion.button
                  className="action-button process-button"
                  onClick={processReferenceImages}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Process Images
                </motion.button>
              )}
              {sourceImage && (
                <div className="preview-container">
                  <img src={sourceImage} alt="Reference" className="preview-image" />
                  {referenceImagesCount > 1 && (
                    <div className="reference-count" title="Hover to see all images">
                      +{referenceImagesCount - 1} more images
                      <div className="image-hover-preview">
                        <h3 className="preview-title">Reference Images</h3>
                        {sourceImages.map((img, index) => (
                          <div key={index} className="preview-thumbnail">
                            <img src={img} alt={`Reference ${index + 1}`} />
                            <span>Image {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    className="remove-image"
                    onClick={() => {
                      setSourceImage(null);
                      setSourceImages([]);
                      setFaceEncodings([]);
                      setReferenceImagesCount(0);
                      setImagesReadyToProcess(false);
                      setPendingImages([]);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              {showReferenceWarning && sourceImage && (
                <div className="reference-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Using fewer than 3 reference images may reduce recognition accuracy.</span>
                </div>
              )}
            </div>
          )}

          {/* Common process button shown when images are ready to process */}
          {!selectedSource && imagesReadyToProcess && sourceImage && (
            <div className="camera-process-container">
              <div className="preview-container">
                <img src={sourceImage} alt="Reference" className="preview-image" />
                {referenceImagesCount > 1 && (
                  <div className="reference-count" title="Hover to see all images">
                    +{referenceImagesCount - 1} more images
                    <div className="image-hover-preview">
                      <h3 className="preview-title">Reference Images</h3>
                      {sourceImages.map((img, index) => (
                        <div key={index} className="preview-thumbnail">
                          <img src={img} alt={`Reference ${index + 1}`} />
                          <span>Image {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  className="remove-image"
                  onClick={() => {
                    setSourceImage(null);
                    setSourceImages([]);
                    setFaceEncodings([]);
                    setReferenceImagesCount(0);
                    setImagesReadyToProcess(false);
                    setPendingImages([]);
                  }}
                >
                  ×
                </button>
              </div>

              <motion.button
                className="action-button process-button"
                onClick={processReferenceImages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Process Images ({referenceImagesCount})
              </motion.button>

              {showReferenceWarning && (
                <div className="reference-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Using fewer than {minRecommendedImages} reference images may reduce recognition accuracy.</span>
                </div>
              )}

              <div className="capture-more-container">
                <button
                  className="capture-more-button"
                  onClick={() => setShowCamera(true)}
                >
                  Capture Another Image
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="search-and-testing-container">
          <div className={`sink-section ${selectedSinks.some(id => testingOptions.some(opt => opt.id === id)) ? 'disabled' : ''}`}>
            <h2>Select Search Sources</h2>
            <div className="sink-options">
              {sinkOptions.map((option) => (
                <motion.button
                  key={option.id}
                  className={`sink-option ${selectedSinks.includes(option.id) ? 'selected' : ''} ${(option.id === 'cctv' && cctvConnected) || (option.id === 'drones' && droneConnected) ? 'connected' : ''}`}
                  onClick={() => {
                    // If this option is already selected, deselect it
                    if (selectedSinks.includes(option.id)) {
                      setSelectedSinks([]);
                    } else {
                      // Otherwise, clear all selections and select only this one
                      // Also clear any testing options
                      setSelectedSinks([option.id]);

                      // Show appropriate settings modal
                      if (option.id === 'cctv') {
                        if (cctvConnected) {
                          // If already connected, show status
                          alert('CCTV Camera already connected. Status: Active');
                        } else {
                          setShowCctvSettings(true);
                        }
                      } else if (option.id === 'drones') {
                        if (droneConnected) {
                          // If already connected, show status
                          alert('Drone already connected. Status: Active');
                        } else {
                          setShowDroneSettings(true);
                        }
                      } else if (option.id === 'local') {
                        // Show local media component
                        setShowLocalMedia(true);
                      }
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className={`testing-section ${selectedSinks.some(id => sinkOptions.some(opt => opt.id === id)) ? 'disabled' : ''}`}>
            <h2>Testing</h2>
            <div className="testing-options">
              {testingOptions.map((option) => (
                <motion.button
                  key={option.id}
                  className={`sink-option ${selectedSinks.includes(option.id) ? 'selected' : ''}`}
                  onClick={() => {
                    // If this option is already selected, deselect it
                    if (selectedSinks.includes(option.id)) {
                      setSelectedSinks([]);
                    } else {
                      // Otherwise, clear all selections and select only this testing option
                      setSelectedSinks([option.id]);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Detection button moved inside testing section */}
            <div className="detection-controls">
              {renderActionButton()}
            </div>
          </div>
        </section>

        {/* Original action button position - removed */}
      </motion.main>

      <div
        className="webcam-container"
        style={{
          display: isWebcamActive ? 'block' : 'none'
        }}
      >
        <video
          ref={videoRef}
          style={videoStyle}
          playsInline
        />
        <canvas
          ref={webcamCanvasRef}
          className="webcam-overlay"
          data-will-read-frequently="true"
        />

        {/* Match results debug panel */}
        {matchResults && (
          <div className={`match-results-debug ${matchResults.includes('NO MATCH') ? 'no-match' : 'match'}`}>
            <button
              className="debug-panel-toggle"
              onClick={() => setIsDebugPanelExpanded(!isDebugPanelExpanded)}
              title={isDebugPanelExpanded ? "Collapse" : "Expand"}
            >
              {isDebugPanelExpanded ? "−" : "+"}
            </button>
            <pre className={isDebugPanelExpanded ? "expanded" : "collapsed"}>{matchResults}</pre>
          </div>
        )}
        {processedFaces.length > 0 && (
          <div className={`face-match-label ${processedFaces[processedFaces.length - 1].match ? 'match' : 'no-match'}`}>
            {processedFaces[processedFaces.length - 1].match ? (
              showConfidence ? (
                <>Match Found: {
                  isNaN(((1 - processedFaces[processedFaces.length - 1].match?.distance!) * 100))
                    ? '0.00'
                    : ((1 - processedFaces[processedFaces.length - 1].match?.distance!) * 100).toFixed(2)
                }%</>
              ) : (
                <>Match Found</>
              )
            ) : (
              <>No Match Found</>
            )}
          </div>
        )}
      </div>

      {renderProcessedFaces()}

      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner"></div>
            <p>Processing Face Recognition</p>
            {uploadProgress > 0 && (
              <div className="processing-progress">
                <div
                  className="processing-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
                <span>{uploadProgress}%</span>
              </div>
            )}
            <div className="processing-info">
              {uploadProgress < 30 && 'Initializing face detection...'}
              {uploadProgress >= 30 && uploadProgress < 60 && 'Detecting facial features...'}
              {uploadProgress >= 60 && uploadProgress < 90 && 'Creating face encodings...'}
              {uploadProgress >= 90 && 'Finalizing...'}
            </div>
          </div>
        </div>
      )}

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Dashboard Component */}
      {showDashboard && (
        <div>
          {/* Use type assertion to fix TypeScript error */}
          {React.createElement(DashboardComponent as any, {
            onClose: () => setShowDashboard(false),
            processedFaces,
            matchHistory,
            referenceImagesCount: sourceImages.length,
            clearHistory: clearMatchHistory
          })}
        </div>
      )}

      {/* Local Media Component */}
      {showLocalMedia && faceMatcher && (
        <LocalMedia
          faceMatcher={faceMatcher}
          onClose={() => setShowLocalMedia(false)}
          matchThreshold={matchThreshold}
          handleMatch={handleMatch}
        />
      )}

      {/* Location Indicator */}
      <LocationIndicator
        geoStatus={geoStatus}
        currentLocation={currentLocation}
        locationUpdateTime={locationUpdateTime}
        matchFound={processedFaces.length > 0 && processedFaces[processedFaces.length - 1].match !== null}
      />

      {/* CCTV Settings Modal */}
      {showCctvSettings && (
        <div className="connection-modal-overlay">
          <div className="connection-modal">
            <h2>CCTV Camera Connection</h2>
            <div className="connection-form">
              <div className="form-group">
                <label htmlFor="protocol">Protocol</label>
                <select
                  id="protocol"
                  name="protocol"
                  value={cctvSettings.protocol}
                  onChange={handleCctvSettingsChange}
                >
                  <option value="rtsp">RTSP</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ipAddress">IP Address</label>
                <input
                  type="text"
                  id="ipAddress"
                  name="ipAddress"
                  value={cctvSettings.ipAddress}
                  onChange={handleCctvSettingsChange}
                  placeholder="192.168.1.100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="port">Port</label>
                <input
                  type="text"
                  id="port"
                  name="port"
                  value={cctvSettings.port}
                  onChange={handleCctvSettingsChange}
                  placeholder="8080"
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={cctvSettings.username}
                  onChange={handleCctvSettingsChange}
                  placeholder="admin"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={cctvSettings.password}
                  onChange={handleCctvSettingsChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="connection-buttons">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowCctvSettings(false);
                    setSelectedSinks([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="connect-button"
                  onClick={connectToCctv}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drone Settings Modal */}
      {showDroneSettings && (
        <div className="connection-modal-overlay">
          <div className="connection-modal">
            <h2>Drone Connection</h2>
            <div className="connection-form">
              <div className="form-group">
                <label htmlFor="connectionType">Connection Type</label>
                <select
                  id="connectionType"
                  name="connectionType"
                  value={droneSettings.connectionType}
                  onChange={handleDroneSettingsChange}
                >
                  <option value="wifi">Wi-Fi</option>
                  <option value="bluetooth">Bluetooth</option>
                  <option value="radio">Radio Control</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="droneId">Drone ID</label>
                <input
                  type="text"
                  id="droneId"
                  name="droneId"
                  value={droneSettings.droneId}
                  onChange={handleDroneSettingsChange}
                  placeholder="DJI-1234"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ssid">Network SSID</label>
                <input
                  type="text"
                  id="ssid"
                  name="ssid"
                  value={droneSettings.ssid}
                  onChange={handleDroneSettingsChange}
                  placeholder="Drone-Network"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={droneSettings.password}
                  onChange={handleDroneSettingsChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label htmlFor="channel">Channel</label>
                <select
                  id="channel"
                  name="channel"
                  value={droneSettings.channel}
                  onChange={handleDroneSettingsChange}
                >
                  <option value="1">Channel 1</option>
                  <option value="2">Channel 2</option>
                  <option value="3">Channel 3</option>
                  <option value="4">Channel 4</option>
                  <option value="5">Channel 5</option>
                </select>
              </div>

              <div className="connection-buttons">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowDroneSettings(false);
                    setSelectedSinks([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="connect-button"
                  onClick={connectToDrone}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianVision;
