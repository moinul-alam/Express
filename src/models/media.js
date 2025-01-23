const mongoose = require('mongoose');

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
      default: null,
    },
    overview: {
      type: String,
      trim: true,
      default: null,
    },
    genres: [
      {
        id: { type: Number, default: null },
        name: { type: String, default: null },
      },
    ],
    release_date: {
      type: Date,
      default: null,
    },
    runtime: {
      type: Number,
      min: [0, 'Runtime must be a positive number'],
      default: null,
    },
    vote_average: {
      type: Number,
      min: [0, 'Vote average must be between 0 and 10'],
      max: [10, 'Vote average must be between 0 and 10'],
      default: null,
    },
    vote_count: {
      type: Number,
      min: [0, 'Vote count must be a positive number'],
      default: null,
    },
    poster_path: {
      type: String,
      default: null,
    },
    backdrop_path: {
      type: String,
      default: null,
    },
    imdb_id: {
      type: String,
      trim: true,
      default: null,
    },
    spoken_languages: [
      {
        iso_639_1: { type: String, default: null },
        name: { type: String, default: null },
      },
    ],
    release_status: {
      type: String,
      default: null,
    },
    tagline: {
      type: String,
      trim: true,
      default: null,
    },
    homepage: {
      type: String,
      default: null,
    },
    revenue: {
      type: Number,
      min: [0, 'Revenue must be a positive number'],
      default: null,
    },
    budget: {
      type: Number,
      min: [0, 'Budget must be a positive number'],
      default: null,
    },
    adult: {
      type: Boolean,
      default: null,
    },
    credits: [
      {
        type: {
          type: String,
          default: null,
        },
        name: { 
          type: String, 
          default: null,
        },
        id: { 
          type: Number, 
          default: null,
        },
        character: { 
          type: String, 
          trim: true, 
          default: null,
        },
        image: {
          type: String,
          default: null,
        },
      },
    ],
    trailer_id: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);


const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
