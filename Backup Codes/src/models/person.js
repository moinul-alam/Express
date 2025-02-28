const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personSchema = new Schema({
  tmdb_id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  known_for: {
    type: String,
    default: '',
  },
  profile_path: {
    type: String,
    default: '',
  },
  biography: {
    type: String,
    default: '',
  },
  dateOfBirth: {
    type: Date,
  },
  imdb_id: {
    type: String,
    default: '',
  },
  popularity: {
    type: Number,
    default: 0,
  },
  movie_credits: {
    acting: [
      {
        type: Schema.Types.ObjectId,
        ref: 'media',
      },
    ],
    directing: [
      {
        type: Schema.Types.ObjectId,
        ref: 'media',
      },
    ], 
  },
  tv_credits: {
    acting: [
      {
        type: Schema.Types.ObjectId,
        ref: 'media',
      },
    ], 
    directing: [
      {
        type: Schema.Types.ObjectId,
        ref: 'media',
      },
    ],
  },
}, { timestamps: true }); 

module.exports = mongoose.model('Person', personSchema);
