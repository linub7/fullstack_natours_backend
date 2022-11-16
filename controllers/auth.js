const jwt = require('jsonwebtoken');
const validator = require('validator');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = asyncHandler(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm, passwordChangedAt },
  } = req;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  const token = signToken(newUser._id);

  newUser.password = undefined;
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.signin = asyncHandler(async (req, res, next) => {
  const {
    body: { email, password },
  } = req;

  // 1) Check if email and password exists
  if (!email || !password)
    return next(new AppError('Please enter a valid email and password', 400));

  // 2) Check if user exists && password is correct
  // we deselect password field in the user model, in order that we have to select password
  // to compare stored password with entered password with .select('+password')
  const existUser = await User.findOne({ email }).select('+password');
  if (!existUser) {
    return next(new AppError('Incorrect Credentials', 401));
  }
  const correct = await existUser.correctPassword(password, existUser.password);

  if (!correct) return next(new AppError('Incorrect Credentials', 401));

  // 3) if everything is ok -> send token to client
  const token = signToken(existUser._id);

  existUser.password = undefined;

  return res.json({
    status: 'success',
    token,
    data: {
      user: existUser,
    },
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const {
    body: { email },
  } = req;
  // 1) get user based on posted email
  if (!email) return next(new AppError('Please provide an email', 400));
  if (!validator.isEmail(email))
    return next(new AppError('Please provide a valid email', 400));
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('User not found', 404));

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  console.log({ resetToken });

  await user.save({ validateBeforeSave: false });
  // 3) send it to user's email
  return res.json({
    status: 'success',
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {});
