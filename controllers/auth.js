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

const createSendToken = (userId, user, statusCode, res) => {
  const token = signToken(userId);

  const cookieOptions = {
    expires: new Date(
      // 24: 24 hours in one day -> 60: minutes in one hour -> 60: seconds in one minute -> 1000: milliseconds in one second
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

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

  newUser.password = undefined;
  createSendToken(newUser._id, newUser, 201, res);
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

  existUser.password = undefined;
  createSendToken(existUser._id, existUser, 200, res);
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

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const {
    body: { oldPassword, password, passwordConfirm },
    user,
  } = req;
  if (!oldPassword || !password || !passwordConfirm)
    return next(
      new AppError(
        `Please provide an old password and new password and passwordConfirm`,
        400
      )
    );

  // 1) Get user from DB
  const existedUser = await User.findById(user.id).select('+password');
  if (!existedUser) return next(new AppError('User not found', 404));

  // 2) Check if the posted current password is correct
  const isCorrect = await existedUser.correctPassword(
    oldPassword,
    existedUser.password
  );
  if (!isCorrect)
    return next(new AppError(`Current Password is not correct`, 401));

  // 3) If, so, updated the password
  existedUser.password = password;
  existedUser.passwordConfirm = passwordConfirm;
  // User.findByIdAndUpdate will NOT work as intended !
  await existedUser.save();

  // 4) Log user in, send JWT
  existedUser.password = undefined;
  createSendToken(existedUser._id, existedUser, 200, res);
});

exports.signoutUser = asyncHandler(async (req, res, next) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return res.status(200).json({
    success: true,
    data: {},
  });
});
