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
      console.log('Person found in DB:', person._id);
      
      // Debug the structure of movie_credits and tv_credits
      console.log('Movie credits structure:', JSON.stringify(person.movie_credits));
      console.log('TV credits structure:', JSON.stringify(person.tv_credits));
      
      // Make sure we're passing arrays of ObjectIds
      const actingMovieIds = Array.isArray(person.movie_credits.acting) ? person.movie_credits.acting : [];
      const directingMovieIds = Array.isArray(person.movie_credits.directing) ? person.movie_credits.directing : [];
      const actingTVIds = Array.isArray(person.tv_credits.acting) ? person.tv_credits.acting : [];
      const directingTVIds = Array.isArray(person.tv_credits.directing) ? person.tv_credits.directing : [];
      
      // Debug the IDs we're passing to resolveMediaData
      console.log('Acting movie IDs:', actingMovieIds);
      
      // Resolve media references (ObjectId) for movie_credits and tv_credits before returning
      const resolvedActingMovies = await resolveMediaData(actingMovieIds);
      const resolvedDirectingMovies = await resolveMediaData(directingMovieIds);
      const resolvedActingTV = await resolveMediaData(actingTVIds);
      const resolvedDirectingTV = await resolveMediaData(directingTVIds);
      
      // Debug the resolved data
      console.log('Resolved acting movies count:', resolvedActingMovies.length);

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

      console.log('Person details found in DB. Resolving media data and returning...');

      return successResponse(res, 'Person details retrieved successfully', resolvedPerson);
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
        acting: actingMoviesRefs, // Store the references, not the resolved data
        directing: directingMoviesRefs,
      },
      tv_credits: {
        acting: actingTVRefs,
        directing: directingTVRefs,
      },
    };

    if (SAVE_TO_DB) {
      if (person) {
        person = await Person.findByIdAndUpdate(person._id, personData, { new: true });
        console.log('Existing person data updated with fresh data.');
      } else {
        person = await saveDataToDB(Person, personData);
        console.log('New person data saved to DB.');
      }
    }
    
    // Create final response object with resolved media data
    const responseData = {
      ...personData,
      movie_credits: {
        acting: resolvedActingMovies,
        directing: resolvedDirectingMovies,
      },
      tv_credits: {
        acting: resolvedActingTV,
        directing: resolvedDirectingTV,
      },
    };

    return successResponse(res, 'Person details saved successfully', responseData);
  } catch (error) {
    console.error(`Error fetching person details for ID: ${person_id}`, error.message);
    return errorResponse(res, 'Error fetching person details', 500, error.message);
  }
};

module.exports = fetchPersonDetails;