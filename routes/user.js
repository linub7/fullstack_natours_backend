const express = require('express');
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
} = require('../controllers/user');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/auth/forgot-password', forgotPassword);
router.patch('/auth/reset-password/:token', resetPassword);
router.patch('/auth/update-my-password', protect, updatePassword);

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

router.route('/users').get(getAllUsers).post(createUser);

router.patch('/me/update', protect, updateMe);

router
  .route('/users/:userId')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
