const mongoose = require('mongoose');

const { Schema } = mongoose;

const TourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Please provide duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Please provide Maximum Group Size'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'difficult'],
      required: [true, 'Please provide difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [true, 'Please provide summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Please provide imageCover'],
    },
    images: [String],
    startDates: [Date],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tour', TourSchema);
