const Tour = require('../models/Tour');
const ApiFeature = require('../utils/ApiFeature');

exports.getAllTours = async (req, res) => {
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
};

exports.createTour = async (req, res) => {
  const {
    body: {
      name,
      duration,
      maxGroupSize,
      difficulty,
      ratingsAverage,
      ratingsQuantity,
      price,
      summary,
      description,
      imageCover,
      startDates,
    },
  } = req;

  const existingTour = await Tour.findOne({ name });
  if (existingTour) {
    return res.status(400).json({
      status: 'fail',
      message: 'Tour Already Exist',
    });
  }

  const newTour = await Tour.create({
    name,
    duration,
    maxGroupSize,
    difficulty,
    ratingsAverage,
    ratingsQuantity,
    price,
    summary,
    description,
    imageCover,
    startDates,
  });

  return res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
};

exports.getSingleTour = async (req, res) => {
  const {
    params: { tourId },
  } = req;

  const tour = await Tour.findById(tourId);
  return res.json({
    status: 'success',
    data: { tour },
  });
};

exports.updateTour = async (req, res) => {
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
};

exports.deleteTour = async (req, res) => {
  const {
    params: { tourId },
  } = req;

  await Tour.findByIdAndDelete(tourId);

  return res.json({
    status: 'success',
    message: 'deleted',
  });
};

exports.getTourStats = async (req, res) => {
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
};

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
