const express = require('express');
const { isValidObjectId } = require('mongoose');
const reviewRoutes = require('./review');

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
const { protect, authorize } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('tourId', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid tourId', 400));
  }
  next();
});

// nested routes  with reviews
router.use('/tours/:tourId', reviewRoutes);

router.route('/tours/tour-stats').get(getTourStats);
router.route('/tours/monthly-plan/:year').get(getMonthlyPlan);

router.route('/tours/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tours').get(protect, getAllTours).post(createTour);

router
  .route('/tours/:tourId')
  .get(getSingleTour)
  .patch(updateTour)
  .delete(protect, authorize('admin', 'lead-guide'), deleteTour);

module.exports = router;
