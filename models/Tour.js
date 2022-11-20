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
      set: (val) => Math.round(val * 10) / 10, // Math.round(val) -> returns an integer, we multiply 10 and then divided by 10 to returns float -> 4.66 gives us 4.7 NOT 5
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
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // ----> if we use embedding for guides use this: <----
    // guides: Array,
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });

// arrow Fn does not get this keyword
// keep in mind: we can not use virtuals in a query -> because virtuals is not part of the DB
TourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populate: to prevent grow reviews of every tour -> we use virtual population
// We have Review model that uses parent referencing with tour model
// in order to see reviews of every tour we can use virtual populating ->
TourSchema.virtual('reviews', {
  // name of the model we wanna reference
  ref: 'Review',
  // foreignField: the name of the field in the other model
  // -> Review model in this case so the foreignField is tour field -> Review: {review: String, ..., tour: {ref: 'Tour'}}
  foreignField: 'tour',
  // localField: in the Review model we implement _id of tour -> localField is _id
  localField: '_id',
});

// DOCUMENT MIDDLEWARE
// runs ONLY before .save() and .create() -> will NOT run on .insertMany()
// we also can use multiple TourSchema.pre('save', function() {...})
// be careful to use next() when use chaining middleware
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// ----> if we use embedding for guides use this: <----
// TourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (guide) => await User.findById(guide)
//   );
//   // the result of this.guides.map(...) is a promise, so we have to use Promise.all
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

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

TourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: 'name email role' });
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
