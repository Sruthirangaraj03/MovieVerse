// controllers/favoriteController.js - FIXED WITH PROPER ID MATCHING
const Favorite = require('../models/Favorite');
const axios = require('axios');

// Helper function to fetch movie poster if missing
const fetchMoviePoster = async (movieId) => {
  try {
    // Try OMDB first
    const omdbKey = 'b532826a';
    const omdbUrl = `http://www.omdbapi.com/?i=${movieId}&apikey=${omdbKey}`;
    const omdbResponse = await axios.get(omdbUrl);
    
    if (omdbResponse.data.Response === 'True' && omdbResponse.data.Poster !== 'N/A') {
      console.log('✅ Fetched poster from OMDB:', omdbResponse.data.Poster);
      return omdbResponse.data.Poster;
    }

    // If OMDB fails and movieId is numeric (TMDB ID), try TMDB
    if (/^\d+$/.test(movieId)) {
      const tmdbKey = '9b5e78feacad54be0f528d481ec3b176';
      const tmdbUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbKey}`;
      const tmdbResponse = await axios.get(tmdbUrl);
      
      if (tmdbResponse.data.poster_path) {
        const posterUrl = `https://image.tmdb.org/t/p/w500${tmdbResponse.data.poster_path}`;
        console.log('✅ Fetched poster from TMDB:', posterUrl);
        return posterUrl;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch poster for movie:', movieId, error.message);
  }
  
  return 'N/A';
};

// @desc    Add movie to favorites
// @route   POST /api/favorites
const addFavorite = async (req, res) => {
  try {
    console.log('📥 Request body:', req.body);
    
    const { 
      userId, 
      movieId, 
      title, 
      poster, 
      posterPath, 
      year, 
      rating, 
      genre, 
      type,
      runtime,
      plot
    } = req.body;

    // ✅ Validation
    if (!userId || !movieId) {
      return res.status(400).json({
        success: false,
        message: 'userId and movieId are required'
      });
    }

    console.log('📥 Adding favorite:', { userId, movieId, title });

    // ✅ CRITICAL: Check if already exists BY MOVIE ID
    const existingByMovieId = await Favorite.findOne({ userId, movieId });

    if (existingByMovieId) {
      console.log('⚠️ Movie already in favorites (by movieId):', movieId);
      return res.status(400).json({
        success: false,
        message: 'Movie already in favorites',
        favorite: existingByMovieId
      });
    }

    // ✅ CRITICAL: Check if already exists BY TITLE + YEAR (catches duplicates from different API sources)
    if (title && year) {
      const existingByTitleYear = await Favorite.findOne({ 
        userId, 
        title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
        year 
      });

      if (existingByTitleYear) {
        console.log('⚠️ Movie already in favorites (by Title+Year):', title, year);
        console.log('   Existing movieId:', existingByTitleYear.movieId, 'vs New movieId:', movieId);
        return res.status(400).json({
          success: false,
          message: 'Movie already in favorites',
          favorite: existingByTitleYear
        });
      }
    }

    // ✅ Handle poster URL properly
    let finalPoster = posterPath || poster;
    
    // Convert TMDB paths to full URLs
    if (finalPoster && finalPoster.startsWith('/')) {
      finalPoster = `https://image.tmdb.org/t/p/w500${finalPoster}`;
      console.log('🖼️ Converted TMDB path to full URL:', finalPoster);
    } 
    // If no poster or "N/A", try to fetch
    else if (!finalPoster || finalPoster === 'N/A' || finalPoster === '') {
      console.log('⚠️ No poster provided, attempting to fetch...');
      finalPoster = await fetchMoviePoster(movieId);
    }

    console.log('🖼️ Final poster URL:', finalPoster);

    // ✅ Create new favorite
    const newFavorite = new Favorite({
      userId,
      movieId,
      title: title || 'Unknown',
      poster: finalPoster,
      year: year || 'N/A',
      rating: rating || 'N/A',
      genre: genre || 'N/A',
      type: type || 'movie',
      runtime: runtime || 'N/A',
      plot: plot || 'N/A',
      addedAt: new Date()
    });

    await newFavorite.save();

    console.log('✅ Favorite added successfully:', { movieId, title, poster: finalPoster });

    res.status(201).json({
      success: true,
      message: 'Added to favorites successfully',
      favorite: newFavorite
    });
  } catch (error) {
    console.error('❌ Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding favorite',
      error: error.message
    });
  }
};

// @desc    Get all favorites for a user
// @route   GET /api/favorites/:userId
const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📥 Fetching favorites for userId:', userId);

    // ✅ Find all favorites for user
    const favorites = await Favorite.find({ userId }).sort({ addedAt: -1 });

    console.log(`✅ Found ${favorites.length} favorites`);

    // ✅ Log poster URLs for debugging
    if (favorites.length > 0) {
      console.log('🖼️ Sample poster:', favorites[0].poster);
    }

    res.status(200).json({
      success: true,
      favorites: favorites || [],
      count: favorites.length
    });
  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching favorites',
      error: error.message
    });
  }
};

// @desc    Check if movie is in favorites
// @route   GET /api/favorites/:userId/check/:movieId
const checkFavorite = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    console.log('🔍 Checking favorite:', { userId, movieId });

    const favorite = await Favorite.findOne({ userId, movieId });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
      favorite: favorite || null
    });
  } catch (error) {
    console.error('❌ Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking favorite',
      error: error.message
    });
  }
};

// ✅ FIXED: Remove movie from favorites - simplified with raw TMDB IDs
// @route   DELETE /api/favorites/:userId/:movieId
const removeFavorite = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    console.log('📥 Removing favorite:', { userId, movieId });

    // ✅ Strategy 1: Try exact movieId match first
    let deleted = await Favorite.findOneAndDelete({ userId, movieId });

    if (deleted) {
      console.log('✅ Removed by exact movieId match:', movieId);
      return res.status(200).json({
        success: true,
        message: 'Removed from favorites successfully',
        deleted
      });
    }

    // ✅ Strategy 2: If movieId has 'tmdb-' prefix, try without it
    if (movieId.startsWith('tmdb-')) {
      const rawTmdbId = movieId.replace('tmdb-', '');
      deleted = await Favorite.findOneAndDelete({ userId, movieId: rawTmdbId });
      
      if (deleted) {
        console.log('✅ Removed by TMDB ID (without prefix):', rawTmdbId);
        return res.status(200).json({
          success: true,
          message: 'Removed from favorites successfully',
          deleted
        });
      }
    }

    // ✅ Strategy 3: If it's a numeric ID, try with 'tmdb-' prefix
    if (/^\d+$/.test(movieId)) {
      const withPrefix = `tmdb-${movieId}`;
      deleted = await Favorite.findOneAndDelete({ userId, movieId: withPrefix });
      
      if (deleted) {
        console.log('✅ Removed by TMDB ID (with prefix):', withPrefix);
        return res.status(200).json({
          success: true,
          message: 'Removed from favorites successfully',
          deleted
        });
      }
    }

    // ✅ Strategy 4: If it's a custom ID, extract and match by year
    if (movieId.startsWith('custom-')) {
      const parts = movieId.split('-');
      const year = parts[parts.length - 1];
      
      deleted = await Favorite.findOneAndDelete({ userId, year });
      
      if (deleted) {
        console.log('✅ Removed by custom ID + year match:', year);
        return res.status(200).json({
          success: true,
          message: 'Removed from favorites successfully',
          deleted
        });
      }
    }

    // ❌ Not found
    console.log('⚠️ Favorite not found after all strategies:', movieId);
    
    // Show what favorites exist
    const existingFavs = await Favorite.find({ userId });
    console.log('📋 Available favorites:', existingFavs.map(f => ({ 
      id: f.movieId, 
      title: f.title 
    })));
    
    return res.status(404).json({
      success: false,
      message: 'Favorite not found'
    });

  } catch (error) {
    console.error('❌ Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing favorite',
      error: error.message
    });
  }
};

// @desc    Clear all favorites for a user
// @route   DELETE /api/favorites/:userId/clear
const clearAllFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📥 Clearing all favorites for userId:', userId);

    const result = await Favorite.deleteMany({ userId });

    console.log(`✅ Cleared ${result.deletedCount} favorites`);

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} favorites`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing favorites',
      error: error.message
    });
  }
};

// @desc    Update existing favorites with missing posters
// @route   POST /api/favorites/update-posters/:userId
const updateFavoritePosters = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔄 Updating posters for userId:', userId);

    const favorites = await Favorite.find({ 
      userId, 
      $or: [
        { poster: 'N/A' },
        { poster: '' },
        { poster: { $exists: false } }
      ]
    });

    console.log(`📋 Found ${favorites.length} favorites needing poster updates`);

    let updatedCount = 0;

    for (const fav of favorites) {
      const newPoster = await fetchMoviePoster(fav.movieId);
      
      if (newPoster !== 'N/A') {
        fav.poster = newPoster;
        await fav.save();
        updatedCount++;
        console.log(`✅ Updated poster for: ${fav.title}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} posters`,
      updatedCount,
      totalChecked: favorites.length
    });
  } catch (error) {
    console.error('❌ Error updating posters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating posters',
      error: error.message
    });
  }
};

// ✅ Cleanup duplicate favorites
// @desc    Remove duplicate favorites for a user
// @route   POST /api/favorites/:userId/cleanup-duplicates
const cleanupDuplicates = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🧹 Starting duplicate cleanup for userId:', userId);

    // Get all favorites for this user
    const favorites = await Favorite.find({ userId }).sort({ addedAt: 1 });
    console.log(`📋 Found ${favorites.length} total favorites`);

    // Track seen movies (by Title + Year)
    const seen = new Map();
    const toDelete = [];

    for (const fav of favorites) {
      const key = `${fav.title?.toLowerCase()}-${fav.year}`;
      
      if (seen.has(key)) {
        // Duplicate found!
        console.log(`⚠️ Duplicate: ${fav.title} (${fav.year})`);
        console.log(`   IDs: ${seen.get(key)} vs ${fav.movieId}`);
        toDelete.push(fav._id);
      } else {
        // First occurrence, keep it
        seen.set(key, fav.movieId);
      }
    }

    // Delete duplicates
    if (toDelete.length > 0) {
      const result = await Favorite.deleteMany({ _id: { $in: toDelete } });
      console.log(`✅ Removed ${result.deletedCount} duplicates`);
      
      res.status(200).json({
        success: true,
        message: `Removed ${result.deletedCount} duplicate favorites`,
        removedCount: result.deletedCount,
        totalChecked: favorites.length
      });
    } else {
      console.log('✓ No duplicates found');
      res.status(200).json({
        success: true,
        message: 'No duplicates found',
        removedCount: 0,
        totalChecked: favorites.length
      });
    }
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cleaning up duplicates',
      error: error.message
    });
  }
};

module.exports = {
  addFavorite,
  getUserFavorites,
  checkFavorite,
  removeFavorite,
  clearAllFavorites,
  updateFavoritePosters,
  cleanupDuplicates
};