const mongoose = require('mongoose');

const CategoricalMediaSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true, // e.g., 'trending', 'upcoming', 'top-rated'
    enum: ['trending', 'upcoming', 'top-rated', 'popular'], // Add more as needed
  },
  media_type: {
    type: String,
    required: true,
    enum: ['movie', 'tv'], // Restrict to valid media types
  },
  media_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media', // Reference to your existing Media model
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CategoricalMedia', CategoricalMediaSchema);
