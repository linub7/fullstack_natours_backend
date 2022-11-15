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
      maxlength: [40, 'A tour name must have less or equal 40 characters'],
      minlength: [10, 'A tour name must have more or equal 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Please provide duration'],
      min: [1, 'Duration must be above 1.0'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Please provide Maximum Group Size'],
      min: [1, 'Max Group Size must be above 1'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
      required: [true, 'Please provide difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this ONLY points to current doc on NEW document creation
          return val < this.price;
        },
        message: (props) => `${props.value} should be lower than tour price`,
      },
    },
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
    isSecret: {
      type: Boolean,
      default: false,
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
// TourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// in Query middleware -> this keyword point at the current query (NOT at the current document)
// the use case that we're gonna do here is this:
// let's suppose that we can have secret tours in our DB
// like for tours that are only offered internally or very small like VIP group of people
// and the public should't know about, and since these tours are secret
// we do not want the secret tours to ever appear in the result outputs
// TourSchema.pre('find', function (next) {
// every query that starts with find
TourSchema.pre(/^find/, function (next) {
  this.find({ isSecret: { $ne: true } });
  this.start = Date.now();
  next();
});

TourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
// this is gonna point to the current aggregation object
TourSchema.pre('aggregate', function (next) {
  // we remove isSecret: true tours in aggregation calculations
  this.pipeline().unshift({
    $match: { isSecret: { $ne: true } },
  });
  next();
});

module.exports = mongoose.model('Tour', TourSchema);
