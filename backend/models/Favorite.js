// models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,  // Can be MongoDB _id or email
    required: true,
    index: true
  },
  movieId: {
    type: String,  // IMDb ID or TMDB ID
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: 'N/A'
  },
  year: {
    type: String,
    default: 'N/A'
  },
  rating: {
    type: String,
    default: 'N/A'
  },
  genre: {
    type: String,
    default: 'N/A'
  },
  type: {
    type: String,
    default: 'movie'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicates
favoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);