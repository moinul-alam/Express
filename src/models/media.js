const mongoose = require('mongoose');

const GenreSchema = new mongoose.Schema({
  id: Number,
  name: String
}, { _id: false });

const ProductionCompanySchema = new mongoose.Schema({
  id: Number,
  logo_path: String,
  name: String,
  origin_country: String
}, { _id: false });

const ProductionCountrySchema = new mongoose.Schema({
  iso_3166_1: String,
  name: String
}, { _id: false });

const SpokenLanguageSchema = new mongoose.Schema({
  english_name: String,
  iso_639_1: String,
  name: String
}, { _id: false });

const BelongsToCollectionSchema = new mongoose.Schema({
  id: Number,
  name: String,
  poster_path: String,
  backdrop_path: String
}, { _id: false });

const CreatedBySchema = new mongoose.Schema({
  id: Number,
  credit_id: String,
  name: String,
  original_name: String,
  gender: Number,
  profile_path: String
}, { _id: false });

const NetworkSchema = new mongoose.Schema({
  id: Number,
  logo_path: String,
  name: String,
  origin_country: String
}, { _id: false });

const SeasonSchema = new mongoose.Schema({
  air_date: String,
  episode_count: Number,
  id: Number,
  name: String,
  overview: String,
  poster_path: String,
  season_number: Number,
  vote_average: Number
}, { _id: false });

const LastEpisodeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  overview: String,
  vote_average: Number,
  vote_count: Number,
  air_date: String,
  episode_number: Number,
  episode_type: String,
  production_code: String,
  runtime: Number,
  season_number: Number,
  show_id: Number,
  still_path: String
}, { _id: false });

const KeywordSchema = new mongoose.Schema({
  id: Number,
  name: String
}, { _id: false });

const CreditSchema = new mongoose.Schema({
  id: Number,
  credit_id: String,
  name: String,
  gender: Number,
  profile_path: String,
  department: String,
  job: String,
  character: String,
  image: String, // Added for backward compatibility
  type: String   // Added for backward compatibility
}, { _id: false });

// For backward compatibility with the old schema's credit format
const LegacyCreditSchema = new mongoose.Schema({
  type: String,
  name: String,
  id: Number,
  character: String,
  image: String
}, { _id: false });

const TrailerSchema = new mongoose.Schema({
  id: String,
  name: String,
  key: String,
  site: String,
  type: String,
  official: Boolean,
  published_at: String
}, { _id: false });

const MediaSchema = new mongoose.Schema({
  // Required fields with compatibility
  tmdb_id: { type: Number, required: true, unique: true },
  media_type: { type: String, enum: ['movie', 'tv'], required: true },
  
  // Added for backward compatibility with data_status field
  data_status: {
    type: String,
    enum: ['Complete', 'Partial'],
    default: 'Complete'
  },
  
  // Common fields
  adult: Boolean,
  backdrop_path: String,
  genres: [GenreSchema],
  homepage: String,
  original_language: String,
  overview: { type: String, default: null },
  popularity: Number,
  poster_path: { type: String, default: null },
  production_companies: [ProductionCompanySchema],
  production_countries: [ProductionCountrySchema],
  spoken_languages: [SpokenLanguageSchema],
  status: String,
  tagline: { type: String, default: null },
  vote_average: { 
    type: Number,
    min: [0, 'Vote average must be between 0 and 10'],
    max: [10, 'Vote average must be between 0 and 10'],
    default: null
  },
  vote_count: { 
    type: Number,
    min: [0, 'Vote count must be a positive number'],
    default: null
  },
  video: Boolean,
  origin_country: [String],

  // Movie-specific fields
  title: { type: String, required: true, trim: true },
  original_title: { type: String, trim: true, default: null },
  imdb_id: { type: String, trim: true, default: null },
  budget: { 
    type: Number,
    min: [0, 'Budget must be a positive number'],
    default: null
  },
  revenue: { 
    type: Number,
    min: [0, 'Revenue must be a positive number'],
    default: null
  },
  runtime: { 
    type: Number,
    min: [0, 'Runtime must be a positive number'],
    default: null
  },
  release_date: { type: String, default: null },
  belongs_to_collection: BelongsToCollectionSchema,
  
  // For backward compatibility - renamed field
  release_status: {
    type: String,
    default: null,
    get: function() {
      return this.status || null;
    },
    set: function(value) {
      this.status = value;
      return value;
    }
  },

  // TV-specific fields
  name: String,
  original_name: String,
  first_air_date: String,
  last_air_date: String,
  number_of_episodes: Number,
  number_of_seasons: Number,
  in_production: Boolean,
  created_by: [CreatedBySchema],
  networks: [NetworkSchema],
  seasons: [SeasonSchema],
  last_episode_to_air: LastEpisodeSchema,
  episode_run_time: [Number],
  type: String,
  languages: [String],

  // Ensure compatibility with the old schema's structure
  keywords: [KeywordSchema],
  
  // New structured credits format
  credits: {
    type: mongoose.Schema.Types.Mixed,
    get: function() {
      // If it's the new format (with cast and crew), return as is
      if (this._credits && (this._credits.cast || this._credits.crew)) {
        return this._credits;
      }
      
      // Otherwise, if it's an array (old format), return as is
      if (Array.isArray(this._credits)) {
        return this._credits;
      }
      
      return [];
    },
    set: function(value) {
      // If setting an array (old format), store directly
      if (Array.isArray(value)) {
        this._credits = value;
        return value;
      }
      
      // If setting object with cast/crew (new format), store it
      if (value && (value.cast || value.crew)) {
        this._credits = value;
        return value;
      }
      
      // Default empty array for compatibility
      this._credits = [];
      return [];
    }
  },
  
  // For backward compatibility with old trailer_id field
  trailer_id: {
    type: String,
    trim: true, 
    default: null,
    get: function() {
      if (this.trailers && this.trailers.length > 0) {
        return this.trailers[0].key || null;
      }
      return null;
    },
    set: function(value) {
      if (value && !this.trailers) {
        this.trailers = [{
          key: value,
          site: 'YouTube'
        }];
      }
      return value;
    }
  },
  
  trailers: [TrailerSchema],
  
  // Keep the reviews reference from the old schema
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'review',
    },
  ],
}, 
{ 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Add virtual getters/setters for date fields to handle string/Date conversions
MediaSchema.virtual('release_date_compat')
  .get(function() {
    if (this.release_date) {
      return new Date(this.release_date);
    }
    return null;
  })
  .set(function(value) {
    if (value instanceof Date) {
      this.release_date = value.toISOString().split('T')[0];
    } else {
      this.release_date = value;
    }
  });

// Middleware to ensure backward compatibility during save operations
MediaSchema.pre('save', function(next) {
  // Handle credits conversion between old and new formats if needed
  if (Array.isArray(this._credits) && this._credits.length > 0) {
    // Old format: array of mixed credits
    const cast = [];
    const crew = [];
    
    this._credits.forEach(credit => {
      if (credit.type === 'cast') {
        cast.push({
          id: credit.id,
          name: credit.name,
          character: credit.character,
          profile_path: credit.image,
          type: 'cast'
        });
      } else {
        crew.push({
          id: credit.id,
          name: credit.name,
          job: credit.type, // Use the type as job
          department: '',
          profile_path: credit.image,
          type: credit.type
        });
      }
    });
    
    // Convert to new format
    this._credits = { cast, crew };
  }
  
  next();
});

const Media = mongoose.model('Media', MediaSchema);

module.exports = Media;