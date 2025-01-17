const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
  const allowedOrigins = [
    'https://explora-core.vercel.app', // Frontend on Vercel
    'http://localhost:5173',          // For local development
  ];

  app.use(cookieParser()); // Parse cookies
  app.use(express.json()); // Parse JSON payloads
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true); // Allow the request
        } else {
          callback(new Error('Not allowed by CORS')); // Reject request
        }
      },
      credentials: true, // Allow cookies and credentials
    })
  );

  // Add custom headers to accommodate cookies
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true'); // Enable credentials (cookies)
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://explora-core.vercel.app'); // Dynamically set allowed origin
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); // Allowed HTTP methods
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    ); // Allowed headers
    next();
  });
};
