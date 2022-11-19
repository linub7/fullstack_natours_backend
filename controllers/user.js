const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { body, user } = req;
  // 1) Create Error if user posts password data
  if (body.password || body.passwordConfirm)
    return next(
      new AppError(
        `OOPS! you can not update password here! Please use /update-my-password`,
        400
      )
    );

  const isAlreadyEmailExited = await User.findOne({
    email: body.email,
    _id: { $ne: user._id },
  });
  if (isAlreadyEmailExited)
    return next(
      new AppError(
        'This email has taken by another user, please take another email',
        400
      )
    );
  // 3) filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(body, 'name', 'email');
  // 2) Update user document
  // since we don't deal with password or any sensitive data, so we can use findByIdAndUpdate
  const updatedUser = await User.findByIdAndUpdate(user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = asyncHandler(async (req, res, next) => {
  const { user } = req;
  await User.findByIdAndUpdate(
    user.id,
    { active: false },
    { new: true, runValidators: true }
  );
  return res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getSingleUser = factory.getSingleOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
