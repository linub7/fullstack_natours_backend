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
} = require('../controllers/tour');

const router = express.Router();

router.param('tourId', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide a valid tourId',
    });
  }
  next();
});

router.route('/tours/tour-stats').get(getTourStats);

router.route('/tours/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tours').get(getAllTours).post(createTour);

router
  .route('/tours/:tourId')
  .get(getSingleTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
