const { isValidObjectId } = require('mongoose');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

exports.getAllReviews = asyncHandler(async (req, res, next) => {
  const {
    params: { tourId },
  } = req;
  let filter = {};
  if (tourId) filter = { tour: tourId };
  const reviews = await Review.find(filter);

  return res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = asyncHandler(async (req, res, next) => {
  const {
    params: { tourId },
    body: { review, rating },
    user: { id },
  } = req;

  if (!isValidObjectId(tourId))
    return next(new AppError(`Please enter a valid tour`, 400));

  const existedReview = await Review.findOne({ tour: tourId, user: id });
  if (existedReview)
    return next(new AppError(`You already write a review for this tour`, 400));

  const newReview = await Review.create({
    review,
    rating,
    tour: tourId,
    user: id,
  });

  return res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

exports.deleteReview = factory.deleteOne(Review);
