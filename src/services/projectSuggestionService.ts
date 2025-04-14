// Interface for project suggestions
export interface ProjectSuggestion {
  id: string;
  email: string;
  suggestion: string;
  timestamp: number;
}

// Local storage key
const STORAGE_KEY = 'project_suggestions';

// Get all suggestions from local storage
export const getSuggestions = (): ProjectSuggestion[] => {
  const storedSuggestions = localStorage.getItem(STORAGE_KEY);
  return storedSuggestions ? JSON.parse(storedSuggestions) : [];
};

// Add a new suggestion to local storage
export const addSuggestion = (email: string, suggestion: string): ProjectSuggestion => {
  const suggestions = getSuggestions();
  
  // Create new suggestion object
  const newSuggestion: ProjectSuggestion = {
    id: Date.now().toString(),
    email,
    suggestion,
    timestamp: Date.now()
  };
  
  // Add to array and save to local storage
  suggestions.push(newSuggestion);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
  
  // In a real application, you might also send this to a server API
  console.log('New project suggestion saved:', newSuggestion);
  
  return newSuggestion;
};

// Clear all suggestions (for testing/admin purposes)
export const clearSuggestions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Get suggestion count
export const getSuggestionCount = (): number => {
  return getSuggestions().length;
};
