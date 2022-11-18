const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Please add a review'],
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1 or greater than 1'],
      max: [5, 'Rating can be 5 or less than 5'],
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('Review', ReviewSchema);
