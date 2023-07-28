// routes/homeRoute.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/subscribe'); // Redirect to the /subscribe route to show the subscription form
});

module.exports = {
  router,
};
