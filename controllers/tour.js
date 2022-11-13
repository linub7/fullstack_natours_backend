const Tour = require('../models/Tour');

exports.getAllTours = async (req, res) => {
  const { query } = req;
  // 1) Filtering
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const queryObj = { ...query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete queryObj[el]);

  // 2) Advance Filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

  let queries = Tour.find(JSON.parse(queryStr));

  // 3) Sorting
  if (query.sort) {
    const sortBy = query.sort.split(',').join(' ');
    queries = queries.sort(sortBy);
  } else {
    queries.sort('-createdAt');
  }

  const tours = await queries;
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
