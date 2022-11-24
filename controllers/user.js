/* eslint-disable camelcase */
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const {
  destroyImageFromCloudinary,
  uploadImageToCloudinary,
} = require('../utils/imageUpload');
const factory = require('./handlerFactory');

// eslint-disable-next-line no-unused-vars
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
  // const filteredBody = filterObj(body, 'name', 'email');
  // 2) Update user document
  // since we don't deal with password or any sensitive data, so we can use findByIdAndUpdate
  // const updatedUser = await User.findByIdAndUpdate(user.id, filteredBody, {
  //   new: true,
  //   runValidators: true,
  // });
  const exitedUser = await User.findById(user.id);
  if (!exitedUser) return next(new AppError(`User not found`, 404));

  const publicId = exitedUser.photo && exitedUser.photo.public_id;

  if (publicId && req.file) {
    const result = await destroyImageFromCloudinary(publicId);
    if (result !== 'ok') return next(new AppError('Error deleting image', 500));
  }

  // upload new avatar if there is one
  if (req.file) {
    const path = req.file && req.file.path;
    const { url, public_id } = await uploadImageToCloudinary(path);
    exitedUser.photo = { url, public_id };
  }

  exitedUser.name = body.name && body.name;
  exitedUser.email = body.email && body.email;

  await exitedUser.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    data: {
      data: exitedUser,
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
