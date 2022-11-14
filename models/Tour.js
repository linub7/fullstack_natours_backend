const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema } = mongoose;

const TourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      unique: true,
      trim: true,
    },
    slug: String,
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
  // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// arrow Fn does not get this keyword
// keep in mind: we can not use virtuals in a query -> because virtuals is not part of the DB
TourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE
// runs ONLY before .save() and .create() -> will NOT run on .insertMany()
// we also can use multiple TourSchema.pre('save', function() {...})
// be careful to use next() when use chaining middleware
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// in the case of post middleware has access not only to next,
// but also to the document that was just saved to the DB
// doc: just saved document
// eslint-disable-next-line prefer-arrow-callback
// TourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

module.exports = mongoose.model('Tour', TourSchema);
