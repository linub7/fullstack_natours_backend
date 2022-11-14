const { readdirSync } = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());

readdirSync('./routes').map((route) =>
  app.use('/api/v1', require('./routes/' + route))
);

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl}`,
  });
});

module.exports = app;
