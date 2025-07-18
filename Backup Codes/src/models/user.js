const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    info: {
      username: { type: String, trim: true, unique: true, required: true },
      firstName: { type: String, trim: true, maxLength: 50 },
      lastName: { type: String, trim: true, maxLength: 50 },
      email: { 
        type: String, 
        trim: true, 
        unique: true, 
        lowercase: true, 
        required: true,
        validate: {
          validator: v => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
          message: props => `${props.value} is not a valid email address`,
        },
      },
      password: { type: String, trim: true, required: true },
      dateOfBirth: { type: Date },
      gender: { type: String, trim: true, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      location: { type: String, trim: true, maxLength: 100 },
      avatar: { type: String, trim: true },
    },
    preferences: {
      language: { type: [String], default: [] },
      genres: { type: [String], default: [] },
      favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
      favoriteSeries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
      favoriteActors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person'}],
      favoriteDirectors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person'}],
      watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "review" }],
    behaviour: {
      searchHistory: [{ query: { type: String, trim: true }, searchedAt: { type: Date, default: Date.now } }],
      clickHistory: [
        {
          mediaType: { type: String, enum: ['movie', 'tv'] },
          mediaID: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
          clickedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  if (this.info?.email) this.info.email = this.info.email.toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);
