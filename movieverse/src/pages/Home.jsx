import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Loader2, TrendingUp, Clock, Film, Tv, Star, Calendar,
  Filter, ChevronDown, X, Globe, Clapperboard, Tag, Heart
} from 'lucide-react'
import MovieCard from '../components/MovieCard'
import { useFavorites } from '../context/FavoritesContext'  // ✅ ONE TIME ONLY
import { 
  getTrendingMovies, 
  discoverMoviesWithFilters, 
  searchWithFilters,
  searchAnime 
} from '../utils/api'
import { addToSearchHistory, getSearchHistory } from '../utils/localStorage'

const Home = ({ user, openAuthModal }) => {
  // ✅ USE FAVORITES CONTEXT
  const { favorites, isFavorite, toggleFavorite, loading: favLoading } = useFavorites();

  // States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState('movie')
  const [hasSearched, setHasSearched] = useState(false)
  const [trendingMovies, setTrendingMovies] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filter states
  const [filters, setFilters] = useState({
    year: '',
    genre: '',
    language: '',
    rating: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState([])

  // Filter options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)
  
  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music',
    'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ]

  const languageOptions = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }, { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' }, { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' }, { code: 'ar', name: 'Arabic' },
    { code: 'nl', name: 'Dutch' }, { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' }, { code: 'da', name: 'Danish' },
    { code: 'ta', name: 'Tamil' }, { code: 'ml', name: 'Malayalam' },
    { code: 'kn', name: 'Kannada' }, { code: 'te', name: 'Telugu' }
  ]

  const ratingOptions = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG']

  // Replace 'rosini@example.com' with your actual email or user ID
  const userId = 'rosini@example.com'; // or user._id if using MongoDB ID

  fetch(`http://localhost:5000/api/favorites/${userId}`)
    .then(r => r.json())
    .then(d => {
      console.log('=== ALL FAVORITES ===');
      d.favorites.forEach(f => {
        console.log(`Title: ${f.title}`);
        console.log(`MovieID: ${f.movieId}`);
        console.log(`Year: ${f.year}`);
        console.log(`Genre: ${f.genre}`);
        console.log('---');
      });
    });

  useEffect(() => {
    if (user) {
      const searchHistory = getSearchHistory(user.email)
      const formattedSearches = searchHistory.map(item => ({
        query: item.term,
        type: 'movie',
        timestamp: new Date(item.timestamp).getTime()
      }))
      setRecentSearches(formattedSearches)
    }
    loadTrendingMovies()
  }, [user])

  useEffect(() => {
    updateActiveFilters()
  }, [filters])

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(filter => filter !== '')
    
    if (hasActiveFilters) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1)
        handleSearch(searchQuery || '', true, 1, true)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [filters.year, filters.genre, filters.language, filters.rating])

  const loadTrendingMovies = async () => {
    setLoadingTrending(true)
    try {
      const result = await getTrendingMovies('week', 1)
      if (result.success && result.movies.length > 0) {
        setTrendingMovies(result.movies.slice(0, 18))
      } else {
        setTrendingMovies([])
      }
    } catch (error) {
      setTrendingMovies([])
    } finally {
      setLoadingTrending(false)
    }
  }

  const updateActiveFilters = () => {
    const active = []
    if (filters.year) active.push({ type: 'year', value: filters.year, label: `Year: ${filters.year}` })
    if (filters.genre) active.push({ type: 'genre', value: filters.genre, label: `Genre: ${filters.genre}` })
    if (filters.language) {
      const lang = languageOptions.find(l => l.code === filters.language)
      active.push({ type: 'language', value: filters.language, label: `Language: ${lang?.name || filters.language}` })
    }
    if (filters.rating) active.push({ type: 'rating', value: filters.rating, label: `Rating: ${filters.rating}` })
    setActiveFilters(active)
  }

  const handleSearch = async (customQuery = null, resetPage = true, page = 1, skipHistory = false) => {
    const queryToUse = customQuery !== null ? customQuery : searchQuery
    const hasQuery = queryToUse && queryToUse.trim()
    const hasFilters = Object.values(filters).some(filter => filter !== '')

    if (!hasQuery && !hasFilters) {
      return
    }

    if (resetPage) {
      setCurrentPage(1)
      page = 1
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      let result = { success: false, movies: [], totalResults: 0 }
      
      if (searchType === 'movie') {
        if (hasQuery) {
          result = await searchWithFilters(queryToUse.trim(), filters, page)
        } else {
          result = await discoverMoviesWithFilters(filters, page)
        }

        if (result.success) {
          setSearchResults(result.movies)
          setTotalPages(result.totalPages || Math.ceil(result.totalResults / 20))
          if (result.movies.length > 0 && user && hasQuery && !skipHistory) {
            addToSearchHistory(user.email, queryToUse.trim())
            const searchHistory = getSearchHistory(user.email)
            const formattedSearches = searchHistory.map(item => ({
              query: item.term,
              type: 'movie',
              timestamp: new Date(item.timestamp).getTime()
            }))
            setRecentSearches(formattedSearches)
          }
        } else {
          setSearchResults([])
          setTotalPages(1)
        }
      } else {
        if (hasQuery) {
          const animeResult = await searchAnime(queryToUse, page)
          if (animeResult.data && animeResult.data.length > 0) {
            const convertedResults = animeResult.data.map(anime => ({
              imdbID: anime.mal_id.toString(),
              Title: anime.title,
              Year: anime.year ? anime.year.toString() : 'N/A',
              Poster: anime.images?.jpg?.large_image_url || 'N/A',
              Type: 'anime',
              Plot: anime.synopsis,
              Rating: anime.score ? anime.score.toString() : 'N/A'
            }))

            let filteredResults = convertedResults
            if (filters.year) {
              filteredResults = filteredResults.filter(anime => anime.Year === filters.year)
            }

            setSearchResults(filteredResults)
            setTotalPages(Math.ceil((animeResult.pagination?.items?.total || 0) / 20))
            
            if (filteredResults.length > 0 && user && !skipHistory) {
              addToSearchHistory(user.email, queryToUse)
              const searchHistory = getSearchHistory(user.email)
              const formattedSearches = searchHistory.map(item => ({
                query: item.term,
                type: 'anime',
                timestamp: new Date(item.timestamp).getTime()
              }))
              setRecentSearches(formattedSearches)
            }
          } else {
            setSearchResults([])
            setTotalPages(1)
          }
        } else {
          setSearchResults([])
          setTotalPages(1)
        }
      }
    } catch (error) {
      setSearchResults([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      }
      console.log('Filter changed:', filterType, value, newFilters)
      return newFilters
    })
  }

  const removeFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: ''
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      year: '',
      genre: '',
      language: '',
      rating: ''
    })
    if (!searchQuery.trim()) {
      setHasSearched(false)
      setSearchResults([])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRecentSearch = (recentItem) => {
    setSearchQuery(recentItem.query)
    setSearchType(recentItem.type)
    setFilters({ year: '', genre: '', language: '', rating: '' })
    handleSearch(recentItem.query, true, 1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage)
      handleSearch(searchQuery, false, newPage)
    }
  }

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

  // ✅ SIMPLIFIED FAVORITE HEART - USES CONTEXT
  const FavoriteHeart = ({ movie }) => {
    const isFav = isFavorite(movie)
    const [showCelebration, setShowCelebration] = useState(false)

    const handleToggle = async () => {
      if (!isFav) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 1000)
      }
      await toggleFavorite(movie)
    }

    return (
      <div className="relative">
        <motion.button
          onClick={handleToggle}
          disabled={favLoading}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className="relative focus:outline-none p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          initial={false}
          whileTap={{ scale: favLoading ? 1 : 0.8 }}
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

          <motion.div
            animate={{ 
              color: isFav ? "#ff4d6d" : "#ccc",
              scale: isFav ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <Heart fill={isFav ? "#ff4d6d" : "none"} className="w-5 h-5" />
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
        </motion.button>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto">

        {/* Search Section */}
        <motion.div
          className="max-w-5xl mx-auto mb-12 mt-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Search Input */}
          <motion.div
            className="relative mb-6"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative bg-black/50 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl overflow-hidden">
              <div className="flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${searchType === 'movie' ? 'movies' : 'anime'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base font-medium"
                />
                <div className="flex items-center gap-2 mr-3">
                  <motion.button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                      showFilters || activeFilters.length > 0
                        ? 'bg-primary-red/20 border border-primary-red/30 text-primary-red'
                        : 'bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:text-white hover:border-gray-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFilters.length > 0 && (
                      <span className="bg-primary-red text-white text-xs px-1.5 py-0.5 rounded-full">
                        {activeFilters.length}
                      </span>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-primary-red to-red-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-600 hover:to-primary-red transition-all duration-300 flex items-center gap-2 shadow-lg text-sm"
                    whileHover={{ scale: !isLoading ? 1.05 : 1 }}
                    whileTap={{ scale: !isLoading ? 0.95 : 1 }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {searchQuery.trim() || activeFilters.length === 0 ? <Search className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        {searchQuery.trim() ? 'Search' : activeFilters.length > 0 ? 'Filter' : 'Search'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ✅ COMPLETE FILTERS UI */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl p-6 mt-4 max-w-5xl mx-auto"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Year Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Year
                    </label>
                    <select
                      className="w-full bg-black/50 border border-gray-600/50 hover:border-gray-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-red/50 transition-all duration-200 backdrop-blur-sm"
                      value={filters.year}
                      onChange={e => handleFilterChange('year', e.target.value)}
                    >
                      <option value="">All Years</option>
                      {yearOptions.slice(0, 20).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Genre Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Genre
                    </label>
                    <select
                      className="w-full bg-black/50 border border-gray-600/50 hover:border-gray-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-red/50 transition-all duration-200 backdrop-blur-sm"
                      value={filters.genre}
                      onChange={e => handleFilterChange('genre', e.target.value)}
                    >
                      <option value="">All Genres</option>
                      {genreOptions.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Language
                    </label>
                    <select
                      className="w-full bg-black/50 border border-gray-600/50 hover:border-gray-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-red/50 transition-all duration-200 backdrop-blur-sm"
                      value={filters.language}
                      onChange={e => handleFilterChange('language', e.target.value)}
                    >
                      <option value="">All Languages</option>
                      {languageOptions.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Rating
                    </label>
                    <select
                      className="w-full bg-black/50 border border-gray-600/50 hover:border-gray-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-red/50 transition-all duration-200 backdrop-blur-sm"
                      value={filters.rating}
                      onChange={e => handleFilterChange('rating', e.target.value)}
                    >
                      <option value="">All Ratings</option>
                      {ratingOptions.map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeFilters.map((filter, index) => (
                      <motion.div
                        key={`${filter.type}-${index}`}
                        className="flex items-center gap-2 bg-primary-red/20 border border-primary-red/30 text-primary-red px-3 py-2 rounded-full text-sm backdrop-blur-sm"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span>{filter.label}</span>
                        <motion.button
                          onClick={() => removeFilter(filter.type)}
                          className="text-primary-red hover:text-white ml-1 p-1 rounded-full hover:bg-primary-red/30 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.div>
                    ))}
                    <motion.button
                      onClick={clearAllFilters}
                      className="text-gray-400 hover:text-white px-3 py-2 rounded-full text-sm hover:bg-gray-700/50 transition-all duration-200 flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                    >
                      <X className="w-4 h-4" />
                      Clear All
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content Display */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-800 rounded-full" />
                <div className="w-16 h-16 border-4 border-primary-red border-t-transparent rounded-full animate-spin absolute top-0" />
              </div>
              <p className="text-gray-300 text-lg mt-6 font-medium">
                {searchQuery.trim() ? `Searching ${searchType}s...` : `Loading ${searchType}s...`}
              </p>
            </motion.div>
          ) : hasSearched ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {searchResults.length > 0 && (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {searchResults.map((movie, index) => (
                    <motion.div 
                      key={`${movie.imdbID}-${index}`} 
                      variants={cardVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <MovieCard
                        movie={movie}
                        user={user}
                        openAuthModal={openAuthModal}
                      />
                      <div className="absolute top-2 right-2">
                        <FavoriteHeart movie={movie} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Trending Section
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-primary-red/20 to-red-600/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-primary-red" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
                </div>
              </div>
              
              {loadingTrending ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {[...Array(18)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="aspect-[2/3] bg-gray-700 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : trendingMovies.length > 0 && (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {trendingMovies.map((movie, index) => (
                    <motion.div 
                      key={`${movie.imdbID}-${index}`} 
                      variants={cardVariants}
                      whileHover={{ scale: 1.05, y: -8 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="relative"
                    >
                      <MovieCard movie={movie} user={user} openAuthModal={openAuthModal} />
                      <div className="absolute top-2 right-2">
                        <FavoriteHeart movie={movie} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ✅ FAVORITES SECTION - USES CONTEXT */}
        {favorites.length > 0 && (
          <motion.div className="mt-16">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="w-8 h-8 text-primary-red" fill="currentColor" />
              Your Favorites ({favorites.length})
            </h2>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {favorites.map((movie, index) => (
                <motion.div 
                  key={`fav-${movie.imdbID}-${index}`} 
                  variants={cardVariants}
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative"
                >
                  <MovieCard movie={movie} user={user} openAuthModal={openAuthModal} />
                  <div className="absolute top-2 right-2">
                    <FavoriteHeart movie={movie} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Home
