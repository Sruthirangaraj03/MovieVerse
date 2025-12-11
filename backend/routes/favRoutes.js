// routes/favorites.js - COMPLETE ROUTES WITH CLEANUP
const express = require('express');
const router = express.Router();
const {
  addFavorite,
  getUserFavorites,
  checkFavorite,
  removeFavorite,
  clearAllFavorites,
  updateFavoritePosters,
  cleanupDuplicates  // ✅ Import new cleanup function
} = require('../controllers/favoriteController');

// ✅ Get all favorites for a user
router.get('/:userId', getUserFavorites);

// ✅ Check if a specific movie is in favorites
router.get('/:userId/check/:movieId', checkFavorite);

// ✅ Add a movie to favorites
router.post('/', addFavorite);

// ✅ Remove a movie from favorites
router.delete('/:userId/:movieId', removeFavorite);

// ✅ Clear all favorites for a user
router.delete('/:userId/clear', clearAllFavorites);

// ✅ Update missing posters
router.post('/update-posters/:userId', updateFavoritePosters);

// ✅ NEW: Cleanup duplicate favorites for a user
router.post('/:userId/cleanup-duplicates', cleanupDuplicates);

module.exports = router;