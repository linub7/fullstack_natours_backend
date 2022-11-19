const asyncHandler = require('../middleware/async');
const AppError = require('../utils/AppError');

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const {
      params: { id },
    } = req;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError(`Document with ${id} was not found in db`, 404));
    }

    return res.json({
      status: 'success',
      message: 'deleted',
    });
  });
