const mongoose = require('mongoose');

// Helper function for URL validation
const mediaSchema = new mongoose.Schema(
  {
    data_status: {
      type: String,
      required: true,
      enum: ['Complete', 'Partial'],
    },
    tmdb_id: {
      type: Number,
      required: [true, 'TMDB ID is required'],
      unique: true,
    },
    media_type: {
      type: String,
      required: [true, 'Media type is required'],
      enum: {
        values: ['movie', 'tv'],
        message: 'Media type must be either movie or tv',
      },
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    original_title: {
      type: String,
      trim: true,
      default: null,  // Allow null if not provided
    },
    overview: {
      type: String,
      trim: true,
      default: null,  // Allow null if not provided
    },
    genres: [
      {
        id: { type: Number, default: null },
        name: { type: String, default: null },
      },
    ],
    release_date: {
      type: Date,
      default: null,  // Allow null if not provided
    },
    runtime: {
      type: Number,
      min: [0, 'Runtime must be a positive number'],
      default: null,  // Allow null if not provided
    },
    vote_average: {
      type: Number,
      min: [0, 'Vote average must be between 0 and 10'],
      max: [10, 'Vote average must be between 0 and 10'],
      default: null,  // Allow null if not provided
    },
    vote_count: {
      type: Number,
      min: [0, 'Vote count must be a positive number'],
      default: null,  // Allow null if not provided
    },
    poster_path: {
      type: String,
      default: null,  // Allow null if not provided
    },
    backdrop_path: {
      type: String,
      default: null,  // Allow null if not provided
    },
    imdb_id: {
      type: String,
      trim: true,
      default: null,  // Allow null if not provided
    },
    spoken_languages: [
      {
        iso_639_1: { type: String, default: null },
        name: { type: String, default: null },
      },
    ],
    release_status: {
      type: String,
      default: null,  // Allow null if not provided
    },
    tagline: {
      type: String,
      trim: true,
      default: null,  // Allow null if not provided
    },
    homepage: {
      type: String,
      default: null,  // Allow null if not provided
    },
    revenue: {
      type: Number,
      min: [0, 'Revenue must be a positive number'],
      default: null,  // Allow null if not provided
    },
    budget: {
      type: Number,
      min: [0, 'Budget must be a positive number'],
      default: null,  // Allow null if not provided
    },
    adult: {
      type: Boolean,
      default: null,  // Allow null if not provided
    },
    credits: [
      {
        type: {
          type: String,
          default: null,  // Allow null if not provided
        },
        name: { 
          type: String, 
          default: null,  // Allow null if not provided
        },
        id: { 
          type: Number, 
          default: null,  // Allow null if not provided
        },
        character: { 
          type: String, 
          trim: true, 
          default: null,  // Allow null if not provided
        },
        image: {
          type: String,
          default: null,  // Allow null if not provided
        },
      },
    ],
    trailer_id: {
      type: String,
      trim: true,
      default: null,  // Allow null if not provided
    },
  },
  { timestamps: true }
);

// Indexing for quick retrieval
mediaSchema.index({ media_type: 1, release_date: -1 });
mediaSchema.index({ tmdb_id: 1 });

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
