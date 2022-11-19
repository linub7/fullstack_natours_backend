const express = require('express');
const { isValidObjectId } = require('mongoose');
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
} = require('../controllers/review');

const { protect, authorize } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router({ mergeParams: true });

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/reviews')
  .get(protect, authorize('admin'), getAllReviews)
  .post(protect, authorize('user'), createReview);

router
  .route('/reviews/:id')
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
