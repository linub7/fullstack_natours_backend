const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('./async');

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Getting token and check if it's exist
  const {
    headers: { authorization },
  } = req;

  let token;

  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new AppError('You are not logged in, please login to get access', 401)
    );

  // 2) Verification the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError('The token belonging to this user does no longer exist', 401)
    );

  // 4) Check is user changed password after the token was issued
  if (freshUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError(`User recently changed password!Please login again`, 401)
    );

  // GRANT ACCESS to protected route
  req.user = freshUser;
  next();
});

exports.authorize =
  (...roles) =>
  (req, res, next) => {
    const {
      user: { role },
    } = req;
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(role))
      return next(
        new AppError(`You do not have permission to perform this action`, 403)
      );
    next();
  };

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
