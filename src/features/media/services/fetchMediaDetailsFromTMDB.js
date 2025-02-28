const api = require('@src/utils/api');

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 second

const fetchWithRetry = async (url, retries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await api.get(url);
      return response; // Return successfully fetched data
    } catch (error) {
      const status = error.response?.status || 'Unknown';
      const message = error.message || 'Unknown error';

      console.error(`Attempt ${attempt} failed for ${url} - Status: ${status} - ${message}`);

      if (status === 404) {
        console.warn(`Resource not found: ${url}`);
        return null; // Don't retry for 404 errors
      }

      if (attempt < retries) {
        await new Promise(res => setTimeout(res, RETRY_DELAY)); // Wait before retrying
      } else {
        console.error(`Failed to fetch ${url} after ${retries} attempts.`);
        return null; // Gracefully return null on persistent failure
      }
    }
  }
};

const fetchMediaDetailsFromTMDB = async (mediaType, id) => {
  const urls = [
    `/${mediaType}/${id}`,
    `/${mediaType}/${id}/videos`,
    `/${mediaType}/${id}/credits`,
    `/${mediaType}/${id}/keywords`,
  ];

  // Fetch all API requests with error handling
  const [mediaDetails, trailerDetails, creditDetails, keywordDetails] = await Promise.all(
    urls.map(url => fetchWithRetry(url))
  );

  return { mediaDetails, trailerDetails, creditDetails, keywordDetails };
};

module.exports = fetchMediaDetailsFromTMDB;
