// utils/api.js
// Fully optimized, rewritten, production-friendly version
// - Uses AllOrigins proxy for TMDB (stable SSL)
// - Robust caching layer
// - Clean function boundaries
// - Detailed logs (can be silenced)

// ---------- CONFIG ----------
const API_KEYS = {
  OMDB: 'b532826a',
  TMDB: '9b5e78feacad54be0f528d481ec3b176',
  YOUTUBE: 'AIzaSyC777C5Bh_QxfWna_OaNvoiLrBeGcCdrAI'
};

const BASE_URLS = {
  OMDB: 'https://www.omdbapi.com',
  TMDB: 'https://api.themoviedb.org/3',
  JIKAN: 'https://api.jikan.moe/v4',
  AUTH_API: 'http://localhost:5000/api' // keep local dev default
};

// CORS proxy config — stable, trusted SSL
const TMDB_PROXY = 'https://api.allorigins.win/raw?url=';

// Cache settings
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes default
const cache = new Map();

// Fine-grained logging toggle
const LOG = true;
const log = (...args) => { if (LOG) console.log(...args); };
const warn = (...args) => { if (LOG) console.warn(...args); };
const error = (...args) => { if (LOG) console.error(...args); };

// ---------- CACHE HELPERS ----------
const getCachedData = (key) => {
  try {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  } catch (err) {
    warn('Cache read error', err);
    return null;
  }
};

const setCachedData = (key, data, ttl = CACHE_DURATION) => {
  try {
    cache.set(key, { data, timestamp: Date.now(), ttl });
  } catch (err) {
    warn('Cache set error', err);
  }
};

export const clearCache = () => {
  cache.clear();
  log('🧹 Cache cleared');
};

// ---------- NETWORK FETCH HELPERS ----------

/**
 * Performs fetch for TMDB with a stable proxy and safe fallback to direct fetch.
 * Only proxies requests for api.themoviedb.org.
 * Returns the fetch Response object (like default fetch).
 */
const fetchWithProxy = async (url, fetchOptions = {}) => {
  try {
    if (typeof url === 'string' && url.includes('api.themoviedb.org')) {
      log('🔄 Using TMDB proxy for:', url);

      const proxied = `${TMDB_PROXY}${encodeURIComponent(url)}`;

      try {
        const resp = await fetch(proxied, fetchOptions);
        if (!resp.ok) {
          warn('⚠️ Proxy returned not-ok status, falling back to direct fetch', resp.status);
          return await fetch(url, fetchOptions);
        }
        return resp;
      } catch (proxyErr) {
        warn('⚠️ Proxy fetch failed, attempting direct TMDB fetch', proxyErr);
        return await fetch(url, fetchOptions);
      }
    }

    // Non-TMDB requests go direct
    return await fetch(url, fetchOptions);
  } catch (err) {
    error('💥 fetchWithProxy failed', err);
    throw err;
  }
};

// Small helper to process JSON with error handling
const safeJson = async (response) => {
  if (!response) throw new Error('No response to parse');
  try {
    return await response.json();
  } catch (err) {
    // If content is raw (because of proxy) try to parse as text then JSON
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch (err2) {
      throw new Error('Failed to parse JSON: ' + err2.message);
    }
  }
};

// ---------- OMDB HELPERS ----------
export const getOMDBDetails = async (imdbId) => {
  if (!imdbId) return { Response: 'False', Error: 'No IMDb ID provided' };
  const url = `${BASE_URLS.OMDB}/?i=${encodeURIComponent(imdbId)}&plot=full&apikey=${API_KEYS.OMDB}`;
  try {
    const cached = getCachedData(`omdb_detail_${imdbId}`);
    if (cached) return cached;

    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`OMDB responded with ${resp.status}`);
    }
    const data = await resp.json();
    setCachedData(`omdb_detail_${imdbId}`, data);
    log('📋 OMDB details fetched for', imdbId);
    return data;
  } catch (err) {
    error('💥 OMDB fetch error:', err);
    return { Response: 'False', Error: 'OMDB API request failed' };
  }
};

// ---------- TMDB GENRE MAP ----------
export const getGenreMap = async () => {
  const cacheKey = 'tmdb_genre_map';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URLS.TMDB}/genre/movie/list?api_key=${API_KEYS.TMDB}`;
    const resp = await fetchWithProxy(url);
    if (!resp.ok) throw new Error('TMDB genres fetch failed with ' + resp.status);
    const data = await safeJson(resp);

    const genreMap = {};
    (data.genres || []).forEach(g => {
      genreMap[g.name.toLowerCase()] = g.id;
    });

    setCachedData(cacheKey, genreMap, 60 * 60 * 1000); // 1 hour TTL
    log('📚 Genre map fetched');
    return genreMap;
  } catch (err) {
    warn('⚠️ Could not fetch genre map', err);
    return {};
  }
};

// ---------- UTILITY: CLIENT-SIDE FILTERS ----------
export const applyClientSideFilters = (movies = [], filters = {}) => {
  if (!Array.isArray(movies) || movies.length === 0) return [];

  const { year, genre, language, rating } = filters;

  return movies.filter(movie => {
    // Year
    if (year) {
      const movieYear = movie.Year || movie.release_date || '';
      const found = movieYear.toString().match(/(\d{4})/);
      const y = found ? found[1] : (movieYear ? movieYear.toString() : null);
      if (!y || y !== year) return false;
    }

    // Genre string contains check
    if (genre) {
      const movieGenres = (movie.Genre || movie.genres || '').toString().toLowerCase();
      if (!movieGenres.includes(genre.toLowerCase())) return false;
    }

    // Language
    if (language) {
      const movieLanguage = (movie.Language || movie.language || movie.original_language || '').toString().toLowerCase();
      const langMatch =
        movieLanguage.includes(language.toLowerCase()) ||
        (language === 'ko' && movieLanguage.includes('korean')) ||
        (language === 'ja' && movieLanguage.includes('japanese')) ||
        (language === 'zh' && movieLanguage.includes('chinese')) ||
        (language === 'hi' && movieLanguage.includes('hindi')) ||
        (language === 'es' && movieLanguage.includes('spanish')) ||
        (language === 'fr' && movieLanguage.includes('french')) ||
        (language === 'de' && movieLanguage.includes('german'));

      if (!langMatch) return false;
    }

    // Rating (certificate)
    if (rating) {
      const movieRating = (movie.Rated || movie.rating || '').toString();
      if (!movieRating || movieRating !== rating) return false;
    }

    return true;
  });
};

// ---------- MOVIE DETAILS (TMDB + OMDB merge) ----------
export const getMovieDetails = async (movieId, source = 'auto') => {
  if (!movieId) return { Response: 'False', Error: 'No movie ID provided' };

  const cacheKey = `movie_details_${movieId}_${source}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const isTmdbId = /^\d+$/.test(String(movieId));
    const isImdbId = /^tt\d+$/.test(String(movieId));
    let movieData = null;

    // TMDB path (numeric ID)
    if (isTmdbId && source !== 'omdb') {
      log('📋 Fetching TMDB details for', movieId);
      const url = `${BASE_URLS.TMDB}/movie/${movieId}?api_key=${API_KEYS.TMDB}&append_to_response=external_ids`;
      const resp = await fetchWithProxy(url);
      if (resp && resp.ok) {
        const tmdbData = await safeJson(resp);

        movieData = {
          Response: 'True',
          Title: tmdbData.title || 'N/A',
          Year: tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear().toString() : 'N/A',
          Rated: 'N/A',
          Released: tmdbData.release_date || 'N/A',
          Runtime: tmdbData.runtime ? `${tmdbData.runtime} min` : 'N/A',
          Genre: tmdbData.genres ? tmdbData.genres.map(g => g.name).join(', ') : 'N/A',
          Director: 'N/A',
          Writer: 'N/A',
          Actors: 'N/A',
          Plot: tmdbData.overview || 'N/A',
          Language: tmdbData.original_language || 'N/A',
          Country: tmdbData.production_countries ? tmdbData.production_countries.map(c => c.name).join(', ') : 'N/A',
          Awards: 'N/A',
          Poster: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : 'N/A',
          Ratings: [{ Source: 'TMDB', Value: tmdbData.vote_average ? `${tmdbData.vote_average}/10` : 'N/A' }],
          Metascore: 'N/A',
          imdbRating: tmdbData.vote_average ? tmdbData.vote_average.toString() : 'N/A',
          imdbVotes: tmdbData.vote_count ? tmdbData.vote_count.toString() : 'N/A',
          imdbID: tmdbData.external_ids?.imdb_id || movieId.toString(),
          Type: 'movie',
          DVD: 'N/A',
          BoxOffice: tmdbData.revenue ? `$${tmdbData.revenue.toLocaleString()}` : 'N/A',
          Production: tmdbData.production_companies ? tmdbData.production_companies.map(c => c.name).join(', ') : 'N/A',
          Website: tmdbData.homepage || 'N/A',
          tmdb_id: tmdbData.id,
          popularity: tmdbData.popularity,
          backdrop_path: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : null
        };

        // If IMDb ID exists, fetch OMDB details to enrich
        const imdbId = tmdbData.external_ids?.imdb_id;
        if (imdbId) {
          try {
            const omdbExtra = await getOMDBDetails(imdbId);
            if (omdbExtra.Response === 'True') {
              movieData = {
                ...movieData,
                Rated: omdbExtra.Rated || movieData.Rated,
                Director: omdbExtra.Director || movieData.Director,
                Writer: omdbExtra.Writer || movieData.Writer,
                Actors: omdbExtra.Actors || movieData.Actors,
                Awards: omdbExtra.Awards || movieData.Awards,
                Metascore: omdbExtra.Metascore || movieData.Metascore,
                Ratings: omdbExtra.Ratings || movieData.Ratings,
                DVD: omdbExtra.DVD || movieData.DVD
              };
            }
          } catch (err) {
            warn('⚠️ OMDB enrichment failed', err);
          }
        }
      }
    }

    // OMDB path (IMDb ID or explicit request)
    if (!movieData && (isImdbId || source === 'omdb')) {
      log('📋 Fetching OMDB details for', movieId);
      const omdb = await getOMDBDetails(movieId);
      if (omdb && omdb.Response === 'True') {
        movieData = omdb;
      }
    }

    // Fallback: try OMDB using numeric ID (rare)
    if (!movieData && isTmdbId) {
      log('📋 Fallback: trying OMDB with numeric id', movieId);
      const maybe = await getOMDBDetails(movieId);
      if (maybe && maybe.Response === 'True') movieData = maybe;
    }

    if (!movieData) movieData = { Response: 'False', Error: 'Failed to fetch movie details from any source' };

    setCachedData(cacheKey, movieData);
    log('📋 Movie details resolved:', movieData.Response);
    return movieData;
  } catch (err) {
    error('💥 getMovieDetails error', err);
    return { Response: 'False', Error: 'Failed to fetch movie details. Please try again.' };
  }
};

// ---------- TRENDING ----------
export const getTrendingMovies = async (timeWindow = 'week', page = 1) => {
  const cacheKey = `trending_${timeWindow}_${page}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('📈 Fetching trending movies from TMDB...');
    const url = `${BASE_URLS.TMDB}/trending/movie/${timeWindow}?api_key=${API_KEYS.TMDB}&page=${page}`;
    const resp = await fetchWithProxy(url);
    if (!resp.ok) throw new Error('TMDB trending API failed: ' + resp.status);
    const data = await safeJson(resp);

    const converted = (data.results || []).map(movie => ({
      imdbID: movie.id.toString(),
      tmdb_id: movie.id,
      Title: movie.title,
      Year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A',
      Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'N/A',
      Type: 'movie',
      Plot: movie.overview || 'N/A',
      Genre: 'N/A',
      Language: movie.original_language || 'N/A',
      Rated: 'N/A',
      imdbRating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
      releaseDate: movie.release_date || 'N/A',
      popularity: movie.popularity,
      source: 'tmdb',
      backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null
    }));

    const result = { success: true, movies: converted, totalResults: data.total_results || 0, source: 'tmdb' };
    setCachedData(cacheKey, result);
    log('✅ Trending fetched:', converted.length);
    return result;
  } catch (err) {
    error('💥 Error fetching trending movies:', err);
    return { success: false, movies: [], error: err.message };
  }
};

// ---------- DISCOVER (TMDB) ----------
export const discoverMoviesWithFilters = async (filters = {}, page = 1) => {
  const { year, genre, language, rating, sortBy = 'popularity.desc' } = filters;
  const params = new URLSearchParams({
    api_key: API_KEYS.TMDB,
    page: String(page),
    sort_by: sortBy,
    'vote_count.gte': '100'
  });

  if (year) params.append('primary_release_year', year);

  // genre -> id via getGenreMap
  if (genre) {
    const genreMap = await getGenreMap();
    const genreId = genreMap[genre.toLowerCase()];
    if (genreId) params.append('with_genres', String(genreId));
  }

  if (language) params.append('with_original_language', language);

  if (rating) {
    params.append('certification_country', 'US');
    params.append('certification', rating);
  }

  const queryString = params.toString();
  const cacheKey = `discover_${queryString}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🔍 Discovering movies with filters:', filters);
    const url = `${BASE_URLS.TMDB}/discover/movie?${queryString}`;
    const resp = await fetchWithProxy(url);
    if (!resp.ok) throw new Error('TMDB discover API failed: ' + resp.status);
    const data = await safeJson(resp);

    const converted = (data.results || []).map(movie => ({
      imdbID: movie.id.toString(),
      tmdb_id: movie.id,
      Title: movie.title,
      Year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A',
      Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'N/A',
      Type: 'movie',
      Plot: movie.overview || 'N/A',
      Genre: 'N/A',
      Language: movie.original_language || 'N/A',
      Rated: 'N/A',
      imdbRating: movie.vote_average ? movie.vote_average.toString() : 'N/A',
      releaseDate: movie.release_date || 'N/A',
      popularity: movie.popularity,
      source: 'tmdb',
      backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null
    }));

    const result = {
      success: true,
      movies: converted,
      totalResults: data.total_results,
      totalPages: data.total_pages,
      source: 'tmdb'
    };

    setCachedData(cacheKey, result);
    log('✅ Discover complete:', converted.length);
    return result;
  } catch (err) {
    error('💥 Error discovering movies:', err);
    return { success: false, movies: [], error: err.message };
  }
};

// ---------- SEARCH (combined: TMDB -> OMDB fallback) ----------
export const combinedSearch = async (query, page = 1) => {
  if (!query || !query.trim()) return { success: false, error: 'Empty query' };

  const cacheKey = `combined_search_${query}_${page}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🔍 Trying TMDB search for:', query);
    const tmdbUrl = `${BASE_URLS.TMDB}/search/movie?api_key=${API_KEYS.TMDB}&query=${encodeURIComponent(query)}&page=${page}`;
    const tmdbResp = await fetchWithProxy(tmdbUrl);

    if (tmdbResp && tmdbResp.ok) {
      const tmdbData = await safeJson(tmdbResp);
      if (Array.isArray(tmdbData.results) && tmdbData.results.length > 0) {
        const result = { success: true, source: 'tmdb', data: tmdbData, totalResults: tmdbData.total_results || 0 };
        setCachedData(cacheKey, result);
        log('✅ TMDB search successful:', result.totalResults);
        return result;
      }
    }

    log('❌ TMDB returned no results, trying OMDB for:', query);
    const omdbUrl = `${BASE_URLS.OMDB}/?s=${encodeURIComponent(query)}&page=${page}&apikey=${API_KEYS.OMDB}`;
    const omdbResp = await fetch(omdbUrl);
    if (omdbResp && omdbResp.ok) {
      const omdbData = await omdbResp.json();
      if (omdbData.Response === 'True' && omdbData.Search) {
        const result = { success: true, source: 'omdb', data: omdbData, totalResults: parseInt(omdbData.totalResults) || 0 };
        setCachedData(cacheKey, result);
        log('✅ OMDB search successful:', result.totalResults);
        return result;
      }
    }

    log('❌ All search methods failed for:', query);
    return { success: false, error: 'No results found from any source' };
  } catch (err) {
    error('💥 Combined search error', err);
    return { success: false, error: err.message };
  }
};

// Higher-level search with filters that returns unified movie objects
export const searchWithFilters = async (query, filters = {}, page = 1) => {
  try {
    if (!query || !query.trim()) {
      // If empty query, use discover endpoint
      return await discoverMoviesWithFilters(filters, page);
    }

    const searchResult = await combinedSearch(query, page);
    if (!searchResult.success) return searchResult;

    let movies = [];

    if (searchResult.source === 'omdb') {
      movies = searchResult.data.Search || [];
    } else if (searchResult.source === 'tmdb') {
      movies = (searchResult.data.results || []).map(movie => ({
        imdbID: movie.id.toString(),
        Title: movie.title,
        Year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A',
        Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'N/A',
        Type: 'movie',
        Genre: 'N/A',
        Language: movie.original_language || 'N/A',
        Rated: 'N/A',
        tmdb_id: movie.id
      }));
    }

    const filtered = applyClientSideFilters(movies, filters);
    return { success: true, movies: filtered, totalResults: filtered.length, source: searchResult.source };
  } catch (err) {
    error('💥 searchWithFilters error:', err);
    return { success: false, movies: [], error: err.message };
  }
};

// ---------- LEGACY OMDB SEARCH ----------
export const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) return { Search: [], totalResults: 0 };

  const cacheKey = `search_${query}_${page}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🎬 Direct OMDB search for:', query);
    const url = `${BASE_URLS.OMDB}/?s=${encodeURIComponent(query)}&page=${page}&apikey=${API_KEYS.OMDB}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('OMDB search failed: ' + resp.status);
    const data = await resp.json();
    setCachedData(cacheKey, data);
    log('🎬 OMDB search result:', data.Response);
    return data;
  } catch (err) {
    error('💥 Error searching movies (OMDB):', err);
    return { Response: 'False', Error: 'Failed to search movies. Please try again.' };
  }
};

// ---------- TITLE -> MOVIE ----------
export const getMovieByTitle = async (title, year = null) => {
  if (!title || !title.trim()) return { Response: 'False', Error: 'No title provided' };

  const yearParam = year ? `&y=${year}` : '';
  const cacheKey = `title_${title}_${year || 'any'}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🔍 Getting movie by title:', title, year ? `(${year})` : '');
    const url = `${BASE_URLS.OMDB}/?t=${encodeURIComponent(title)}${yearParam}&plot=full&apikey=${API_KEYS.OMDB}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('OMDB title fetch failed: ' + resp.status);
    const data = await resp.json();
    setCachedData(cacheKey, data);
    log('🔍 Movie by title result:', data.Response);
    return data;
  } catch (err) {
    error('💥 Error fetching movie by title:', err);
    return { Response: 'False', Error: 'Failed to fetch movie. Please try again.' };
  }
};

// ---------- ANIME (JIKAN) ----------
export const searchAnime = async (query, page = 1) => {
  if (!query || !query.trim()) return { data: [], pagination: { items: { total: 0 } } };

  const cacheKey = `anime_search_${query}_${page}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('📺 Searching anime for:', query);
    const url = `${BASE_URLS.JIKAN}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Jikan anime search failed: ' + resp.status);
    const data = await resp.json();
    setCachedData(cacheKey, data);
    log('📺 Anime search result:', data.data?.length || 0);
    return data;
  } catch (err) {
    error('💥 Error searching anime:', err);
    return { data: [], pagination: { items: { total: 0 } }, error: 'Failed to search anime. Please try again.' };
  }
};

export const getAnimeDetails = async (animeId) => {
  if (!animeId) return { data: null, error: 'No anime ID provided' };
  const cacheKey = `anime_${animeId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('📋 Getting anime details for:', animeId);
    const url = `${BASE_URLS.JIKAN}/anime/${animeId}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Jikan anime fetch failed: ' + resp.status);
    const data = await resp.json();
    setCachedData(cacheKey, data);
    log('📋 Anime details fetched');
    return data;
  } catch (err) {
    error('💥 Error fetching anime details:', err);
    return { data: null, error: 'Failed to fetch anime details. Please try again.' };
  }
};

// ---------- AUTH (login/signup) ----------
export const loginUser = async (email, password) => {
  try {
    const resp = await fetch(`${BASE_URLS.AUTH_API}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Login failed');
    return { success: true, user: data.user, message: data.message };
  } catch (err) {
    error('Login error:', err);
    return { success: false, error: err.message || 'Network error occurred' };
  }
};

export const signupUser = async (userData) => {
  try {
    const resp = await fetch(`${BASE_URLS.AUTH_API}/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Signup failed');
    return { success: true, user: data.user, message: data.message };
  } catch (err) {
    error('Signup error:', err);
    return { success: false, error: err.message || 'Network error occurred' };
  }
};

// ---------- FAVORITES (DB-first, localStorage fallback) ----------
export const addToFavorites = async (userId, movie) => {
  try {
    log('🎬 Adding to favorites (DB-first):', { userId, movieId: movie.imdbID });

    const resp = await fetch(`${BASE_URLS.AUTH_API}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        movieId: movie.imdbID,
        title: movie.Title,
        posterPath: movie.Poster,
        year: movie.Year,
        genre: movie.Genre,
        rating: movie.imdbRating,
        runtime: movie.Runtime
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      warn('⚠️ Database add favorites failed, falling back to localStorage', data);
      const { addToFavorites: addLocal } = await import('./localStorage.js');
      const localSuccess = addLocal(userId, movie);
      return { success: localSuccess, error: localSuccess ? null : 'Failed to add to favorites', source: 'localStorage' };
    }

    log('✅ Added to DB favorites');
    return { success: true, data, source: 'database' };
  } catch (err) {
    error('💥 addToFavorites error:', err);
    try {
      const { addToFavorites: addLocal } = await import('./localStorage.js');
      const localSuccess = addLocal(userId, movie);
      log('📦 Local fallback addToFavorites:', localSuccess);
      return { success: localSuccess, error: localSuccess ? null : 'Failed to add to favorites', source: 'localStorage' };
    } catch (localErr) {
      error('💥 localStorage fallback failed:', localErr);
      return { success: false, error: 'Network error occurred' };
    }
  }
};

export const removeFromFavorites = async (userId, movieId) => {
  try {
    log('🗑️ Removing from favorites (DB-first):', { userId, movieId });

    const resp = await fetch(`${BASE_URLS.AUTH_API}/favorites/${userId}/${movieId}`, { method: 'DELETE' });
    if (!resp.ok) {
      warn('⚠️ DB remove failed, falling back to localStorage');
      const { removeFromFavorites: removeLocal } = await import('./localStorage.js');
      const localSuccess = removeLocal(userId, movieId);
      return { success: localSuccess, error: localSuccess ? null : 'Failed to remove from favorites', source: 'localStorage' };
    }

    log('✅ Removed from DB favorites');
    return { success: true, source: 'database' };
  } catch (err) {
    error('💥 removeFromFavorites error:', err);
    try {
      const { removeFromFavorites: removeLocal } = await import('./localStorage.js');
      const localSuccess = removeLocal(userId, movieId);
      log('📦 Local fallback removeFromFavorites:', localSuccess);
      return { success: localSuccess, error: localSuccess ? null : 'Failed to remove from favorites', source: 'localStorage' };
    } catch (localErr) {
      error('💥 localStorage fallback failed:', localErr);
      return { success: false, error: 'Network error occurred' };
    }
  }
};

export const getUserFavorites = async (userId) => {
  try {
    log('📋 Getting user favorites (DB-first):', userId);

    const resp = await fetch(`${BASE_URLS.AUTH_API}/favorites/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!resp.ok) {
      warn('⚠️ DB fetch failed, falling back to localStorage');
      const { getFavorites } = await import('./localStorage.js');
      const localFavorites = getFavorites(userId);
      return { success: true, favorites: localFavorites, source: 'localStorage' };
    }

    const data = await resp.json();
    log('✅ Fetched DB favorites:', data.favorites?.length || 0);
    return { success: true, favorites: data.favorites || [], source: 'database' };
  } catch (err) {
    error('💥 getUserFavorites error:', err);
    try {
      const { getFavorites } = await import('./localStorage.js');
      const localFavorites = getFavorites(userId);
      log('📦 Local fallback favorites:', localFavorites.length);
      return { success: true, favorites: localFavorites, source: 'localStorage' };
    } catch (localErr) {
      error('💥 localStorage fallback failed:', localErr);
      return { success: false, error: 'Network error occurred', favorites: [] };
    }
  }
};

export const checkIfFavorite = async (userId, movieId) => {
  try {
    log('🔍 Checking favorite status for', { userId, movieId });
    const res = await getUserFavorites(userId);
    if (res.success && res.favorites) {
      const isFav = res.favorites.some(fav => fav.movieId === movieId || fav.imdbID === movieId);
      log('✅ Favorite check:', isFav, '(source:', res.source + ')');
      return isFav;
    }
    return false;
  } catch (err) {
    error('💥 checkIfFavorite error:', err);
    try {
      const { isFavorite } = await import('./localStorage.js');
      return isFavorite(userId, movieId);
    } catch (localErr) {
      error('💥 localStorage favorite check failed:', localErr);
      return false;
    }
  }
};

export const toggleFavorite = async (userId, movie) => {
  try {
    const isFav = await checkIfFavorite(userId, movie.imdbID);
    if (isFav) {
      log('🔄 Toggling: removing');
      return await removeFromFavorites(userId, movie.imdbID);
    } else {
      log('🔄 Toggling: adding');
      return await addToFavorites(userId, movie);
    }
  } catch (err) {
    error('💥 toggleFavorite error:', err);
    try {
      const { toggleFavorite: toggleLocal } = await import('./localStorage.js');
      const localSuccess = toggleLocal(userId, movie);
      return { success: localSuccess, error: localSuccess ? null : 'Failed to toggle favorite', source: 'localStorage' };
    } catch (localErr) {
      error('💥 localStorage toggle failed:', localErr);
      return { success: false, error: 'Network error occurred' };
    }
  }
};

// ---------- YOUTUBE TRAILER ----------
export const getYouTubeTrailer = async (movieTitle, year) => {
  if (!movieTitle) return { success: false, error: 'No movie title provided' };

  const cacheKey = `trailer_${movieTitle}_${year || ''}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🎬 Searching YouTube trailers for:', movieTitle, year);

    const queries = [
      `${movieTitle} ${year} official trailer`,
      `${movieTitle} ${year} trailer`,
      `${movieTitle} official trailer`,
      `${movieTitle} movie trailer`
    ];

    for (const q of queries) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(q)}&type=video&key=${API_KEYS.YOUTUBE}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('YouTube API request failed: ' + resp.status);
      const data = await resp.json();

      if (Array.isArray(data.items) && data.items.length > 0) {
        const trailer = data.items.find(item =>
          item.snippet.title.toLowerCase().includes('trailer') ||
          item.snippet.title.toLowerCase().includes('official')
        ) || data.items[0];

        const result = {
          success: true,
          videoId: trailer.id.videoId,
          title: trailer.snippet.title,
          description: trailer.snippet.description,
          thumbnail: trailer.snippet.thumbnails.high?.url || trailer.snippet.thumbnails.default.url
        };

        setCachedData(cacheKey, result, 24 * 60 * 60 * 1000); // 24-hour TTL
        log('✅ Trailer found:', result.title);
        return result;
      }
    }

    log('❌ No trailer found for:', movieTitle);
    return { success: false, error: 'No trailer found for this movie' };
  } catch (err) {
    error('💥 Error fetching YouTube trailer:', err);
    return { success: false, error: err.message || 'Failed to fetch trailer' };
  }
};

// ---------- CREDITS (cast & crew) ----------
export const getMovieCredits = async (movieId) => {
  const cacheKey = `movie_credits_${movieId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    let tmdbId = movieId;
    // If IMDb id provided, find tmdb id
    if (typeof movieId === 'string' && movieId.startsWith('tt')) {
      const findUrl = `${BASE_URLS.TMDB}/find/${movieId}?api_key=${API_KEYS.TMDB}&external_source=imdb_id`;
      const findResp = await fetchWithProxy(findUrl);
      if (!findResp.ok) throw new Error('TMDB find failed: ' + findResp.status);
      const findData = await safeJson(findResp);
      if (findData.movie_results && findData.movie_results.length > 0) tmdbId = findData.movie_results[0].id;
      else throw new Error('TMDB ID not found for IMDb ID');
    }

    log('🎭 Fetching movie credits for TMDB ID:', tmdbId);
    const creditsUrl = `${BASE_URLS.TMDB}/movie/${tmdbId}/credits?api_key=${API_KEYS.TMDB}`;
    const creditsResp = await fetchWithProxy(creditsUrl);
    if (!creditsResp.ok) throw new Error('Failed to fetch movie credits: ' + creditsResp.status);
    const data = await safeJson(creditsResp);

    const processedCast = (data.cast || []).slice(0, 20).map(person => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profile_path: person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : null,
      order: person.order,
      popularity: person.popularity
    }));

    const processedCrew = (data.crew || []).slice(0, 20).map(person => ({
      id: person.id,
      name: person.name,
      job: person.job,
      department: person.department,
      profile_path: person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : null,
      popularity: person.popularity
    }));

    const result = { cast: processedCast, crew: processedCrew, id: tmdbId };
    setCachedData(cacheKey, result);
    log('✅ Movie credits fetched:', processedCast.length, 'cast,', processedCrew.length, 'crew');
    return result;
  } catch (err) {
    error('💥 Error fetching movie credits:', err);
    return { cast: [], crew: [], error: err.message };
  }
};

// ---------- PERSON MOVIES ----------
export const getPersonMovies = async (personId) => {
  const cacheKey = `person_movies_${personId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    log('🎬 Fetching person movies for ID:', personId);
    const url = `${BASE_URLS.TMDB}/person/${personId}/movie_credits?api_key=${API_KEYS.TMDB}`;
    const resp = await fetchWithProxy(url);
    if (!resp.ok) throw new Error('Failed to fetch person movies: ' + resp.status);
    const data = await safeJson(resp);

    const castMovies = (data.cast || []).slice(0, 10).map(movie => ({
      id: movie.id,
      title: movie.title,
      character: movie.character,
      release_date: movie.release_date,
      poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
      vote_average: movie.vote_average
    }));

    const crewMovies = (data.crew || []).slice(0, 10).map(movie => ({
      id: movie.id,
      title: movie.title,
      job: movie.job,
      department: movie.department,
      release_date: movie.release_date,
      poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
      vote_average: movie.vote_average
    }));

    const result = { cast: castMovies, crew: crewMovies, id: personId };
    setCachedData(cacheKey, result);
    log('✅ Person movies fetched:', castMovies.length, 'as actor,', crewMovies.length, 'as crew');
    return result;
  } catch (err) {
    error('💥 Error fetching person movies:', err);
    return { cast: [], crew: [], error: err.message };
  }
};

// ---------- FINAL EXPORTS (already exported inline) ----------
/*
  The module already exports each function as 'export const ...'.
  If you prefer a default export object, uncomment below:

export default {
  getMovieDetails, getTrendingMovies, discoverMoviesWithFilters,
  searchWithFilters, combinedSearch, searchMovies, getMovieByTitle,
  searchAnime, getAnimeDetails, loginUser, signupUser,
  addToFavorites, removeFromFavorites, getUserFavorites, checkIfFavorite, toggleFavorite,
  getYouTubeTrailer, getMovieCredits, getPersonMovies, clearCache
};
*/

// End of file
