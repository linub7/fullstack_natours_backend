const Tour = require('../models/Tour');
const ApiFeature = require('../utils/ApiFeature');
const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');

exports.getAllTours = asyncHandler(async (req, res, next) => {
  const { query } = req;

  // Execute Query
  const features = new ApiFeature(Tour.find(), query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;
  return res.json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

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
    },
  } = req;

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
  });

  return res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.getSingleTour = asyncHandler(async (req, res, next) => {
  const {
    params: { tourId },
  } = req;

  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError(`Tour with ${tourId} was not found in db`, 404));
  }
  return res.json({
    status: 'success',
    data: { tour },
  });
});

exports.updateTour = asyncHandler(async (req, res, next) => {
  const {
    params: { tourId },
    body,
  } = req;
  const updatedTour = await Tour.findByIdAndUpdate(tourId, body, {
    new: true,
    runValidators: true,
  });

  return res.json({
    status: 'success',
    data: {
      updatedTour,
    },
  });
});

exports.deleteTour = asyncHandler(async (req, res, next) => {
  const {
    params: { tourId },
  } = req;

  const tour = await Tour.findByIdAndDelete(tourId);

  if (!tour) {
    return next(new AppError(`Tour with ${tourId} was not found in db`, 404));
  }

  return res.json({
    status: 'success',
    message: 'deleted',
  });
});

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
