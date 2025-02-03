const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    media_type: { type: String, enum: ["movie", "tv"], required: true },
    tmdb_id: { type: Number, required: true, index: true }, 
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, required: true, min: 0, max: 10 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
