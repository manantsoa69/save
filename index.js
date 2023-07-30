// index.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();
const { getStoredNumbers } = require('./redis');
const subscribeRoute = require('./routes/subscribeRoute');
const homeRoute = require('./routes/homeRoute');

const webApp = express();
const PORT = process.env.PORT || 3000;

// MongoDB Setup
mongoose.connect(process.env.MONGODB_URI || ' ', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Mongoose Schema
const queryResultSchema = new mongoose.Schema({
  number: String,
  fbid: String,
  receivedate: Date,
});

const QueryResultModel = mongoose.model('QueryResult', queryResultSchema);

// Redis Setup
const redisUrl = process.env.UPSTASH_RED || '';
const redisClient = new Redis(redisUrl);
redisClient.on('connect', () => console.log('Connected to upstash'));
redisClient.on('error', error => console.error('Error connecting to Redis:', error));

// Express Configuration
webApp.set('view engine', 'ejs'); // Set EJS as the view engine
webApp.set('views', path.join(__dirname, 'views')); // Set the views directory
webApp.use(express.static(path.join(__dirname, 'public')));
webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());
webApp.use('/subscribe', subscribeRoute.router);
webApp.use('/', homeRoute.router);

// Error Handling Middleware
webApp.use((err, req, res, next) => {
  console.error('An error occurred:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Query Route
webApp.get('/query', async (req, res) => {
  try {
    const numberToQuery = req.query.number || '';

    // Assuming the getStoredNumbers() function returns an array of items from Redis
    const items = await getStoredNumbers(numberToQuery);

    // Step 3: Save the queried data to MongoDB
    await Promise.all(
      items.map(async (item) => {
        const { number, fbid, receivedate } = item;
        const queryResult = new QueryResultModel({ number, fbid, receivedate });
        await queryResult.save();
      })
    );

    // Step 4: Delete the data from Redis after successfully saving to MongoDB
    await Promise.all(
      items.map(async (item) => {
        const key = item.number; // Assuming the "number" field is used as the Redis key
        await redisClient.del(key);
      })
    );

    res.json({ numberToQuery, items });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the Server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
