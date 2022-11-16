const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.signup = asyncHandler(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm },
  } = req;

  const newUser = await User.create({ name, email, password, passwordConfirm });

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

exports.signin = asyncHandler(async (req, res, next) => {});
