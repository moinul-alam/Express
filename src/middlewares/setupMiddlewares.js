const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
  const allowedOrigins = [
    'https://explora-core.vercel.app',
    'http://localhost:5173',
  ];

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['set-cookie'],
    })
  );

  // Add security headers
  app.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': req.headers.origin,
    });
    next();
  });
};



  // Add custom headers to accommodate cookies
  // app.use((req, res, next) => {
  //   res.header('Access-Control-Allow-Credentials', 'true'); // Enable credentials (cookies)
  //   res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://explora-core.vercel.app'); // Dynamically set allowed origin
  //   res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); // Allowed HTTP methods
  //   res.header(
  //     'Access-Control-Allow-Headers',
  //     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  //   ); // Allowed headers
  //   next();
  // });