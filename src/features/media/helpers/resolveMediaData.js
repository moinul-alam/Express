// const Media = require('@src/models/media');

// const resolveMediaData = async (objectIds) => {
//   if (!Array.isArray(objectIds) || objectIds.length === 0) {
//     return [];
//   }

//   try {
//     const mediaData = await Media.find({ '_id': { $in: objectIds } })
//       .select('tmdb_id media_type title vote_average release_date poster_path');
//     return mediaData;
//   } catch (error) {
//     console.error('Error resolving media data:', error.message);

//     throw new Error('Failed to resolve media data');
//   }
// };

// module.exports = resolveMediaData;


const Media = require('@src/models/media');
const mongoose = require('mongoose');

/**
 * Resolves an array of media ObjectIds into their full data
 * @param {Array} objectIds - Array of ObjectIds or media objects
 * @returns {Promise<Array>} Array of resolved media data
 */
const resolveMediaData = async (objectIds) => {
  if (!Array.isArray(objectIds) || objectIds.length === 0) {
    console.log('No media IDs to resolve or invalid input');
    return [];
  }

  try {
    // Extract just the ObjectId strings if we're dealing with objects that might have ObjectIds
    const ids = objectIds.map(item => {
      // Handle different potential formats
      if (mongoose.Types.ObjectId.isValid(item)) {
        // Item is already an ObjectId or string ID
        return item;
      } else if (item && item._id) {
        // Item is an object with _id property
        return item._id;
      } else if (item && typeof item === 'object' && item.id) {
        // Item might have an 'id' property instead
        return item.id;
      }
      // Return null for invalid items
      console.log('Invalid item in objectIds:', item);
      return null;
    }).filter(id => id !== null); // Remove any null values

    if (ids.length === 0) {
      console.log('No valid IDs found after processing');
      return [];
    }

    console.log(`Attempting to resolve ${ids.length} media items`);
    
    const mediaData = await Media.find({ '_id': { $in: ids } })
      .select('tmdb_id media_type title name vote_average release_date first_air_date poster_path');
    
    console.log(`Successfully resolved ${mediaData.length} out of ${ids.length} media items`);
    
    return mediaData;
  } catch (error) {
    console.error('Error resolving media data:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to resolve media data');
  }
};

module.exports = resolveMediaData;