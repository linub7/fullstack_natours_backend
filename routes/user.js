const express = require('express');
const { isValidObjectId } = require('mongoose');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/auth');
const {
  getAllUsers,
  createUser,
  getSingleUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/user');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('userId', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid userId', 400));
  }
  next();
});

router.post('/auth/forgot-password', forgotPassword);
router.patch('/auth/reset-password/:token', resetPassword);
router.patch('/auth/update-my-password', protect, updatePassword);

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

router.route('/users').get(getAllUsers).post(createUser);

router.patch('/me/update', protect, updateMe);
router.delete('/me/delete', protect, deleteMe);

router
  .route('/users/:userId')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
