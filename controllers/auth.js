const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.signup = asyncHandler(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm },
  } = req;

  const newUser = await User.create({ name, email, password, passwordConfirm });

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  newUser.password = undefined;
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.signin = asyncHandler(async (req, res, next) => {});
