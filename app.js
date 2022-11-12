const { readdirSync } = require('fs');
const express = require('express');
const morgan = require('morgan');

const app = express();

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());

readdirSync('./routes').map((route) =>
  app.use('/api/v1', require('./routes/' + route))
);

module.exports = app;
