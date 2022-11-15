const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.signup = asyncHandler(async (req, res, next) => {
  const { body } = req;

  const newUser = await User.create(body);

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

exports.signin = asyncHandler(async (req, res, next) => {});
