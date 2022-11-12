const express = require('express');
const {
  getAllTours,
  createTour,
  getSingleTour,
  updateTour,
  deleteTour,
} = require('../controllers/tour');

const router = express.Router();

router.param('tourId', (req, res, next, val) => {
  console.log(`Tour Id id: ${val}`);
  next();
});

router.route('/tours').get(getAllTours).post(createTour);

router
  .route('/tours/:tourId')
  .get(getSingleTour)
  .patch(updateTour)
  .delete(deleteTour);

module.exports = router;
