const saveDataToDB = require('@src/features/media/services/saveDataToDB');
const fetchPersonDetailsFromTMDB = require('@src/features/media/services/fetchPersonDetailsFromTMDB');
const { filterTopActingCredits, filterDirectingCredits } = require('@src/features/media/helpers/personDetailsHelper');
const findAndCreateMedia = require('@src/features/media/services/findAndCreateMedia');
const Person = require('@src/models/person');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const resolveMediaData = require('@src/features/media/helpers/resolveMediaData');

const SAVE_TO_DB = true;

const fetchPersonDetails = async (req, res, next) => {
  const { person_id } = req.params;

  try {
    let person = await Person.findOne({ tmdb_id: person_id });

    const isOutdated = person && new Date() - new Date(person.updatedAt) > 7 * 24 * 60 * 60 * 1000;

    if (person && !isOutdated) {
      // Resolve media references (ObjectId) for movie_credits and tv_credits before returning
      const resolvedActingMovies = await resolveMediaData(person.movie_credits.acting);
      const resolvedDirectingMovies = await resolveMediaData(person.movie_credits.directing);
      const resolvedActingTV = await resolveMediaData(person.tv_credits.acting);
      const resolvedDirectingTV = await resolveMediaData(person.tv_credits.directing);

      // Update person object with resolved data
      person.movie_credits.acting = resolvedActingMovies;
      person.movie_credits.directing = resolvedDirectingMovies;
      person.tv_credits.acting = resolvedActingTV;
      person.tv_credits.directing = resolvedDirectingTV;

      // Create a resolved person object for the response
    const resolvedPerson = {
      ...person.toObject(), // Convert Mongoose document to plain object
      movie_credits: {
        acting: resolvedActingMovies,
        directing: resolvedDirectingMovies,
      },
      tv_credits: {
        acting: resolvedActingTV,
        directing: resolvedDirectingTV,
      },
    };

    console.log('Person details found in DB. Resolving media data and returning...', resolvedPerson);

    return successResponse(res, 'Person details saved successfully', resolvedPerson);
    }

    const { personDetails, movieCredits, tvCredits } = await fetchPersonDetailsFromTMDB(person_id);

    const actingMovies = filterTopActingCredits(movieCredits.cast);
    const directingMovies = filterDirectingCredits(movieCredits.crew);
    const actingTV = filterTopActingCredits(tvCredits.cast);
    const directingTV = filterDirectingCredits(tvCredits.crew);

    // Find or create media references (getting objectIds)
    const actingMoviesRefs = await findAndCreateMedia(actingMovies, 'movie');
    const directingMoviesRefs = await findAndCreateMedia(directingMovies, 'movie');
    const actingTVRefs = await findAndCreateMedia(actingTV, 'tv');
    const directingTVRefs = await findAndCreateMedia(directingTV, 'tv');

    // Resolve media data for objectIds
    const resolvedActingMovies = await resolveMediaData(actingMoviesRefs);
    const resolvedDirectingMovies = await resolveMediaData(directingMoviesRefs);
    const resolvedActingTV = await resolveMediaData(actingTVRefs);
    const resolvedDirectingTV = await resolveMediaData(directingTVRefs);

    const personData = {
      tmdb_id: personDetails.id,
      name: personDetails.name,
      known_for: personDetails.known_for_department,
      profile_path: personDetails.profile_path || '',
      biography: personDetails.biography || '',
      dateOfBirth: personDetails.birthday || null,
      imdb_id: personDetails.imdb_id || '',
      popularity: personDetails.popularity || 0,
      movie_credits: {
        acting: resolvedActingMovies,
        directing: resolvedDirectingMovies,
      },
      tv_credits: {
        acting: resolvedActingTV,
        directing: resolvedDirectingTV,
      },
    };

    if (SAVE_TO_DB) {
      if (person) {
        await Person.findByIdAndUpdate(person._id, personData, { new: true });
        console.log('Existing person data updated with fresh data.');
      } else {
        person = await saveDataToDB(Person, personData);
        console.log('New person data saved to DB.');
      }
    }

    return successResponse(res, 'Person details saved successfully', person || personDetails);
  } catch (error) {
    console.error(`Error fetching person details for ID: ${person_id}`, error.message);
    return errorResponse(res, 'Error fetching person details', 500, error.message);
  }
};

module.exports = fetchPersonDetails;
