const mongoose = require('mongoose');

const { Schema } = mongoose;

const TourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      unique: true,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tour', TourSchema);
