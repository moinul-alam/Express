const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, true); // Allow all origins
      },
      credentials: true, // Allow cookies, headers, etc.
    })
  );
};