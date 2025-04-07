/**
 * Utility functions for working with IndexedDB to store and retrieve face-api.js models
 */

// Database configuration
const DB_NAME = 'GuardianVisionDB';
const DB_VERSION = 1;
const MODEL_STORE = 'models';

/**
 * Opens a connection to the IndexedDB database
 * @returns Promise with the database connection
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for models if it doesn't exist
      if (!db.objectStoreNames.contains(MODEL_STORE)) {
        db.createObjectStore(MODEL_STORE, { keyPath: 'name' });
        console.log('Created models object store');
      }
    };
  });
};

/**
 * Saves a model to IndexedDB
 * @param modelName Name of the model
 * @param modelData ArrayBuffer containing the model data
 * @returns Promise that resolves when the model is saved
 */
export const saveModelToIndexedDB = async (modelName: string, modelData: ArrayBuffer): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODEL_STORE], 'readwrite');
      const store = transaction.objectStore(MODEL_STORE);
      
      const request = store.put({
        name: modelName,
        data: modelData,
        timestamp: new Date().getTime()
      });
      
      request.onsuccess = () => {
        console.log(`Model ${modelName} saved to IndexedDB`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error saving model ${modelName}:`, event);
        reject(`Error saving model ${modelName}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in saveModelToIndexedDB:', error);
    throw error;
  }
};

/**
 * Retrieves a model from IndexedDB
 * @param modelName Name of the model to retrieve
 * @returns Promise with the model data as ArrayBuffer, or null if not found
 */
export const getModelFromIndexedDB = async (modelName: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODEL_STORE], 'readonly');
      const store = transaction.objectStore(MODEL_STORE);
      
      const request = store.get(modelName);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`Model ${modelName} retrieved from IndexedDB`);
          resolve(result.data);
        } else {
          console.log(`Model ${modelName} not found in IndexedDB`);
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error(`Error retrieving model ${modelName}:`, event);
        reject(`Error retrieving model ${modelName}`);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in getModelFromIndexedDB:', error);
    throw error;
  }
};

/**
 * Checks if a model exists in IndexedDB
 * @param modelName Name of the model to check
 * @returns Promise that resolves to true if the model exists, false otherwise
 */
export const modelExistsInIndexedDB = async (modelName: string): Promise<boolean> => {
  try {
    const modelData = await getModelFromIndexedDB(modelName);
    return modelData !== null;
  } catch (error) {
    console.error('Error checking if model exists:', error);
    return false;
  }
};

/**
 * Clears all models from IndexedDB
 * @returns Promise that resolves when all models are cleared
 */
export const clearModelsFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MODEL_STORE], 'readwrite');
      const store = transaction.objectStore(MODEL_STORE);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('All models cleared from IndexedDB');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error clearing models:', event);
        reject('Error clearing models');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error in clearModelsFromIndexedDB:', error);
    throw error;
  }
};
