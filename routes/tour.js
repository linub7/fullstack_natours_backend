const express = require('express');
const { isValidObjectId } = require('mongoose');
const {
  getAllTours,
  createTour,
  getSingleTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tour');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('tourId', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid tourId', 400));
  }
  next();
});

router.route('/tours/tour-stats').get(getTourStats);
router.route('/tours/monthly-plan/:year').get(getMonthlyPlan);

router.route('/tours/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tours').get(protect, getAllTours).post(createTour);

router
  .route('/tours/:tourId')
  .get(getSingleTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
