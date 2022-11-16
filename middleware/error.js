const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log(err.stack);

  // Mongoose bad objectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new AppError(message, 404);
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const message = 'Duplicate fields value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new AppError(message.join('. '), 400);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token, please login again!';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your Access token has expired, please login again';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    status: 'fail',
    message: error.message || 'Server not Found',
  });
};

module.exports = errorHandler;
