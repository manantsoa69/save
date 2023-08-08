const mysql = require('mysql2/promise');
const Redis = require('ioredis');
require('dotenv').config();
// Connect to the second Redis account
const redis = new Redis(process.env.REDIS_URL);
console.log('Connected to Redis');
// Connect to the second Redis account
const redis1 = new Redis(process.env.REDIS_URL1);
console.log('Connected to Redis 1');
const pool = mysql.createPool(process.env.DATABASE_URL);
console.log('Connected to mysql');

const { calculateExpirationDate } = require('../helper/expireDateCalculator');

const saveSubscription = async (fbid, subscriptionStatus) => {
  if (subscriptionStatus === 'A') {
    console.log('Subscription is already active:', subscriptionStatus);
    return true;
  }
  
  const expireDate = calculateExpirationDate(subscriptionStatus);
  if (!expireDate) {
    return false;
  }

  try {
    console.log('Updating subscription expiration date in MySQL:', subscriptionStatus);

    // Update the expiration date for expired subscriptions in MySQL
    const connection = await pool.getConnection();
    try {
      await connection.query('UPDATE users SET expireDate = ? WHERE fbid = ?', [expireDate.toISOString(), fbid]);
      console.log('Subscription expiration date updated in MySQL:', subscriptionStatus);   
    } finally {
      connection.release();
    }

    // Update the expiration date in Redis as well
    const cacheKey = `${fbid}`;
    const expireDateInSeconds = Math.ceil((new Date(expireDate) - new Date()) / 1000);
    const updatePromises = [
      redis.setex(cacheKey, expireDateInSeconds, expireDate.toISOString()),
      redis1.setex(cacheKey, expireDateInSeconds, expireDate.toISOString())
    ];

    // Execute both updates simultaneously using Promise.all
    await Promise.all(updatePromises);
    console.log('Subscription expiration date updated in Redis:', subscriptionStatus);

    return true;
  } catch (error) {
    console.error('Error occurred while updating subscription expiration date:', error);
    return false;
  }
};

module.exports = {
  saveSubscription,
};
