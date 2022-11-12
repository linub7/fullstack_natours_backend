const express = require('express');
const {
  getAllUsers,
  createUser,
  getSingleUser,
  updateUser,
  deleteUser,
} = require('../controllers/user');

const router = express.Router();

router.route('/users').get(getAllUsers).post(createUser);

router
  .route('/users/:userId')
  .get(getSingleUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
