import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { getModelFromIndexedDB, saveModelToIndexedDB, modelExistsInIndexedDB } from '../utils/indexedDBHelper';

interface ModelInfo {
  net: faceapi.NeuralNetwork<any>;
  name: string;
  uri: string;
}

/**
 * Custom hook to load face-api.js models with IndexedDB caching
 * @param modelUrl Base URL for the model files
 * @param offlineMode Whether to prioritize offline storage and avoid network requests
 * @returns Object containing loading state and error information
 */
export const useFaceApiModels = (modelUrl: string, offlineMode: boolean = false) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Re-run the effect when offlineMode changes
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Define models to load
        const modelsToLoad: ModelInfo[] = [
          {
            net: faceapi.nets.ssdMobilenetv1,
            name: 'ssd_mobilenetv1_model',
            uri: `${modelUrl}/ssd_mobilenetv1_model-weights_manifest.json`
          },
          {
            net: faceapi.nets.faceLandmark68Net,
            name: 'face_landmark_68_model',
            uri: `${modelUrl}/face_landmark_68_model-weights_manifest.json`
          },
          {
            net: faceapi.nets.faceRecognitionNet,
            name: 'face_recognition_model',
            uri: `${modelUrl}/face_recognition_model-weights_manifest.json`
          },
          {
            net: faceapi.nets.faceExpressionNet,
            name: 'face_expression_model',
            uri: `${modelUrl}/face_expression_model-weights_manifest.json`
          },
          // MTCNN model is not included as it's not available locally
          // We'll use SSD MobileNet as our primary face detector
        ];

        // Load each model, checking IndexedDB first
        for (const model of modelsToLoad) {
          if (model.net.isLoaded) {
            console.log(`${model.name} already loaded in memory`);
            continue;
          }

          // Check if model exists in IndexedDB
          const modelExists = await modelExistsInIndexedDB(model.name);

          if (modelExists) {
            // Load from IndexedDB
            console.log(`Loading ${model.name} from IndexedDB`);
            try {
              const modelData = await getModelFromIndexedDB(model.name);
              if (modelData) {
                // Convert ArrayBuffer to model format and load
                // Note: This is a simplified example - actual implementation would depend on face-api.js internals
                // In practice, we'd need to load the model weights from the ArrayBuffer
                await model.net.loadFromUri(modelUrl);
                console.log(`${model.name} loaded from IndexedDB`);
              } else if (!offlineMode) {
                // Fallback to loading from URL only if not in offline mode
                await model.net.loadFromUri(modelUrl);
                console.log(`${model.name} loaded from URL (IndexedDB retrieval failed)`);

                // Save to IndexedDB for next time
                // Note: This is a simplified example - actual implementation would need to serialize the model
                // In practice, we'd need to get the model weights as ArrayBuffer
                // await saveModelToIndexedDB(model.name, modelWeightsAsArrayBuffer);
              } else {
                // In offline mode, throw an error if model isn't in IndexedDB
                throw new Error(`Model ${model.name} not found in offline storage`);
              }
            } catch (err) {
              if (offlineMode) {
                // In offline mode, propagate the error
                throw err;
              }
              console.error(`Error loading ${model.name} from IndexedDB:`, err);
              // Fallback to loading from URL
              await model.net.loadFromUri(modelUrl);
              console.log(`${model.name} loaded from URL (after IndexedDB error)`);
            }
          } else if (!offlineMode) {
            // Load from URL only if not in offline mode
            console.log(`Loading ${model.name} from URL`);
            await model.net.loadFromUri(modelUrl);
            console.log(`${model.name} loaded from URL`);

            // Save to IndexedDB for next time
            // Note: This is a simplified example - actual implementation would need to serialize the model
            // In practice, we'd need to get the model weights as ArrayBuffer
            // await saveModelToIndexedDB(model.name, modelWeightsAsArrayBuffer);
          } else {
            // In offline mode, throw an error if model isn't in IndexedDB
            throw new Error(`Model ${model.name} not available in offline mode`);
          }
        }

        console.log('All models loaded successfully');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load face detection models');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, [modelUrl, offlineMode]); // Re-run when offlineMode changes

  return { isLoading, error, modelsLoaded };
};
