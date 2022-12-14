const Tour = require('../models/Tour');
const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.createTour = asyncHandler(async (req, res, next) => {
  const {
    body: {
      name,
      duration,
      maxGroupSize,
      difficulty,
      ratingsAverage,
      ratingsQuantity,
      price,
      priceDiscount,
      summary,
      description,
      imageCover,
      isSecret,
      images,
      startDates,
      guides,
    },
  } = req;

  if (!guides || guides.length < 1)
    return next(new AppError(`Please add guides`, 400));

  const existingTour = await Tour.findOne({ name });
  if (existingTour) {
    return next(new AppError('Tour Already Exist', 400));
  }

  const newTour = await Tour.create({
    name,
    duration,
    maxGroupSize,
    difficulty,
    ratingsAverage,
    ratingsQuantity,
    price,
    priceDiscount,
    summary,
    description,
    imageCover,
    isSecret,
    images,
    startDates,
    guides,
  });

  return res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.getAllTours = factory.getAll(Tour);

exports.getSingleTour = factory.getSingleOne(Tour, { path: 'reviews' });

exports.getToursWithin = asyncHandler(async (req, res, next) => {
  const {
    params: { distance, latlng, unit },
  } = req;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    return next(
      new AppError(
        `Please provide latitude and longitude in the format like this lat,lng`,
        400
      )
    );
  if (unit !== 'km' && unit !== 'mi')
    return next(new AppError(`Please provide correct unit -> km or mi`, 400));

  // radius is basically the distance that we want to have as the radius but converted
  // to a special unit called radians, in order to get radians, we need to divide our distance
  // by the radius of the earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // $geoWithin: finds the documents within a certain geometry
  // $centerSphere: takes an array of the coordinates and of the radius -> lng is the first element
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  return res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = asyncHandler(async (req, res, next) => {
  const {
    params: { latlng, unit },
  } = req;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    return next(
      new AppError(
        `Please provide latitude and longitude in the format like this lat,lng`,
        400
      )
    );
  if (unit !== 'km' && unit !== 'mi')
    return next(new AppError(`Please provide correct unit -> km or mi`, 400));

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // for geoSpatial aggregation, there's actually one single stage that's called geoNear
  // $geoNear is required at least one of our fields contains a geoSpatial index -> we already
  // did that before(../models/Tour.js -> line 121)
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // * 1 -> converted to number
        },
        // distanceField: this is the name of the field that will be created and where all the
        // calculated distances will be stored
        distanceField: 'distance',
        // results in meter -> multiply to .001 to get Km
        distanceMultiplier: multiplier,
      },
    },
    {
      // select only distance and name of the tour
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  return res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = asyncHandler(async (req, res, next) => {
  // const stats = await Tour.aggregate([
  //   {
  //     $match: {
  //       ratingsAverage: { $gte: 4.5 },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       // get number of tours -> add 1 (trickier)
  //       numTours: { $sum: 1 },
  //       numRatings: { $sum: '$ratingsQuantity' },
  //       avgRating: { $avg: '$ratingsAverage' },
  //       avgPrice: { $avg: '$price' },
  //       minPrice: { $min: '$price' },
  //       maxPrice: { $max: '$price' },
  //     },
  //   },
  // ]);

  // const stats = await Tour.aggregate([
  //   {
  //     $match: {
  //       ratingsAverage: { $gte: 4.5 },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: '$ratingsAverage',
  //       // get number of tours -> add 1 (trickier)
  //       numTours: { $sum: 1 },
  //       numRatings: { $sum: '$ratingsQuantity' },
  //       avgRating: { $avg: '$ratingsAverage' },
  //       avgPrice: { $avg: '$price' },
  //       minPrice: { $min: '$price' },
  //       maxPrice: { $max: '$price' },
  //     },
  //   },
  // ]);

  const stats = await Tour.aggregate([
    {
      // $match: select document
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // get number of tours -> add 1 (trickier)
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // repeat aggregation is possible -> but with new inputs that created in the prior stage
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  return res.json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = asyncHandler(async (req, res, next) => {
  const {
    params: { year },
  } = req;

  const convertedDate = parseInt(year, 10);

  const plan = await Tour.aggregate([
    {
      // $unwind: convert startDates array into objects -> every array elements -> 1 object
      $unwind: '$startDates',
    },
    {
      // select tours that starts 1st Jan ${convertedDate} and finished 31 Dec ${convertedDate}
      $match: {
        startDates: {
          $gte: new Date(`${convertedDate}-01-01`),
          $lte: new Date(`${convertedDate}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          // extract month from startDates
          $month: '$startDates',
        },
        // add 1 per the tour starts on Special month
        numTourStarts: { $sum: 1 },
        // which tours starts on Special month -> per every tours push thats name! (name come from name field from Tour Model)
        tours: { $push: '$name' },
      },
    },
    {
      // add month field per every _id -> _id represent month
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        // _id field will not show! -> with _id: 1 -> _id field will show
        _id: 0,
      },
    },
    {
      $sort: {
        // sort descending numTourStarts
        numTourStarts: -1,
      },
    },
    {
      // show only 12 month
      $limit: 12,
    },
  ]);

  return res.json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.aliasTopTours = asyncHandler(async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
});
