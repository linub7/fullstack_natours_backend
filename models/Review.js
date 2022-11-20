const mongoose = require('mongoose');
const Tour = require('./Tour');

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
      required: [true, 'Please add a rating'],
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

ReviewSchema.pre(/^find/, function (next) {
  // in order to prevent populate chaining when we query single tour, we only populate user
  // if we populate tour -> when we query single tour we populate reviews and then repopulate tour again!
  // this.populate({ path: 'tour', select: 'name' }).populate({
  //   path: 'user',
  //   select: 'name',
  // });

  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});

// static method
// create the statistics the average and number of ratings for specific tour
ReviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this -> point to the current model
  const stats = await this.aggregate([
    {
      // select the tour that tour:tourId
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        // ratings count
        nRatings: { $sum: 1 },
        // '$rating' -> point to line 12 -> rating filed in review model
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(
    tourId,
    {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings,
    },
    { new: true }
  );
};

ReviewSchema.post('save', function () {
  // post -> does not get access to next
  // this points to current review
  // in order to reach Review model we need to use this.constructor.
  this.constructor.calcAverageRatings(this.tour);
});

module.exports = mongoose.model('Review', ReviewSchema);
