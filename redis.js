const Redis = require("ioredis");

const redisUrl = process.env.UPSTASH_RED;
const redisClient = new Redis(redisUrl);

async function getStoredNumbers(number) {
  try {
    let keys = [];

    if (number) {
      keys = await redisClient.keys(number);
    } else {
      keys = await redisClient.keys("*");
    }

    const pipeline = redisClient.pipeline();

    keys.forEach((key) => {
      pipeline.hmget(key, "number", "fbid", "receivedate");
    });

    const results = await pipeline.exec();

    const items = results.map((result) => {
      const [err, values] = result;
      if (err) {
        throw err; // Throw an error if there was an error retrieving data for a key
      }
      const [storedNumber, fbid, receivedate] = values;

      return {
        number: storedNumber,
        fbid,
        receivedate,
      };
    });

    return items;
  } catch (error) {
    // Handle any errors that occur during the Redis operations
    throw error;
  }
}

module.exports = {
  getStoredNumbers,
};
