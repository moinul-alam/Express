const Media = require('@src/models/media');
const saveDataToDB = require('@src/features/media/services/saveDataToDB');

const findAndCreateMedia = async (credits, mediaType) => {
  return Promise.all(
    credits.map(async (credit) => {
      let media = await Media.findOne({ tmdb_id: credit.id });
      if (!media) {
        const mediaData = {
          data_status: 'Partial',
          media_type: mediaType,
          tmdb_id: credit.id,
          title: credit.title || credit.name,
          vote_average: credit.vote_average || 0,
          release_date: credit.release_date || credit.first_air_date || null,
          poster_path: credit.poster_path || '',
        };
        media = await saveDataToDB(Media, mediaData);
      }
      return media._id;
    })
  );
};

module.exports = findAndCreateMedia;
