const { readdirSync } = require('fs');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/error');
const errorHandler = require('./middleware/error');

const app = express();

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());

readdirSync('./routes').map((route) =>
  app.use('/api/v1', require('./routes/' + route))
);

app.use(errorHandler);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl}`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // if next receives an argument, no matter what it is, express will automatically know that
  // there was an error and skip the other middlewares in the middleware stack and send
  // the error that we passed in to our global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
