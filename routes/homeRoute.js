//routes/homeRoute.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', (req, res) => {
  console.log('GET request received');

  // Make a request to the specified URL
  axios.get('https://live-1-e9t5.onrender.com/')
    .then(response => {
      console.log('Request to URL successful');
      res.sendStatus(200);
    })
    .catch(error => {
      console.error('Error making request to URL:', error);
      res.sendStatus(500); // Server error response
    });
});

module.exports = {
  router
};
