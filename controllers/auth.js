const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');

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

  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to \n ${resetURL} \nIf you did'nt forget your password, please ignore this email`;
  const subject = 'Your Password Reset Token. Valid only for 10 minutes ⚠️.';

  try {
    await sendEmail({ email: user.email, subject, message });
    return res.json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email! Try again later', 400)
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const {
    params: { token },
    body: { password, passwordConfirm },
  } = req;
  if (!token || !password || !passwordConfirm)
    return next(
      new AppError('Please provide token, password and passwordConfirm', 400)
    );

  // 1) Get User based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user)
    return next(
      new AppError('Token is invalid or has expired, please try again', 400)
    );
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  const generatedToken = signToken(user._id);
  res.json({
    status: 'success',
    token: generatedToken,
  });
});
