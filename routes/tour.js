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
  getToursWithin,
  getDistances,
} = require('../controllers/tour');
const { protect, authorize } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router
  .route('/tours/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/tours/tours-distances/:latlng/unit/:unit').get(getDistances);

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

// nested routes  with reviews
router.use('/tours/:id', reviewRoutes);

router.route('/tours/tour-stats').get(getTourStats);
router
  .route('/tours/monthly-plan/:year')
  .get(protect, authorize('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router.route('/tours/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/tours')
  .get(getAllTours)
  .post(protect, authorize('admin', 'lead-guide'), createTour);

router
  .route('/tours/:id')
  .get(getSingleTour)
  .patch(protect, authorize('admin', 'lead-guide'), updateTour)
  .delete(protect, authorize('admin', 'lead-guide'), deleteTour);

module.exports = router;
