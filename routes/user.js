const express = require('express');
const { isValidObjectId } = require('mongoose');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/auth');
const factory = require('../controllers/handlerFactory');
const {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/user');
const { protect, getMe } = require('../middleware/auth');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new AppError('Please provide a valid id', 400));
  }
  next();
});

router.post('/auth/forgot-password', forgotPassword);
router.patch('/auth/reset-password/:token', resetPassword);
router.patch('/auth/update-my-password', protect, updatePassword);

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

router.route('/users').get(getAllUsers);

router.get('/me', protect, getMe, factory.getSingleOne(User));
router.patch('/me/update', protect, updateMe);
router.delete('/me/delete', protect, deleteMe);

router
  .route('/users/:id')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
