const Media = require('@src/models/media');

const resolveMediaData = async (objectIds) => {
  if (!Array.isArray(objectIds) || objectIds.length === 0) {
    return [];
  }

  try {
    const mediaData = await Media.find({ '_id': { $in: objectIds } })
      .select('tmdb_id media_type title vote_average release_date poster_path');

    return mediaData;
  } catch (error) {
    console.error('Error resolving media data:', error.message);

    throw new Error('Failed to resolve media data');
  }
};

module.exports = resolveMediaData;
