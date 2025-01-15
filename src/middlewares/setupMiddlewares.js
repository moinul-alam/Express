const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
  const allowedOrigins = [
    'https://explora-core.vercel.app/', 
    'http://localhost:3000',
  ];

  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true); // Allow request
        } else {
          callback(new Error('Not allowed by CORS')); // Reject request
        }
      },
      credentials: true, // Allow cookies, headers, etc.
    })
  );
};
