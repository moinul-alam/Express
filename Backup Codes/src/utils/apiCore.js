const axios = require('axios');

const baseURL = process.env.CORE_BASE_URL || 'http://localhost:5000';

const apiCore = axios.create({
  baseURL, 
});

module.exports = apiCore;