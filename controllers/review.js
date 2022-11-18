const { isValidObjectId } = require('mongoose');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');

exports.getAllReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({});
  const reviewsCount = await Review.countDocuments();
  return res.status(200).json({
    status: 'success',
    results: reviewsCount,
    data: {
      reviews,
    },
  });
});

exports.createReview = asyncHandler(async (req, res, next) => {
  const {
    body: { tour, review, rating },
    user: { id },
  } = req;

  if (!isValidObjectId(tour))
    return next(new AppError(`Please enter a valid tour`, 400));

  const existedReview = await Review.findOne({ tour, user: id });
  if (existedReview)
    return next(new AppError(`You already write a review for this tour`, 400));

  const newReview = await Review.create({ review, rating, tour, user: id });

  return res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
