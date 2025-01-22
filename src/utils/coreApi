const axios = require('axios');

const baseURL = process.env.API_BASE_URL || 'https://api.themoviedb.org/3';
const apiKey = process.env.API_KEY;

const api = axios.create({
  baseURL,
  params: { api_key: apiKey }, 
});

module.exports = api;