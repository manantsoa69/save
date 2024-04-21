const axios = require('axios');
require('dotenv').config();
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL_1);
async function saveParams(fbid, save) {
    try {
      await redis.multi()
        .lset(`${fbid}`, 0, save)
        //.lset(`${fbid}`, '  ')
        .exec();
    } catch (error) {
      console.error('Error saving params to Redis:', error);
      throw error;
    }
  }
  
  async function saveChatHistory(fbid, query, result) {
    try {
      const chatEntry = `Humain:${query} AI:${result}`;
      await redis.multi()
        .lset(`${fbid}`, 1, chatEntry)
        .exec();
    } catch (error) {
      console.error('Error saving chat history to Redis:', error);
      throw error;
    }
  }
  async function googleBooksAPI(bookName) {
    try {
      const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: bookName,
          maxResults: 1, // Limit to 1 result
        },
      });
  
      const book = response.data.items[0]; 
      if (book) {
        return `Title: ${book.volumeInfo.title}\nAuthors: ${book.volumeInfo.authors}`;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error searching for book:', error);
      return null;
    }
  }


  module.exports = {
    googleBooksAPI,
    saveChatHistory,
    saveParams
  };
  