const { isValidObjectId } = require('mongoose');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

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

exports.getAllReviews = factory.getAll(Review);

exports.getSingleReview = factory.getSingleOne(Review);

exports.updateReview = asyncHandler(async (req, res, next) => {
  const {
    params: { id },
    body: { review, rating },
    user,
  } = req;
  const existedReview = await Review.findById(id).populate('user');
  if (!existedReview) return next(new AppError(`Review not found`, 404));
  if (existedReview.user._id.toString() !== user.id.toString())
    return next(new AppError(`You can only update your own reviews`, 401));
  existedReview.review = review && review;
  existedReview.rating = rating && rating;

  await existedReview.save();

  return res.status(200).json({
    status: 'success',
    data: {
      data: existedReview,
    },
  });
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const {
    params: { id },
    user,
  } = req;
  const existedReview = await Review.findById(id).populate('user');
  if (!existedReview) return next(new AppError(`Review not found`, 404));
  if (existedReview.user._id.toString() !== user.id.toString())
    return next(new AppError(`You can only delete your own reviews`, 401));

  await existedReview.remove();

  return res.status(200).json({
    status: 'success',
    message: 'deleted',
  });
});
