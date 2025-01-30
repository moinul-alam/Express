const formatCredits = (mediaType, creditDetails, mediaDetails) => {
    const castThreshold = 5.0;
    const topCast = creditDetails.data.cast
      .filter((cast) => cast.popularity >= castThreshold)
      .sort((a, b) => b.popularity - a.popularity)
      .map((cast) => ({
        type: 'cast',
        name: cast.name,
        id: cast.id,
        character: cast.character || null,
        image: cast.profile_path
          ? `https://image.tmdb.org/t/p/w500${cast.profile_path}`
          : null,
      }));
  
    let topCrew = [];
    if (mediaType === 'movie') {
      topCrew = creditDetails.data.crew
        .filter((member) => member.job === 'Director')
        .map((crewMember) => ({
          type: 'director',
          name: crewMember.name,
          id: crewMember.id,
          character: null,
          image: crewMember.profile_path
            ? `https://image.tmdb.org/t/p/w500${crewMember.profile_path}`
            : null,
        }));
    }
  
    if (mediaType === 'tv') {
      topCrew = mediaDetails.data.created_by.map((creator) => ({
        type: 'creator',
        name: creator.name,
        id: creator.id,
        character: null,
        image: creator.profile_path
          ? `https://image.tmdb.org/t/p/w500${creator.profile_path}`
          : null,
      }));
    }
  
    return [...topCrew, ...topCast];
  };
  
  const formatMediaData = (mediaType, mediaDetails, trailerKey, credits, keywords) => {
    return {
      tmdb_id: parseInt(mediaDetails.data.id, 10),
      media_type: mediaType,
      title: mediaDetails.data.title || mediaDetails.data.name,
      original_title: mediaDetails.data.original_title || mediaDetails.data.original_name,
      overview: mediaDetails.data.overview,
      genres: mediaDetails.data.genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
      })),
      release_date: mediaDetails.data.release_date || mediaDetails.data.first_air_date,
      vote_average: mediaDetails.data.vote_average,
      vote_count: mediaDetails.data.vote_count,
      poster_path: mediaDetails.data.poster_path
        ? `https://image.tmdb.org/t/p/w500${mediaDetails.data.poster_path}`
        : null,
      backdrop_path: mediaDetails.data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${mediaDetails.data.backdrop_path}`
        : null,
      imdb_id: mediaDetails.data.imdb_id,
      spoken_languages: mediaDetails.data.spoken_languages,
      status: mediaDetails.data.status,
      tagline: mediaDetails.data.tagline,
      homepage: mediaDetails.data.homepage,
      revenue: mediaDetails.data.revenue,
      budget: mediaDetails.data.budget,
      adult: mediaDetails.data.adult,
      credits,
      trailer_id: trailerKey,
      keywords:keywords,
      seasons: mediaType === 'tv' ? mediaDetails.data.number_of_seasons : undefined,
      episodes: mediaType === 'tv' ? mediaDetails.data.number_of_episodes : undefined,
      runtime: mediaType === 'movie' ? mediaDetails.data.runtime : undefined,
    };
  };
  
  module.exports = {
    formatCredits,
    formatMediaData,
  };
  