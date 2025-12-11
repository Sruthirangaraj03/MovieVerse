// src/components/MovieCard.jsx – FINAL VERSION
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Heart, Star, Play, Calendar, Film } from 'lucide-react'

// ✅ New API import (correct)
import { addToFavorites, removeFromFavorites } from '../utils/api'

const MovieCard = ({ 
  movie, 
  user, 
  openAuthModal, 
  showRemove = false, 
  onRemove,
  refreshUser   // ✅ IMPORTANT: added for live favorites sync
}) => {

  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // ✅ Detect if this movie is already in user's favorites
  const [isFav, setIsFav] = useState(
    user && user.favorites 
      ? user.favorites.some(fav => fav.productId === movie.imdbID)
      : false
  )

  // ✅ Final working favorite toggle function
  const handleFavoriteClick = async (e) => {
    e.stopPropagation();

    if (!user) {
      openAuthModal('login')
      return
    }

    try {
      if (isFav) {
        // ✅ REMOVE FROM FAVORITES
        const result = await removeFromFavorites(user._id, movie.imdbID)

        if (result.success) {
          await refreshUser()     // ✅ update user.favorites instantly
          setIsFav(false)

          // ✅ Remove card from favorites page
          if (showRemove && onRemove) {
            onRemove(movie.imdbID)
          }
        }

      } else {
        // ✅ ADD TO FAVORITES
        const result = await addToFavorites(user._id, movie)

        if (result.success) {
          await refreshUser()     // ✅ update user.favorites instantly
          setIsFav(true)

          // ✅ Move to favorites page
          navigate('/favorites')
        }
      }
    } catch (err) {
      console.error('Error updating favorites:', err)
    }
  }

  // ✅ Navigate to movie details
  const handleCardClick = () => {
    navigate(`/movie/${movie.imdbID}`)
  }

  const getRatingColor = (rating) => {
    const num = parseFloat(rating)
    if (num >= 8) return 'text-green-400'
    if (num >= 6) return 'text-yellow-400'
    if (num >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  return (
    <motion.div
      className="group relative bg-card-gradient rounded-xl overflow-hidden border border-white/10 hover:border-primary-red/30 transition-all duration-300 cursor-pointer"
      variants={cardVariants}
      whileHover={{
        y: -5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(220,38,38,0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >

      {/* ✅ Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageError && movie.Poster && movie.Poster !== 'N/A' ? (
          <motion.img
            src={movie.Poster}
            alt={movie.Title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
            initial={{ scale: 1.1 }}
            animate={{ scale: isHovered ? 1.15 : 1 }}
            transition={{ duration: 0.7 }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-smoke to-primary-gray flex items-center justify-center">
            <Film className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* ✅ Hover overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* ✅ Play button */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-primary-red/90 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </motion.div>

        {/* ✅ Favorite Heart Button */}
        <motion.button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-primary-red/20 hover:border-primary-red/50 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: isHovered || isFav ? 1 : 0,
            scale: isHovered || isFav ? 1 : 0
          }}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${
              isFav
                ? 'text-primary-red fill-current'
                : 'text-white hover:text-primary-red'
            }`}
          />
        </motion.button>

        {/* ✅ Type Badge */}
        {movie.Type && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded border border-white/20">
              {movie.Type}
            </span>
          </div>
        )}
      </div>

      {/* ✅ Movie Info */}
      <div className="p-4">
        <motion.h3
          className="font-bold text-white text-lg mb-2 line-clamp-2 leading-tight"
          animate={{ color: isHovered ? '#DC2626' : '#FFFFFF' }}
        >
          {movie.Title}
        </motion.h3>

        <div className="space-y-2">

          {/* ✅ Year + Rating row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{movie.Year}</span>
            </div>

            {movie.imdbRating && movie.imdbRating !== 'N/A' && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className={`font-medium ${getRatingColor(movie.imdbRating)}`}>
                  {movie.imdbRating}
                </span>
              </div>
            )}
          </div>

          {/* ✅ Genres */}
          {movie.Genre && movie.Genre !== 'N/A' && (
            <div className="flex flex-wrap gap-1">
              {movie.Genre.split(',').slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded border border-white/10"
                >
                  {genre.trim()}
                </span>
              ))}
              {movie.Genre.split(',').length > 3 && (
                <span className="text-gray-400 text-xs py-1">
                  +{movie.Genre.split(',').length - 3} more
                </span>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ✅ Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-red/0 via-primary-red/5 to-primary-red/0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

export default MovieCard
