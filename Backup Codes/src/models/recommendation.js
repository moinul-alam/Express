const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaIDs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    }],
    recommendationType: {
      type: String,
      enum: ['content-based', 'collaborative', 'hybrid'],
      required: true,
    },
    feedback: {
      type: String,
      enum: ['pending', 'liked', 'disliked', 'neutral', 'rejected'],
      default: 'pending',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
