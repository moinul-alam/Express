const fetchMediaDetailsService = require('@src/features/recommender/services/fetchMediaDetailsService');

const getMetadataHelper = async (tmdbIds, mediaType = 'movie') => {
  if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
    throw new Error('Invalid or empty list of tmdb_ids');
  }

  try {
    const mediaDetailsPromises = tmdbIds.map(async (tmdbId) => {
      try {
        const result = await fetchMediaDetailsService(mediaType, tmdbId);
        console.log(`Raw response for TMDB ID ${tmdbId}:`, result);

        if (!result || result.status !== 'success') {
          console.warn(`Failed to fetch details for TMDB ID ${tmdbId}:`, result?.status || 'No status');
          return null;
        }

        const metadata = result.data;

        return {
          tmdb_id: parseInt(metadata.tmdb_id, 10),
          metadata: {
            media_type: metadata.media_type || mediaType,
            title: metadata.title || '',
            overview: metadata.overview || '',
            spoken_languages: metadata.spoken_languages ? metadata.spoken_languages.map(lang => lang.iso_639_1) : [],
            vote_average: typeof metadata.vote_average === 'number' ? metadata.vote_average : 0,
            release_year: metadata.release_date ? new Date(metadata.release_date).getFullYear().toString() : '',
            genres: metadata.genres ? metadata.genres.map(genre => genre.name) : [],
            director: metadata.credits
              ? metadata.credits
                  .filter(credit => credit.type === 'director' || credit.type === 'creator')
                  .map(director => director.name)
              : [],
            cast: metadata.credits
              ? metadata.credits.filter(credit => credit.type === 'cast').map(cast => cast.name)
              : [],
            keywords: metadata.keywords ? metadata.keywords.map(keyword => keyword.name) : [],
          },
        };
      } catch (error) {
        console.error(`Error fetching details for TMDB ID ${tmdbId}:`, error.message);
        return null;
      }
    });

    const formattedMetadataArray = await Promise.all(mediaDetailsPromises);
    return formattedMetadataArray.filter(Boolean);
  } catch (error) {
    console.error('Error fetching media details:', error.message);
    throw new Error(error.message || 'Internal Server Error');
  }
};

module.exports = getMetadataHelper;
