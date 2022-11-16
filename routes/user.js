const express = require('express');
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth');
const {
  getAllUsers,
  createUser,
  getSingleUser,
  updateUser,
  deleteUser,
} = require('../controllers/user');

const router = express.Router();

router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

router.post('/auth/signup', signup);
router.post('/auth/signin', signin);

router.route('/users').get(getAllUsers).post(createUser);

router
  .route('/users/:userId')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
