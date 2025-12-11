import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Clock, Calendar, User, Globe, ArrowLeft, Play, ExternalLink, Share2, Award, TrendingUp, Users, DollarSign, Video, Info, Film, Zap, CheckCircle, X, Camera, Mic, Music, Target, Flame, Eye, MessageCircle, MapPin, Trophy, Volume2 } from 'lucide-react';
import { getMovieDetails, getYouTubeTrailer, getMovieCredits, getPersonMovies } from '../utils/api';
import { useFavorites } from '../context/FavoritesContext'; // ✅ ADD THIS
// Add this component before MovieDetail
const ConfettiParticle = ({ delay, angle }) => {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{
        background: `hsl(${Math.random() * 360}, 100%, 60%)`,
        left: '50%',
        top: '50%',
      }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0.5],
        x: Math.cos(angle) * 50,
        y: Math.sin(angle) * 50,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: "easeOut"
      }}
    />
  )
}

const FavoriteHeart = ({ movie }) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [showCelebration, setShowCelebration] = useState(false);
  const isFav = isFavorite(movie);

  const handleToggle = async () => {
    if (!isFav) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
    await toggleFavorite(movie);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleToggle}
        disabled={loading}
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        className="relative focus:outline-none p-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        initial={false}
        whileTap={{ scale: loading ? 1 : 0.8 }}
        style={{
          background: isFav ? 'rgba(220, 38, 38, 0.2)' : 'rgba(17, 24, 39, 0.6)',
          color: isFav ? '#f87171' : '#9ca3af',
          border: isFav ? '2px solid rgba(220, 38, 38, 0.3)' : '2px solid #374151'
        }}
      >
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(16)].map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 0.02}
                angle={(Math.PI * 2 * i) / 16}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute text-yellow-300"
                style={{
                  left: '50%',
                  top: '50%',
                  fontSize: '12px',
                }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  rotate: [0, 180],
                  opacity: [0, 1, 0],
                  x: Math.cos((Math.PI * 2 * i) / 8) * 30,
                  y: Math.sin((Math.PI * 2 * i) / 8) * 30,
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <motion.div
              animate={{ 
                color: isFav ? "#f87171" : "#9ca3af",
                scale: isFav ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              <Heart size={24} fill={isFav ? "#f87171" : "none"} />
            </motion.div>

            {isFav && (
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
            )}
          </>
        )}
      </motion.button>
    </div>
  );
};
const MovieDetail = ({ user, openAuthModal }) => {  // 🔥 ADD user and openAuthModal props
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced cast and crew state
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personMovies, setPersonMovies] = useState(null);
  const [showPersonModal, setShowPersonModal] = useState(false);

  const [trailerUrl, setTrailerUrl] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  const [movieStats, setMovieStats] = useState({
    popularity: Math.floor(Math.random() * 100) + 1,
    viewCount: Math.floor(Math.random() * 1000000) + 100000,
    criticScore: Math.floor(Math.random() * 40) + 60,
    audienceScore: Math.floor(Math.random() * 40) + 60
  });

  // Get high-quality poster URL
  const getHDPosterUrl = (movie) => {
    if (!movie) return null;
    if (movie.source === 'tmdb' || movie.tmdb_id) {
      return movie.Poster;
    }
    if (movie.Poster && movie.Poster !== 'N/A') {
      return movie.Poster.replace('SX300', 'SX600').replace('_V1_', '_V1_UY800_');
    }
    return null;
  };

  // Get backdrop image URL for hero section
  const getBackdropUrl = (movie) => {
    if (!movie) return null;
    if (movie.backdrop_path) {
      return movie.backdrop_path;
    }
    return getHDPosterUrl(movie);
  };

  // Fetch cast and crew with images
  const fetchCastAndCrew = async (movieId) => {
    setCreditsLoading(true);
    try {
      const creditsData = await getMovieCredits(movieId);
      setCredits(creditsData);
    } catch (error) {
      console.error('Error fetching cast and crew:', error);
      setCredits({ cast: [], crew: [] });
    } finally {
      setCreditsLoading(false);
    }
  };

  // Handle person click to show their details
  const handlePersonClick = async (person) => {
    setSelectedPerson(person);
    setShowPersonModal(true);
    try {
      const movies = await getPersonMovies(person.id);
      setPersonMovies(movies);
    } catch (error) {
      console.error('Error fetching person movies:', error);
      setPersonMovies({ cast: [], crew: [] });
    }
  };

  // Close person modal
  const closePersonModal = () => {
    setShowPersonModal(false);
    setSelectedPerson(null);
    setPersonMovies(null);
  };

  // Fetch YouTube trailer using API
  const fetchTrailer = async (movieTitle, year) => {
    setLoadingTrailer(true);
    try {
      const result = await getYouTubeTrailer(movieTitle, year);
      if (result.success && result.videoId) {
        setTrailerUrl(`https://www.youtube.com/embed/${result.videoId}?autoplay=1&rel=0`);
      } else {
        alert('No trailer found for this movie');
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      alert('Failed to load trailer');
    } finally {
      setLoadingTrailer(false);
    }
  };

  const handleWatchNow = () => {
    if (movie.Title && movie.Year) {
      fetchTrailer(movie.Title, movie.Year);
      setShowTrailer(true);
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
    setTrailerUrl(null);
  };
  // Show notification helper
  const showNotification = (message, bgColor) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg z-50 transition-all duration-300`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

useEffect(() => {
  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const movieData = await getMovieDetails(id);
      
      if (movieData.Response === 'True') {
        const movieWithId = {
          ...movieData,
          id: movieData.tmdb_id || movieData.id || id,
          imdbID: movieData.imdbID || id
        };
        
        setMovie(movieWithId);
        await fetchCastAndCrew(movieData.tmdb_id || movieData.id || id);
      } else {
        setError(movieData.Error || 'Movie not found');
      }
    } catch (err) {
      console.error('Failed to fetch movie details:', err);
      setError('Failed to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (id) {
    fetchMovieDetails();
  }
}, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.Title,
          text: `Check out ${movie.Title} (${movie.Year})`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed, copying to clipboard');
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E13] flex items-center justify-center">
        <motion.div className="flex flex-col items-center space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading movie details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E13] flex items-center justify-center">
        <motion.div className="text-center max-w-md mx-auto px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Movie Not Found</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <button onClick={() => navigate('/home')} className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg">
            Back to Browse
          </button>
        </motion.div>
      </div>
    );
  }

  if (!movie) return null;

  const backdropUrl = getBackdropUrl(movie);
  const posterUrl = getHDPosterUrl(movie);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'cast', label: 'Cast & Crew', icon: Users },
    { id: 'details', label: 'Details', icon: Film },
    { id: 'reviews', label: 'Reviews', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E13]">
      {/* Hero Section with Backdrop */}
      <section className="relative">
        {/* Back Button - Floating */}
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-gray-300 hover:text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-300 hover:bg-black/70">
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        {/* Backdrop Image */}
        {backdropUrl && (
          <div className="absolute inset-0 h-[600px]">
            <img src={backdropUrl} alt={movie.Title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E13] via-[#0A0E13]/80 to-[#0A0E13]/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E13] via-transparent to-[#0A0E13]/60"></div>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Movie Poster */}
            <motion.div className="lg:col-span-1 flex justify-center lg:justify-start" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-80 aspect-[2/3] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                {posterUrl ? (
                  <img src={posterUrl} alt={movie.Title} className="w-full h-full object-cover" onLoad={() => setImageLoaded(true)} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Movie Info */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
                {/* Title and Year */}
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white mb-3 leading-tight">{movie.Title}</h1>
                  <p className="text-2xl text-gray-300">{movie.Year}</p>
                </div>

                {/* Enhanced Rating and Meta Info */}
                <div className="flex flex-wrap items-center gap-6">
                  {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
                        <Star className="w-5 h-5 fill-current text-yellow-400" />
                        <span className="font-bold text-yellow-400 text-lg">{movie.imdbRating}</span>
                      </div>
                      <span className="text-gray-400 text-sm">IMDb</span>
                    </div>
                  )}

                  {/* Popularity Score */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/30">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                      <span className="font-bold text-red-400 text-lg">{movieStats.popularity}%</span>
                    </div>
                    <span className="text-gray-400 text-sm">Popular</span>
                  </div>

                  {/* View Count */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30">
                      <Eye className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-blue-400 text-lg">{(movieStats.viewCount / 1000000).toFixed(1)}M</span>
                    </div>
                    <span className="text-gray-400 text-sm">Views</span>
                  </div>

                  {movie.Runtime && movie.Runtime !== 'N/A' && (
                    <div className="flex items-center space-x-2 text-gray-300 bg-gray-800/60 px-4 py-2 rounded-full">
                      <Clock size={18} />
                      <span className="font-medium">{movie.Runtime}</span>
                    </div>
                  )}

                  {movie.Rated && movie.Rated !== 'N/A' && (
                    <div className="px-4 py-2 bg-gray-800/60 rounded-full border border-gray-600">
                      <span className="text-gray-200 font-semibold">{movie.Rated}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movie.Genre && movie.Genre !== 'N/A' && (
                  <div className="flex flex-wrap gap-3">
                    {movie.Genre.split(', ').map((genre, index) => (
                      <span key={index} className="px-4 py-2 bg-red-600/20 text-red-300 border border-red-600/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors cursor-pointer">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Plot */}
                {movie.Plot && movie.Plot !== 'N/A' && (
                  <p className="text-lg text-gray-300 leading-relaxed max-w-4xl">{movie.Plot}</p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button onClick={handleWatchNow} disabled={loadingTrailer} className="group flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 font-bold shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      {loadingTrailer ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Play size={14} fill="white" className="ml-0.5" />
                      )}
                    </div>
                    <span>{loadingTrailer ? 'Loading...' : 'Watch Trailer'}</span>
                  </button>

                  {/* Heart and Share Icons */}
                  <div className="flex items-center space-x-3">
                    <FavoriteHeart movie={movie} />
                    <button onClick={handleShare} className="p-4 bg-gray-900/60 text-gray-400 border-2 border-gray-700 rounded-full font-bold transition-all duration-300 transform hover:scale-105 hover:bg-gray-800/60 hover:border-gray-600 hover:text-white" title="Share movie">
                      <Share2 size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="bg-[#0A0E13]/95 border-t border-gray-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-2 whitespace-nowrap border-b-2 font-medium transition-colors ${activeTab === tab.id ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'}`}>
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
            {/* Enhanced Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 p-6 rounded-xl border border-yellow-600/20 text-center">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{movie.imdbRating || 'N/A'}</p>
                <p className="text-sm text-gray-400">IMDb Rating</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-6 rounded-xl border border-green-600/20 text-center">
                <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{movieStats.criticScore}%</p>
                <p className="text-sm text-gray-400">Critics Score</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 p-6 rounded-xl border border-blue-600/20 text-center">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{movieStats.audienceScore}%</p>
                <p className="text-sm text-gray-400">Audience Score</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 rounded-xl border border-purple-600/20 text-center">
                <Flame className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{movieStats.popularity}%</p>
                <p className="text-sm text-gray-400">Popularity</p>
              </div>
            </div>

            {/* Synopsis */}
            {movie.Plot && movie.Plot !== 'N/A' && (
              <div className="bg-gray-900/60 p-8 rounded-2xl border border-gray-800">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Film className="w-6 h-6 mr-3 text-red-400" />
                  Synopsis
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">{movie.Plot}</p>
              </div>
            )}

            {/* Key Personnel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {movie.Director && movie.Director !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wide flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Director
                  </h3>
                  <p className="text-xl font-semibold text-white">{movie.Director}</p>
                </div>
              )}

              {movie.Writer && movie.Writer !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wide flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Writers
                  </h3>
                  <p className="text-lg text-gray-300">{movie.Writer}</p>
                </div>
              )}
            </div>

            {/* Awards */}
            {movie.Awards && movie.Awards !== 'N/A' && (
              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-8 rounded-2xl border border-yellow-600/20">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-yellow-600/20 rounded-xl">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Awards & Recognition</h3>
                    <p className="text-gray-300 text-lg">{movie.Awards}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ratings */}
            {movie.Ratings && movie.Ratings.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Critical Reception</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {movie.Ratings.map((rating, index) => (
                    <div key={index} className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:bg-gray-900/80">
                      <h4 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wide">
                        {rating.Source.replace('Internet Movie Database', 'IMDb')}
                      </h4>
                      <p className="text-2xl font-bold text-white">{rating.Value}</p>
                      <div className="mt-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full" style={{ width: rating.Source.includes('IMDb') ? `${(parseFloat(rating.Value) / 10) * 100}%` : rating.Value.includes('%') ? rating.Value : '75%' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'cast' && (
          <motion.div key="cast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
            {/* Cast Section with Real Images */}
            {creditsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300 text-lg">Loading cast and crew...</p>
              </div>
            ) : credits.cast && credits.cast.length > 0 ? (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Cast</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {credits.cast.slice(0, 12).map((actor, index) => (
                    <div key={actor.id || index} className="text-center group cursor-pointer" onClick={() => handlePersonClick(actor)}>
                      <div className="w-full aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden mb-3 ring-1 ring-gray-800 group-hover:ring-red-500/50 transition-all duration-300">
                        {actor.profile_path ? (
                          <img src={actor.profile_path} alt={actor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <User className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-white font-medium text-sm group-hover:text-red-400 transition-colors">{actor.name}</p>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{actor.character}</p>
                      {actor.popularity && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="flex items-center space-x-1 bg-gray-800/60 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-gray-300">{Math.round(actor.popularity)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Cast information not available</p>
              </div>
            )}

            {/* Crew Section */}
            {credits.crew && credits.crew.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Crew</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {credits.crew.slice(0, 12).map((crew, index) => (
                    <div key={crew.id || index} className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:bg-gray-900/80 cursor-pointer group" onClick={() => handlePersonClick(crew)}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                          {crew.profile_path ? (
                            <img src={crew.profile_path} alt={crew.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <>
                              {crew.department === 'Directing' && <Camera className="w-6 h-6 text-red-400" />}
                              {crew.department === 'Writing' && <MessageCircle className="w-6 h-6 text-blue-400" />}
                              {crew.department === 'Sound' && <Music className="w-6 h-6 text-purple-400" />}
                              {crew.department === 'Camera' && <Video className="w-6 h-6 text-green-400" />}
                              {crew.department === 'Production' && <Users className="w-6 h-6 text-yellow-400" />}
                              {crew.department === 'Editing' && <Film className="w-6 h-6 text-orange-400" />}
                              {!['Directing', 'Writing', 'Sound', 'Camera', 'Production', 'Editing'].includes(crew.department) && <User className="w-6 h-6 text-gray-400" />}
                            </>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold group-hover:text-red-400 transition-colors">{crew.name}</p>
                          <p className="text-gray-400 text-sm">{crew.job}</p>
                          <p className="text-gray-500 text-xs">{crew.department}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {movie.Released && movie.Released !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Release Date</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.Released}</p>
                  </div>
                </div>
              )}

              {movie.Language && movie.Language !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Language</h3>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.Language}</p>
                  </div>
                </div>
              )}

              {movie.Country && movie.Country !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Country</h3>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.Country}</p>
                  </div>
                </div>
              )}

              {movie.BoxOffice && movie.BoxOffice !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Box Office</h3>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.BoxOffice}</p>
                  </div>
                </div>
              )}

              {movie.Runtime && movie.Runtime !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Duration</h3>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.Runtime}</p>
                  </div>
                </div>
              )}

              {movie.Rated && movie.Rated !== 'N/A' && (
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Rating</h3>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-red-400" />
                    <p className="text-lg font-medium text-white">{movie.Rated}</p>
                  </div>
                </div>
              )}
            </div>

            {movie.Production && movie.Production !== 'N/A' && (
              <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wide">Production Company</h3>
                <p className="text-lg font-medium text-white">{movie.Production}</p>
              </div>
            )}

            {/* Technical Details */}
            <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 p-8 rounded-xl border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-6">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Format</p>
                  <p className="text-white font-semibold">Digital</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Volume2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Sound</p>
                  <p className="text-white font-semibold">Stereo</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Quality</p>
                  <p className="text-white font-semibold">HD</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
            <div className="text-center py-12">
              <div className="bg-gray-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Reviews Coming Soon</h3>
              <p className="text-gray-400 mb-8">User reviews and critic scores will be available here.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <div className="text-2xl font-bold text-white mb-2">{movieStats.criticScore}%</div>
                  <div className="text-sm text-gray-400">Critics Score</div>
                </div>
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <div className="text-2xl font-bold text-white mb-2">{movieStats.audienceScore}%</div>
                  <div className="text-sm text-gray-400">Audience Score</div>
                </div>
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                  <div className="text-2xl font-bold text-white mb-2">{Math.floor(Math.random() * 500) + 100}</div>
                  <div className="text-sm text-gray-400">Total Reviews</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Person Detail Modal */}
      <AnimatePresence>
        {showPersonModal && selectedPerson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={closePersonModal}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="relative bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={closePersonModal} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-48 h-72 bg-gray-800 rounded-xl overflow-hidden mx-auto md:mx-0 flex-shrink-0">
                  {selectedPerson.profile_path ? (
                    <img src={selectedPerson.profile_path} alt={selectedPerson.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-4">{selectedPerson.name}</h2>
                  {selectedPerson.character && (
                    <div className="mb-4">
                      <h3 className="text-gray-400 text-sm font-medium mb-1">Character</h3>
                      <p className="text-xl text-gray-200">{selectedPerson.character}</p>
                    </div>
                  )}
                  {selectedPerson.job && (
                    <div className="mb-4">
                      <h3 className="text-gray-400 text-sm font-medium mb-1">Role</h3>
                      <p className="text-xl text-gray-200">{selectedPerson.job}</p>
                    </div>
                  )}
                  {selectedPerson.department && (
                    <div className="mb-4">
                      <h3 className="text-gray-400 text-sm font-medium mb-1">Department</h3>
                      <p className="text-lg text-gray-300">{selectedPerson.department}</p>
                    </div>
                  )}
                  {selectedPerson.popularity && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Popularity: {Math.round(selectedPerson.popularity)}</span>
                    </div>
                  )}
                </div>
              </div>

              {personMovies && (personMovies.cast.length > 0 || personMovies.crew.length > 0) && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Known For</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...personMovies.cast.slice(0, 5), ...personMovies.crew.slice(0, 5)]
                      .sort((a, b) => b.vote_average - a.vote_average)
                      .slice(0, 10)
                      .map((movieItem, index) => (
                        <div key={movieItem.id || index} className="text-center group">
                          <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-red-500/50 transition-all duration-300">
                            {movieItem.poster_path ? (
                              <img src={movieItem.poster_path} alt={movieItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-red-400 transition-colors">{movieItem.title}</p>
                          <p className="text-gray-400 text-xs mt-1">{movieItem.character || movieItem.job}</p>
                          {movieItem.vote_average > 0 && (
                            <div className="flex items-center justify-center mt-1">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-400">{movieItem.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Trailer Modal */}
      <AnimatePresence>
        {showTrailer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={closeTrailer}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="relative w-full max-w-4xl mx-4 aspect-video bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeTrailer} className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
              {trailerUrl ? (
                <iframe src={trailerUrl} title="Movie Trailer" className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading trailer...</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieDetail;