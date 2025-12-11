// src/pages/Favorites.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, AlertCircle, Film, ArrowLeft } from 'lucide-react';
import MovieCard from '../components/MovieCard';

const Favorites = ({ user, openAuthModal }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/home');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      const userId = user._id || user.id || user.email;
      
      console.log('📥 Fetching favorites for userId:', userId);
      
      const response = await fetch(`http://localhost:5000/api/favorites/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      
      console.log('📥 Fetched favorites response:', data);
      console.log('🖼️ Sample poster URL:', data.favorites[0]?.poster);
      
      if (data.success) {
        // Just use the data from backend - it should already have poster URLs
        const transformedFavorites = data.favorites.map(fav => ({
          imdbID: fav.movieId,
          Title: fav.title,
          Poster: fav.posterPath || fav.poster, // ✅ Check both field names
          Year: fav.year,
          imdbRating: fav.rating,
          Genre: fav.genre,
          Type: fav.type || 'movie',
          Plot: fav.plot
        }));
        
        console.log('✅ Transformed favorites:', transformedFavorites);
        console.log('🖼️ First poster URL:', transformedFavorites[0]?.Poster);
        setFavorites(transformedFavorites);
      }
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (movieId) => {
    if (!user) return;

    try {
      const userId = user._id || user.id || user.email;
      
      console.log('🗑️ Removing favorite:', { userId, movieId });
      
      const response = await fetch(`http://localhost:5000/api/favorites/${userId}/${movieId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites(prev => prev.filter(movie => movie.imdbID !== movieId));
        showNotification('Removed from favorites', 'bg-red-600');
      } else {
        showNotification(data.message || 'Failed to remove', 'bg-red-600');
      }
    } catch (err) {
      console.error('❌ Error removing favorite:', err);
      showNotification('Failed to remove from favorites', 'bg-red-600');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all favorites?')) {
      return;
    }

    if (!user) return;

    try {
      const userId = user._id || user.id || user.email;
      
      console.log('🗑️ Clearing all favorites for userId:', userId);
      
      const response = await fetch(`http://localhost:5000/api/favorites/${userId}/clear`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites([]);
        showNotification(`Cleared ${data.deletedCount} favorites`, 'bg-red-600');
      } else {
        showNotification(data.message || 'Failed to clear', 'bg-red-600');
      }
    } catch (err) {
      console.error('❌ Error clearing favorites:', err);
      showNotification('Failed to clear favorites', 'bg-red-600');
    }
  };

  const showNotification = (message, bgColor) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg z-50 transition-all duration-300 shadow-lg`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Heart icon with animation for unfavoriting
  const FavoriteHeart = ({ movie }) => {
    const [isRemoving, setIsRemoving] = useState(false);

    const handleToggle = async () => {
      setIsRemoving(true);
      await handleRemoveFromFavorites(movie.imdbID);
    };

    return (
      <motion.button
        onClick={handleToggle}
        disabled={isRemoving}
        aria-label="Remove from favorites"
        className="relative focus:outline-none p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-colors disabled:opacity-50"
        initial={false}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
      >
        <motion.div
          animate={{ 
            color: "#ff4d6d",
            scale: isRemoving ? [1, 1.2, 0] : 1
          }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <Heart fill="#ff4d6d" className="w-5 h-5" />
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-pink-500/20 rounded-full blur-md"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading your favorites...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400 fill-current" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">My Favorites</h1>
                <p className="text-gray-400 mt-1">
                  {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'} saved
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-300"
              >
                <Trash2 size={18} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-900/20 border border-red-600/30 rounded-lg p-4 flex items-center space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Film className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Favorites Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start adding movies to your favorites by clicking the heart icon on any movie card.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Browse Movies
            </button>
          </motion.div>
        )}

        {/* Favorites Grid */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <AnimatePresence mode="popLayout">
                {favorites.map((movie, index) => (
                  <motion.div
                    key={movie.imdbID}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    className="relative"
                  >
                    <MovieCard
                      movie={movie}
                      user={user}
                      openAuthModal={openAuthModal}
                    />
                    {/* Heart icon overlay */}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteHeart movie={movie} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Favorites;