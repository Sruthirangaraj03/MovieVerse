// LocalStorage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'movieverse_current_user',
  USERS: 'movieverse_users',
  SEARCH_HISTORY: 'movieverse_search_history',
  FAVORITES: 'movieverse_favorites',
  RECENTLY_SEARCHED: 'movieverse_recent_searches',
  SYNC_STATUS: 'movieverse_sync_status'
};

// Helper function to safely parse JSON
const safeJsonParse = (str, fallback = null) => {
  try {
    if (!str) return fallback;
    return JSON.parse(str);
  } catch (error) {
    console.error('Error parsing JSON from localStorage:', error);
    return fallback;
  }
};

// Helper function to safely stringify JSON
const safeJsonStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Error stringifying JSON for localStorage:', error);
    return null;
  }
};

// **SYNC STATUS MANAGEMENT**
// Track which items need to be synced with database when online
const getSyncStatus = (userEmail) => {
  try {
    const syncData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SYNC_STATUS), {});
    return syncData[userEmail] || {
      pendingFavoriteAdds: [],
      pendingFavoriteRemoves: [],
      lastSync: null
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      pendingFavoriteAdds: [],
      pendingFavoriteRemoves: [],
      lastSync: null
    };
  }
};

const setSyncStatus = (userEmail, status) => {
  try {
    const syncData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SYNC_STATUS), {});
    syncData[userEmail] = status;
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(syncData));
    return true;
  } catch (error) {
    console.error('Error setting sync status:', error);
    return false;
  }
};

const addToSyncQueue = (userEmail, action, data) => {
  try {
    const syncStatus = getSyncStatus(userEmail);
    
    if (action === 'add') {
      // Remove from pending removes if exists
      syncStatus.pendingFavoriteRemoves = syncStatus.pendingFavoriteRemoves.filter(
        item => item !== data.imdbID
      );
      // Add to pending adds if not already there
      if (!syncStatus.pendingFavoriteAdds.find(item => item.imdbID === data.imdbID)) {
        syncStatus.pendingFavoriteAdds.push(data);
      }
    } else if (action === 'remove') {
      // Remove from pending adds if exists
      syncStatus.pendingFavoriteAdds = syncStatus.pendingFavoriteAdds.filter(
        item => item.imdbID !== data
      );
      // Add to pending removes if not already there
      if (!syncStatus.pendingFavoriteRemoves.includes(data)) {
        syncStatus.pendingFavoriteRemoves.push(data);
      }
    }
    
    setSyncStatus(userEmail, syncStatus);
    console.log('📦 Added to sync queue:', action, data);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

// **USER AUTHENTICATION FUNCTIONS**
export const registerUser = (userData) => {
  try {
    const { name, email, password } = userData;
    
    // Validate input
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required' };
    }
    
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Get existing users
    const users = safeJsonParse(localStorage.getItem(STORAGE_KEYS.USERS), {});
    
    // Check if user already exists
    if (users[email]) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In a real app, this should be hashed
      createdAt: new Date().toISOString(),
      favorites: [],
      searchHistory: []
    };
    
    // Save user
    users[email] = newUser;
    
    // Try to save to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Set current user
      const currentUser = { id: newUser.id, name, email };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      
      return { success: true, user: currentUser };
    } catch (storageError) {
      console.error('Error saving to localStorage:', storageError);
      return { success: false, error: 'Failed to save user data. Storage might be full.' };
    }
    
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
};

export const loginUser = (email, password) => {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const users = safeJsonParse(localStorage.getItem(STORAGE_KEYS.USERS), {});
    const user = users[email];
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }
    
    // Set current user
    const currentUser = { id: user.id, name: user.name, email: user.email };
    
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      return { success: true, user: currentUser };
    } catch (storageError) {
      console.error('Error saving current user:', storageError);
      return { success: false, error: 'Failed to login. Please try again.' };
    }
    
  } catch (error) {
    console.error('Error logging in user:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
};

export const logoutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return { success: true };
  } catch (error) {
    console.error('Error logging out user:', error);
    return { success: false, error: 'Logout failed' };
  }
};

export const getCurrentUser = () => {
  try {
    return safeJsonParse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

// **ENHANCED FAVORITES FUNCTIONS WITH SYNC SUPPORT**
export const addToFavorites = (userEmail, movie) => {
  try {
    if (!userEmail || !movie) {
      console.error('❌ Missing userEmail or movie data');
      return false;
    }

    console.log('📦 Adding to localStorage favorites:', movie.Title);

    const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
    
    if (!favorites[userEmail]) {
      favorites[userEmail] = [];
    }
    
    // Check if movie is already in favorites
    const isAlreadyFavorite = favorites[userEmail].some(fav => fav.imdbID === movie.imdbID);
    if (isAlreadyFavorite) {
      console.log('⚠️ Movie already in localStorage favorites');
      return false;
    }
    
    // Add movie with timestamp and ensure all required fields
    const favoriteMovie = {
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year || 'N/A',
      Poster: movie.Poster || 'N/A',
      Genre: movie.Genre || 'N/A',
      Runtime: movie.Runtime || 'N/A',
      imdbRating: movie.imdbRating || 'N/A',
      Type: movie.Type || 'movie',
      Plot: movie.Plot || 'N/A',
      addedAt: new Date().toISOString(),
      // Store original movie data for potential sync
      originalData: movie
    };
    
    favorites[userEmail].push(favoriteMovie);
    
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      
      // Add to sync queue for later database sync
      addToSyncQueue(userEmail, 'add', favoriteMovie);
      
      console.log('✅ Successfully added to localStorage favorites');
      return true;
    } catch (storageError) {
      console.error('Error saving favorites:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

export const removeFromFavorites = (userEmail, movieId) => {
  try {
    if (!userEmail || !movieId) {
      console.error('❌ Missing userEmail or movieId');
      return false;
    }

    console.log('📦 Removing from localStorage favorites:', movieId);

    const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
    
    if (!favorites[userEmail]) {
      console.log('⚠️ No favorites found for user');
      return false;
    }
    
    const initialLength = favorites[userEmail].length;
    favorites[userEmail] = favorites[userEmail].filter(movie => movie.imdbID !== movieId);
    
    if (favorites[userEmail].length < initialLength) {
      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        
        // Add to sync queue for later database sync
        addToSyncQueue(userEmail, 'remove', movieId);
        
        console.log('✅ Successfully removed from localStorage favorites');
        return true;
      } catch (storageError) {
        console.error('Error saving favorites after removal:', storageError);
        return false;
      }
    }
    
    console.log('⚠️ Movie not found in localStorage favorites');
    return false;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

export const getFavorites = (userEmail) => {
  try {
    if (!userEmail) {
      console.log('⚠️ No userEmail provided for getFavorites');
      return [];
    }

    const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
    const userFavorites = favorites[userEmail] || [];
    
    console.log('📦 Retrieved from localStorage:', userFavorites.length, 'favorites');
    return userFavorites;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const isFavorite = (userEmail, movieId) => {
  try {
    if (!userEmail || !movieId) return false;

    const favorites = getFavorites(userEmail);
    const result = favorites.some(movie => movie.imdbID === movieId);
    
    console.log('📦 localStorage isFavorite check:', movieId, '=', result);
    return result;
  } catch (error) {
    console.error('Error checking if favorite:', error);
    return false;
  }
};

export const toggleFavorite = (userEmail, movie) => {
  try {
    console.log('🔄 Toggling localStorage favorite for:', movie.Title);
    
    if (isFavorite(userEmail, movie.imdbID)) {
      console.log('🔄 Removing from favorites');
      return removeFromFavorites(userEmail, movie.imdbID);
    } else {
      console.log('🔄 Adding to favorites');
      return addToFavorites(userEmail, movie);
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

// **SYNC FUNCTIONS FOR DATABASE INTEGRATION**
export const getPendingSyncData = (userEmail) => {
  return getSyncStatus(userEmail);
};

export const markAsSynced = (userEmail, syncedData = {}) => {
  try {
    const syncStatus = getSyncStatus(userEmail);
    
    // Remove synced items from pending queues
    if (syncedData.syncedAdds) {
      syncStatus.pendingFavoriteAdds = syncStatus.pendingFavoriteAdds.filter(
        item => !syncedData.syncedAdds.includes(item.imdbID)
      );
    }
    
    if (syncedData.syncedRemoves) {
      syncStatus.pendingFavoriteRemoves = syncStatus.pendingFavoriteRemoves.filter(
        item => !syncedData.syncedRemoves.includes(item)
      );
    }
    
    syncStatus.lastSync = new Date().toISOString();
    
    setSyncStatus(userEmail, syncStatus);
    console.log('✅ Marked as synced:', syncedData);
    return true;
  } catch (error) {
    console.error('Error marking as synced:', error);
    return false;
  }
};

export const syncWithDatabase = async (userEmail) => {
  try {
    console.log('🔄 Starting localStorage to database sync for:', userEmail);
    
    const syncStatus = getSyncStatus(userEmail);
    
    if (syncStatus.pendingFavoriteAdds.length === 0 && syncStatus.pendingFavoriteRemoves.length === 0) {
      console.log('✅ No pending sync items');
      return { success: true, message: 'No items to sync' };
    }
    
    // Import API functions dynamically to avoid circular dependency
    const { addToFavorites: apiAddToFavorites, removeFromFavorites: apiRemoveFromFavorites } = 
      await import('./api.js');
    
    const syncResults = {
      addSuccesses: [],
      addFailures: [],
      removeSuccesses: [],
      removeFailures: []
    };
    
    // Sync pending adds
    for (const movie of syncStatus.pendingFavoriteAdds) {
      try {
        const result = await apiAddToFavorites(userEmail, movie);
        if (result.success) {
          syncResults.addSuccesses.push(movie.imdbID);
        } else {
          syncResults.addFailures.push(movie.imdbID);
        }
      } catch (error) {
        console.error('Error syncing add:', error);
        syncResults.addFailures.push(movie.imdbID);
      }
    }
    
    // Sync pending removes
    for (const movieId of syncStatus.pendingFavoriteRemoves) {
      try {
        const result = await apiRemoveFromFavorites(userEmail, movieId);
        if (result.success) {
          syncResults.removeSuccesses.push(movieId);
        } else {
          syncResults.removeFailures.push(movieId);
        }
      } catch (error) {
        console.error('Error syncing remove:', error);
        syncResults.removeFailures.push(movieId);
      }
    }
    
    // Mark successful syncs
    if (syncResults.addSuccesses.length > 0 || syncResults.removeSuccesses.length > 0) {
      markAsSynced(userEmail, {
        syncedAdds: syncResults.addSuccesses,
        syncedRemoves: syncResults.removeSuccesses
      });
    }
    
    console.log('🔄 Sync completed:', syncResults);
    return {
      success: true,
      syncResults,
      message: `Synced ${syncResults.addSuccesses.length + syncResults.removeSuccesses.length} items successfully`
    };
    
  } catch (error) {
    console.error('Error syncing with database:', error);
    return { success: false, error: 'Sync failed' };
  }
};

// **MERGE DATABASE DATA WITH LOCALSTORAGE**
export const mergeFavoritesFromDatabase = (userEmail, databaseFavorites) => {
  try {
    console.log('🔄 Merging database favorites with localStorage');
    
    const localFavorites = getFavorites(userEmail);
    const localFavoriteIds = new Set(localFavorites.map(fav => fav.imdbID));
    
    // Convert database format to localStorage format
    const convertedDbFavorites = databaseFavorites.map(dbFav => ({
      imdbID: dbFav.movieId,
      Title: dbFav.title,
      Year: dbFav.year || 'N/A',
      Poster: dbFav.posterPath || 'N/A',
      Genre: dbFav.genre || 'N/A',
      Runtime: dbFav.runtime || 'N/A',
      imdbRating: dbFav.rating || 'N/A',
      Type: 'movie',
      Plot: 'N/A',
      addedAt: dbFav.addedAt || new Date().toISOString(),
      source: 'database'
    }));
    
    // Merge: add database favorites that aren't in localStorage
    const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
    if (!favorites[userEmail]) {
      favorites[userEmail] = [];
    }
    
    let addedCount = 0;
    for (const dbFav of convertedDbFavorites) {
      if (!localFavoriteIds.has(dbFav.imdbID)) {
        favorites[userEmail].push(dbFav);
        addedCount++;
      }
    }
    
    // Save merged favorites
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    
    console.log(`✅ Merged ${addedCount} database favorites into localStorage`);
    return { success: true, mergedCount: addedCount };
    
  } catch (error) {
    console.error('Error merging favorites from database:', error);
    return { success: false, error: 'Failed to merge database favorites' };
  }
};

export const removeFavorite = (userEmail, movieId) => {
  return removeFromFavorites(userEmail, movieId);
};

export const clearAllFavorites = (userEmail) => {
  try {
    if (!userEmail) return false;

    const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
    favorites[userEmail] = [];
    
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      
      // Clear sync queue for this user
      const syncStatus = getSyncStatus(userEmail);
      syncStatus.pendingFavoriteAdds = [];
      syncStatus.pendingFavoriteRemoves = [];
      setSyncStatus(userEmail, syncStatus);
      
      return true;
    } catch (storageError) {
      console.error('Error clearing favorites:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return false;
  }
};

// **SEARCH HISTORY FUNCTIONS**
export const addToSearchHistory = (userEmail, searchTerm) => {
  try {
    if (!searchTerm.trim()) return false;

    const history = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY), {});
    
    if (!history[userEmail]) {
      history[userEmail] = [];
    }
    
    // Remove if already exists to avoid duplicates
    history[userEmail] = history[userEmail].filter(term => 
      term.toLowerCase() !== searchTerm.toLowerCase()
    );
    
    // Add to beginning of array
    history[userEmail].unshift({
      term: searchTerm,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 searches
    if (history[userEmail].length > 50) {
      history[userEmail] = history[userEmail].slice(0, 50);
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
      return true;
    } catch (storageError) {
      console.error('Error saving search history:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error adding to search history:', error);
    return false;
  }
};

export const getSearchHistory = (userEmail) => {
  try {
    if (!userEmail) return [];

    const history = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY), {});
    return history[userEmail] || [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
};

export const clearSearchHistory = (userEmail) => {
  try {
    if (!userEmail) return false;

    const history = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY), {});
    history[userEmail] = [];
    
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
      return true;
    } catch (storageError) {
      console.error('Error clearing search history:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error clearing search history:', error);
    return false;
  }
};

// **RECENTLY SEARCHED MOVIES FUNCTIONS**
export const addToRecentlySearched = (movie) => {
  try {
    if (!movie) return false;

    const recent = safeJsonParse(localStorage.getItem(STORAGE_KEYS.RECENTLY_SEARCHED), []);
    
    // Remove if already exists
    const filtered = recent.filter(item => item.imdbID !== movie.imdbID);
    
    // Add to beginning
    const movieWithTimestamp = {
      ...movie,
      searchedAt: new Date().toISOString()
    };
    
    filtered.unshift(movieWithTimestamp);
    
    // Keep only last 20 movies
    const limited = filtered.slice(0, 20);
    
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_SEARCHED, JSON.stringify(limited));
      return true;
    } catch (storageError) {
      console.error('Error saving recently searched:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error adding to recently searched:', error);
    return false;
  }
};

export const getRecentlySearched = () => {
  try {
    return safeJsonParse(localStorage.getItem(STORAGE_KEYS.RECENTLY_SEARCHED), []);
  } catch (error) {
    console.error('Error getting recently searched:', error);
    return [];
  }
};

export const clearRecentlySearched = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENTLY_SEARCHED);
    return true;
  } catch (error) {
    console.error('Error clearing recently searched:', error);
    return false;
  }
};

// **USER PREFERENCES FUNCTIONS**
export const getUserPreferences = (userEmail) => {
  try {
    if (!userEmail) return {};

    const key = `movieverse_preferences_${userEmail}`;
    return safeJsonParse(localStorage.getItem(key), {
      theme: 'dark',
      autoplay: false,
      notifications: true,
      language: 'en',
      syncEnabled: true
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

export const setUserPreferences = (userEmail, preferences) => {
  try {
    if (!userEmail || !preferences) return false;

    const key = `movieverse_preferences_${userEmail}`;
    const current = getUserPreferences(userEmail);
    const updated = { ...current, ...preferences };
    
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      return true;
    } catch (storageError) {
      console.error('Error saving preferences:', storageError);
      return false;
    }
    
  } catch (error) {
    console.error('Error setting user preferences:', error);
    return false;
  }
};

// **DATA EXPORT/IMPORT FUNCTIONS**
export const exportUserData = (userEmail) => {
  try {
    if (!userEmail) return null;

    const userData = {
      favorites: getFavorites(userEmail),
      searchHistory: getSearchHistory(userEmail),
      preferences: getUserPreferences(userEmail),
      syncStatus: getSyncStatus(userEmail),
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
    
    return userData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return null;
  }
};

export const importUserData = (userEmail, userData) => {
  try {
    if (!userEmail || !userData) return false;

    // Import favorites
    if (userData.favorites && Array.isArray(userData.favorites)) {
      const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
      favorites[userEmail] = userData.favorites;
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
    
    // Import search history
    if (userData.searchHistory && Array.isArray(userData.searchHistory)) {
      const history = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY), {});
      history[userEmail] = userData.searchHistory;
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
    }
    
    // Import preferences
    if (userData.preferences && typeof userData.preferences === 'object') {
      setUserPreferences(userEmail, userData.preferences);
    }
    
    // Import sync status if available
    if (userData.syncStatus && typeof userData.syncStatus === 'object') {
      setSyncStatus(userEmail, userData.syncStatus);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing user data:', error);
    return false;
  }
};

// **STORAGE MANAGEMENT FUNCTIONS**
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    const storageInfo = {};
    
    for (const key in STORAGE_KEYS) {
      const item = localStorage.getItem(STORAGE_KEYS[key]);
      if (item) {
        const size = new Blob([item]).size;
        totalSize += size;
        storageInfo[key] = {
          size: size,
          sizeFormatted: formatBytes(size)
        };
      }
    }
    
    return {
      total: totalSize,
      totalFormatted: formatBytes(totalSize),
      breakdown: storageInfo
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { total: 0, totalFormatted: '0 B', breakdown: {} };
  }
};

export const clearAllData = (userEmail = null) => {
  try {
    if (userEmail) {
      // Clear data for specific user
      clearAllFavorites(userEmail);
      clearSearchHistory(userEmail);
      const key = `movieverse_preferences_${userEmail}`;
      localStorage.removeItem(key);
      
      // Clear sync status
      const syncData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.SYNC_STATUS), {});
      delete syncData[userEmail];
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(syncData));
    } else {
      // Clear all app data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear user-specific preference keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('movieverse_preferences_')) {
          localStorage.removeItem(key);
        }
      });
    }
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// **HELPER FUNCTIONS**
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// **STORAGE EVENT LISTENER FOR CROSS-TAB SYNCHRONIZATION**
export const onStorageChange = (callback) => {
  const handleStorageChange = (e) => {
    if (Object.values(STORAGE_KEYS).includes(e.key)) {
      callback(e);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// **VALIDATION FUNCTIONS**
export const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Please enter a valid email address');
  }
  
  if (!userData.password || userData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// **MIGRATION FUNCTION FOR DATA STRUCTURE UPDATES**
export const migrateData = () => {
  try {
    // Check if migration is needed
    const version = localStorage.getItem('movieverse_data_version');
    
    if (!version || version < '2.0') {
      // Perform migration if needed
      console.log('Migrating localStorage data to version 2.0...');
      
      // Migration logic here if needed
      // For example, updating favorite data structure
      const favorites = safeJsonParse(localStorage.getItem(STORAGE_KEYS.FAVORITES), {});
      let migrated = false;
      
      for (const userEmail in favorites) {
        const userFavorites = favorites[userEmail];
        for (let i = 0; i < userFavorites.length; i++) {
          const fav = userFavorites[i];
          
          // Ensure all required fields exist
          if (!fav.imdbID && fav.id) {
            fav.imdbID = fav.id;
            delete fav.id;
            migrated = true;
          }
          
          if (!fav.addedAt) {
            fav.addedAt = new Date().toISOString();
            migrated = true;
          }
        }
      }
      
      if (migrated) {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        console.log('Favorites data migrated successfully');
      }
      
      localStorage.setItem('movieverse_data_version', '2.0');
      console.log('Data migration completed to version 2.0');
    }
    
    return true;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
};

// **UTILITY FUNCTIONS FOR INTEGRATION**
export const hasPendingSyncData = (userEmail) => {
  const syncStatus = getSyncStatus(userEmail);
  return syncStatus.pendingFavoriteAdds.length > 0 || syncStatus.pendingFavoriteRemoves.length > 0;
};

export const getSyncSummary = (userEmail) => {
  const syncStatus = getSyncStatus(userEmail);
  return {
    pendingAdds: syncStatus.pendingFavoriteAdds.length,
    pendingRemoves: syncStatus.pendingFavoriteRemoves.length,
    lastSync: syncStatus.lastSync,
    hasPendingChanges: syncStatus.pendingFavoriteAdds.length > 0 || syncStatus.pendingFavoriteRemoves.length > 0
  };
};

// **INITIALIZE AND AUTO-SYNC FUNCTIONS**
export const initializeUser = async (userEmail) => {
  try {
    console.log('Initializing localStorage for user:', userEmail);
    
    // Run data migration if needed
    migrateData();
    
    // Check if auto-sync is enabled
    const preferences = getUserPreferences(userEmail);
    if (preferences.syncEnabled && hasPendingSyncData(userEmail)) {
      console.log('Auto-sync enabled, attempting to sync pending data...');
      
      // Attempt to sync with database
      const syncResult = await syncWithDatabase(userEmail);
      if (syncResult.success) {
        console.log('Auto-sync completed:', syncResult.message);
      } else {
        console.log('Auto-sync failed, will retry later');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user:', error);
    return false;
  }
};

// Run migration on module load
migrateData();