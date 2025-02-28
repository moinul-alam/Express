const filterTopActingCredits = (cast) =>
    cast
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  
  const filterDirectingCredits = (crew) =>
    crew.filter((credit) => credit.job === 'Director');
  
  module.exports = {
    filterTopActingCredits,
    filterDirectingCredits,
  };
  