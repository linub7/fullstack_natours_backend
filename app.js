const { readdirSync } = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/error');
const errorHandler = require('./middleware/error');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));

// Set Security HTTP headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit Request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1h -> ms
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

// Body Parser, reading data from body into req.body
app.use(express.json({ limit: '2mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Routes
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
