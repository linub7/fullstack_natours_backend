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
  }

  // 4)  Fields
  if (query.fields) {
    const selectedBy = query.fields.split(',').join(' ');
    queries = queries.select(selectedBy);
  } else {
    queries = queries.select('-__v');
  }

  // 5) Pagination
  // 1-10 : page1
  // 11-20 : page2
  // 21-30 : page3
  // ...
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Tour.countDocuments();

  queries = queries.skip(startIndex).limit(limit);

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // Execute Query
  const tours = await queries;
  return res.json({
    status: 'success',
    pagination,
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

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
