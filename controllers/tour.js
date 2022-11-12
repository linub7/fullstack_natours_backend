const Tour = require('../models/Tour');

exports.getAllTours = async (req, res) => {
  const tours = await Tour.find({});
  return res.json({
    status: 'success',
    data: {
      tours,
    },
  });
};

exports.createTour = async (req, res) => {
  const {
    body: { name, price, rating },
  } = req;

  const existingTour = await Tour.findOne({ name });
  if (existingTour) {
    return res.status(400).json({
      status: 'fail',
      message: 'Tour Already Exist',
    });
  }

  const newTour = await Tour.create({ name, price, rating });

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
