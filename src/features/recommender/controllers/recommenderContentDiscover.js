const { v4: uuidv4 } = require('uuid');
const api = require('@src/utils/api');
const apiCore = require('@src/utils/apiCore');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');

/**
 * Generate a unique 10-digit TMDB ID with collision avoidance
 * @returns {number} A 10-digit numeric ID
 */
const generateTmdbId = () => {
  try {
    const uuidNumeric = BigInt('0x' + uuidv4().replace(/-/g, '')).toString();
    const tmdbId = Number(uuidNumeric.slice(0, 10)); // Ensure 10-digit tmdb_id
    
    // Verify the generated ID is valid
    if (isNaN(tmdbId) || tmdbId <= 0) {
      throw new Error('Generated invalid TMDB ID');
    }
    
    return tmdbId;
  } catch (error) {
    console.error('Error generating TMDB ID:', error);
    // Fallback to a timestamp-based ID if BigInt conversion fails
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000000);
  }
};

/**
 * Validate media type against allowed values
 * @param {string} mediaType - The media type to validate
 * @returns {boolean} Whether the media type is valid
 */
const isValidMediaType = (mediaType) => {
  const validTypes = ['movie', 'tv', 'person'];
  return validTypes.includes(mediaType);
};

/**
 * Controller for recommending content based on provided metadata
 */
const recommenderContentDiscover = async (req, res, next) => {
  try {
    const { metadata } = req.body;
    if (!metadata) {
      return errorResponse(res, 'Metadata is required', 400);
    }

    const media_type = metadata.media_type || ''; 
    
    // Validate media type if provided
    if (media_type && !isValidMediaType(media_type)) {
      return errorResponse(res, `Invalid media_type: ${media_type}. Must be one of: movie, tv, person`, 400);
    }

    let {
      title = '',
      overview,
      spoken_languages = [],  
      vote_average = 0,    
      release_year = '',
      genres = [],           
      director = [],         
      cast = [],            
      keywords = []         
    } = metadata;

    // Validation checks
    if (!overview || typeof overview !== 'string' || !overview.trim()) {
      return errorResponse(res, 'Overview is required', 400);
    }

    if (!Array.isArray(genres) || genres.length === 0) {
      return errorResponse(res, 'Genres are required and must be an array', 400);
    }

    // Ensure arrays are properly formatted
    const validateArray = (arr, fieldName) => {
      if (!Array.isArray(arr)) {
        throw new Error(`${fieldName} must be an array`);
      }
      return arr.map(item => {
        if (item === null || item === undefined) {
          return '';
        }
        return item.toString().trim().toLowerCase();
      });
    };

    // Format all arrays with additional null/undefined protection
    try {
      genres = validateArray(genres, 'genres');
      spoken_languages = validateArray(spoken_languages, 'spoken_languages');
      director = validateArray(director, 'director');
      cast = validateArray(cast, 'cast');
      keywords = validateArray(keywords, 'keywords');
    } catch (error) {
      return errorResponse(res, error.message || 'Invalid array format', 400);
    }

    // Ensure vote_average is a valid number
    vote_average = typeof vote_average === 'number' && !isNaN(vote_average) ? vote_average : 0;

    // Generate a random 10-digit tmdb_id
    const tmdb_id = generateTmdbId();

    // Format data for the recommender system
    const formattedMetadata = {
      tmdb_id,
      metadata: {
        media_type,
        title,
        overview,
        spoken_languages,
        vote_average,
        release_year,
        genres,
        director,
        cast,
        keywords
      }
    };

    console.log('Formatted metadata:', JSON.stringify(formattedMetadata, null, 2));

    // Send request to the recommender system with timeout
    let recommenderResponse;
    try {
      recommenderResponse = await Promise.race([
        apiCore.post('/content-based/v2/discover', formattedMetadata),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Recommender service timeout')), 30000)
        )
      ]);
    } catch (error) {
      console.error('Recommender service error:', error.message || 'Unknown error');
      return errorResponse(res, 'Recommender service unavailable', 503);
    }

    if (!recommenderResponse?.data?.similarMedia) {
      return errorResponse(res, 'Invalid response from recommender service', 502);
    }

    const similarMediaList = recommenderResponse.data.similarMedia;
    
    // Check if we have any recommendations
    if (!Array.isArray(similarMediaList) || similarMediaList.length === 0) {
      return successResponse(res, 'No similar media found', []);
    }

    // Set a reasonable limit to avoid overwhelming the API
    const MAX_RECOMMENDATIONS = 20;
    const limitedMediaList = similarMediaList.slice(0, MAX_RECOMMENDATIONS);

    // Fetch details of each recommended media item
    const mediaDetailsPromises = limitedMediaList.map(async (similarMedia) => {
      try {
        const tmdbId = similarMedia.tmdb_id;
        if (!tmdbId || isNaN(Number(tmdbId))) {
          console.error(`Invalid TMDB ID: ${tmdbId}`);
          return null;
        }
        
        const mediaDetails = await Promise.race([
          fetchMediaDetailsService(media_type, tmdbId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout fetching details for TMDB ID ${tmdbId}`)), 10000)
          )
        ]);
        
        return mediaDetails?.data || null;
      } catch (error) {
        console.error(`Failed to fetch details for TMDB ID ${similarMedia.tmdb_id}:`, error.message || 'Unknown error');
        return null;
      }
    });

    let mediaDetailsArray = [];
    try {
      // Wait for all promises to settle (both fulfilled and rejected)
      const results = await Promise.allSettled(mediaDetailsPromises);
      
      // Filter out null values and failed promises
      mediaDetailsArray = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
    } catch (error) {
      console.error('Error processing media details:', error);
      // Continue with whatever results we have
    }

    // If all details failed to fetch, return an appropriate message
    if (mediaDetailsArray.length === 0) {
      return successResponse(res, 'Unable to fetch details for recommended media', []);
    }

    console.log(`Retrieved ${mediaDetailsArray.length}/${limitedMediaList.length} media details`);

    // Apply filters based on vote_average if provided
    if (vote_average > 0) {
      const preFilterCount = mediaDetailsArray.length;
      mediaDetailsArray = mediaDetailsArray.filter(item => 
        item.vote_average && !isNaN(parseFloat(item.vote_average)) && parseFloat(item.vote_average) >= vote_average
      );
      console.log(`Number of recommendations after vote filtering: ${mediaDetailsArray.length}/${preFilterCount}`);
    }
    
    // Apply filter based on release_year if provided
    if (release_year && release_year.toString().trim() !== '') {
      const preFilterCount = mediaDetailsArray.length;
      // Convert target year to number for proper comparison
      const targetYear = parseInt(release_year.toString().trim(), 10);
      
      // Skip filtering if we couldn't parse the year
      if (!isNaN(targetYear)) {
        mediaDetailsArray = mediaDetailsArray.filter(item => {
          // Get date from either release_date or first_air_date
          const dateStr = item.release_date || item.first_air_date || '';
          
          // Skip items without date info
          if (!dateStr || typeof dateStr !== 'string') return false;
          
          // Extract year from date string (format: "YYYY-MM-DD") and convert to number
          const itemYear = parseInt(dateStr.substring(0, 4), 10);
          
          // Log for debugging
          console.log(`Comparing: Target year ${targetYear} with item year ${itemYear} for item ${item.title || item.name || 'unknown'}`);
          
          // Keep movies released in or after the target year
          return !isNaN(itemYear) && itemYear >= targetYear;
        });
      } else {
        console.warn(`Invalid release_year format: ${release_year}, skipping filter`);
      }
      console.log(`Number of recommendations after release year filtering: ${mediaDetailsArray.length}/${preFilterCount}`);
    }
    
    // Apply filter based on director if provided
    if (director && Array.isArray(director) && director.length > 0 && director.some(d => d.trim() !== '')) {
      const preFilterCount = mediaDetailsArray.length;
      const normalizedDirectors = director.map(d => d.toString().trim().toLowerCase());
      
      mediaDetailsArray = mediaDetailsArray.filter(item => {
        try {
          // Check if item has credits
          if (!item.credits || !Array.isArray(item.credits)) return false;
          
          // Find directors in credits
          const itemDirectors = item.credits
            .filter(credit => credit && credit.type === 'director')
            .map(dir => dir.name ? dir.name.toString().trim().toLowerCase() : '');
          
          // Check if any requested director is in the item's directors
          return normalizedDirectors.some(dir => 
            dir.trim() !== '' && itemDirectors.some(itemDir => itemDir.includes(dir))
          );
        } catch (error) {
          console.error(`Error filtering by director for item ${item.title || item.name || 'unknown'}:`, error);
          return false;
        }
      });
      
      console.log(`Number of recommendations after director filtering: ${mediaDetailsArray.length}/${preFilterCount}`);
    }
    
    // Apply filter based on cast if provided
    if (cast && Array.isArray(cast) && cast.length > 0 && cast.some(c => c.trim() !== '')) {
      const preFilterCount = mediaDetailsArray.length;
      const normalizedCast = cast.map(c => c.toString().trim().toLowerCase());
      
      mediaDetailsArray = mediaDetailsArray.filter(item => {
        try {
          // Check if item has credits
          if (!item.credits || !Array.isArray(item.credits)) return false;
          
          // Find cast members in credits
          const itemCast = item.credits
            .filter(credit => credit && credit.type === 'cast')
            .map(actor => actor.name ? actor.name.toString().trim().toLowerCase() : '');
          
          // Check if any requested cast member is in the item's cast
          return normalizedCast.some(actor => 
            actor.trim() !== '' && itemCast.some(itemActor => itemActor.includes(actor))
          );
        } catch (error) {
          console.error(`Error filtering by cast for item ${item.title || item.name || 'unknown'}:`, error);
          return false;
        }
      });
      
      console.log(`Number of recommendations after cast filtering: ${mediaDetailsArray.length}/${preFilterCount}`);
    }

    // Final check for empty results after filtering
    if (mediaDetailsArray.length === 0) {
      return successResponse(res, 'No media matched the provided filters', []);
    }

    return successResponse(res, 'Similar media fetched successfully', mediaDetailsArray);
  } catch (error) {
    console.error('Error processing request:', error?.message || 'Unknown error', error?.stack || '');
    return errorResponse(res, error?.message || 'Internal Server Error', 500);
  }
};

module.exports = recommenderContentDiscover;