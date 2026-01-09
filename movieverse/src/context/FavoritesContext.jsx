import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FavoritesContext = createContext();

// ✅ UNIVERSAL ID EXTRACTOR - FIXED: Always use TMDB ID for consistency
const getMovieId = (movie) => {
  if (!movie) return null;

  // 🔥 CRITICAL FIX: ALWAYS prefer TMDB ID for consistency across pages
  // Priority 1: TMDB ID (most consistent across Home and Detail pages)
  if (movie.id) {
    return movie.id.toString(); // ✅ Just use raw TMDB ID (no prefix)
  }

  if (movie.tmdb_id) {
    return movie.tmdb_id.toString(); // ✅ Just use raw TMDB ID (no prefix)
  }

  // Priority 2: IMDB ID (if no TMDB ID available)
  if (movie.imdbID && movie.imdbID !== 'N/A') {
    return movie.imdbID;
  }

  // Priority 3: External IMDB ID
  if (movie.external_ids?.imdb_id) {
    return movie.external_ids.imdb_id;
  }

  // Fallback: Create unique ID from title + year
  if (movie.Title || movie.title) {
    const title = (movie.Title || movie.title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const year = movie.Year || (movie.release_date ? movie.release_date.split('-')[0] : 'unknown');
    return `custom-${title}-${year}`;
  }

  console.warn('⚠️ Could not determine movie ID:', movie);
  return null;
};

// ✅ NORMALIZE MOVIE DATA - Ensures consistent format
const normalizeMovie = (movie) => {
  const movieId = getMovieId(movie);
  
  return {
    imdbID: movieId,
    Title: movie.Title || movie.title || 'Unknown',
    Poster: movie.Poster || movie.poster_path || 'N/A',
    Year: movie.Year || (movie.release_date ? movie.release_date.split('-')[0] : 'N/A'),
    imdbRating: movie.imdbRating || movie.Rating || movie.vote_average?.toString() || 'N/A',
    Genre: movie.Genre || (movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A'),
    Type: movie.Type || 'movie',
    Plot: movie.Plot || movie.overview || '',
    _originalData: {
      tmdb_id: movie.id || movie.tmdb_id,
      imdb_id: movie.imdbID || movie.external_ids?.imdb_id,
      title: movie.Title || movie.title,
      year: movie.Year || (movie.release_date ? movie.release_date.split('-')[0] : '')
    }
  };
};

export function FavoritesProvider({ children, user, openAuthModal }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FETCH FAVORITES FROM DATABASE
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      const userId = user._id || user.id || user.email;
      console.log('📥 Fetching favorites for user:', userId);

      const response = await fetch(`https://movieverse-backend-j0j6.onrender.com/api/favorites/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.favorites) {
          const transformedFavorites = data.favorites.map(fav => ({
            imdbID: fav.movieId,
            Title: fav.title,
            Poster: fav.poster || fav.posterPath,
            Year: fav.year,
            imdbRating: fav.rating,
            Genre: fav.genre,
            Type: fav.type || 'movie',
            Plot: fav.plot || ''
          }));
          
          console.log('✅ Loaded favorites:', transformedFavorites.length, transformedFavorites);
          setFavorites(transformedFavorites);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ IMPROVED: Check if movie is favorite (multiple matching strategies)
  const isFavorite = useCallback((movie) => {
    if (!movie || favorites.length === 0) {
      return false;
    }

    const movieId = getMovieId(movie);
    if (!movieId) return false;

    // 🔍 DEBUG: Log what we're checking
    console.log('🔍 Checking isFavorite for:', {
      title: movie.Title || movie.title,
      movieId,
      tmdb_id: movie.id || movie.tmdb_id,
      imdb_id: movie.imdbID,
      favoritesCount: favorites.length
    });

    // Strategy 1: Direct ID match
    const idMatch = favorites.some(fav => {
      const match = fav.imdbID === movieId;
      if (match) console.log('✅ Found by exact ID:', movieId);
      return match;
    });
    if (idMatch) return true;

    // Strategy 2: Title + Year match (fallback for cross-API compatibility)
    const movieTitle = (movie.Title || movie.title || '').toLowerCase().trim();
    const movieYear = movie.Year || (movie.release_date ? movie.release_date.split('-')[0] : '');
    
    const titleYearMatch = favorites.some(fav => {
      const favTitle = (fav.Title || '').toLowerCase().trim();
      const favYear = fav.Year;
      const match = favTitle === movieTitle && favYear === movieYear;
      
      if (match) {
        console.log('✅ Found by Title+Year:', { 
          movieTitle, 
          movieYear, 
          favId: fav.imdbID,
          requestedId: movieId 
        });
      }
      
      return match;
    });

    if (!idMatch && !titleYearMatch) {
      console.log('❌ Not in favorites. Current favorites:', 
        favorites.map(f => ({ title: f.Title, id: f.imdbID }))
      );
    }

    return titleYearMatch;
  }, [favorites]);

  // ✅ ADD TO FAVORITES
  const addToFavorites = useCallback(async (movie) => {
    if (!user) {
      openAuthModal?.();
      return { success: false, message: 'Please login first' };
    }

    if (!movie) {
      return { success: false, message: 'Invalid movie data' };
    }

    const movieId = getMovieId(movie);
    if (!movieId) {
      console.error('❌ No valid movie ID:', movie);
      return { success: false, message: 'Invalid movie ID' };
    }

    // Check if already favorite
    if (isFavorite(movie)) {
      console.log('⚠️ Movie already in favorites:', movieId);
      return { success: false, message: 'Already in favorites' };
    }

    const normalized = normalizeMovie(movie);
    const userId = user._id || user.id || user.email;

    try {
      setLoading(true);
      console.log('➕ Adding to favorites:', { userId, movieId, title: normalized.Title });

      const response = await fetch('https://movieverse-backend-j0j6.onrender.com/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          movieId,
          title: normalized.Title,
          poster: normalized.Poster,
          year: normalized.Year,
          rating: normalized.imdbRating,
          genre: normalized.Genre,
          type: normalized.Type,
          plot: normalized.Plot
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ UPDATE LOCAL STATE IMMEDIATELY
        setFavorites(prev => [...prev, normalized]);
        console.log('✅ Added to favorites successfully');
        return { success: true, message: 'Added to favorites ❤️' };
      } else {
        console.error('❌ Failed to add:', data.message);
        return { success: false, message: data.message || 'Failed to add' };
      }
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [user, openAuthModal, isFavorite]);

  // ✅ REMOVE FROM FAVORITES
  const removeFromFavorites = useCallback(async (movie) => {
    if (!user || !movie) {
      return { success: false, message: 'Invalid request' };
    }

    const movieId = getMovieId(movie);
    if (!movieId) {
      return { success: false, message: 'Invalid movie ID' };
    }

    const userId = user._id || user.id || user.email;

    try {
      setLoading(true);
      console.log('➖ Removing from favorites:', { userId, movieId });

      const response = await fetch(`https://movieverse-backend-j0j6.onrender.com/api/favorites/${userId}/${movieId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ REMOVE FROM LOCAL STATE - Match by both ID and Title+Year
        setFavorites(prev => prev.filter(fav => {
          const idMatch = fav.imdbID === movieId;
          
          const movieTitle = (movie.Title || movie.title || '').toLowerCase().trim();
          const movieYear = movie.Year || (movie.release_date ? movie.release_date.split('-')[0] : '');
          const titleMatch = fav.Title.toLowerCase().trim() === movieTitle && fav.Year === movieYear;
          
          return !(idMatch || titleMatch);
        }));
        
        console.log('✅ Removed from favorites successfully');
        return { success: true, message: 'Removed from favorites' };
      } else {
        console.error('❌ Failed to remove:', data.message);
        return { success: false, message: data.message || 'Failed to remove' };
      }
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ TOGGLE FAVORITE (SMART ADD/REMOVE)
  const toggleFavorite = useCallback(async (movie) => {
    console.log('🔄 Toggle favorite for:', movie.Title || movie.title, 'Current favorite:', isFavorite(movie));
    
    if (isFavorite(movie)) {
      return await removeFromFavorites(movie);
    } else {
      return await addToFavorites(movie);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // ✅ CLEAR ALL FAVORITES
  const clearAllFavorites = useCallback(async () => {
    if (!user) return { success: false, message: 'Not logged in' };

    const userId = user._id || user.id || user.email;

    try {
      setLoading(true);
      const response = await fetch(`https://movieverse-backend-j0j6.onrender.com/api/favorites/${userId}/clear`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites([]);
        return { success: true, message: 'All favorites cleared' };
      } else {
        return { success: false, message: data.message || 'Failed to clear' };
      }
    } catch (error) {
      console.error('❌ Error clearing favorites:', error);
      return { success: false, message: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ FETCH FAVORITES ON USER CHANGE
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const value = {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    refreshFavorites: fetchFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ✅ Export hook separately - this fixes Fast Refresh
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};