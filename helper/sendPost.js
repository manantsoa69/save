const axios = require('axios');
const { text } = require('express');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
// Function to send a POST request to the FastAPI server
async function generateResponse( query) {
  try {
    // URL of the FastAPI server
    const url = 'https://live-1-e9t5.onrender.com/search';

    // Data to be sent in the request body
    const data = {
        query: query,
    };

    // Send POST request
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract the response_genai property from the response data
    const responseData = response.data;
    const responseGenai = responseData.result; 
    


    // Return the response_genai text
    return responseGenai;
  } catch (error) {
    // If an error occurs, log the error message
    console.error('Error:', error.message);
    return 'Sorry, there was an error processing your request.';
  }
}
// Function to send a POST request to the FastAPI server
async function transletResponse(fbid, lastPrompt, payload) {
  console.log(payload);
  try {
    // URL of the FastAPI server
   // const url = 'https://live-1-e9t5.onrender.com/translate/';
    const url = 'https://live-1-e9t5.onrender.com/translate/';
    // Data to be sent in the request body
    const data = {
      fbid: fbid,
      text: lastPrompt,
      targetlanguage: payload,
    };
    //console.log(data);
    // Send POST request
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract the translated text from the response data
    const responseData = response.data;
    const translatedText = responseData.response_genai; 

    // Return the translated text
    return translatedText;
  } catch (error) {
    // If an error occurs, log the error message
    console.error('Error:', error.message);
    // Return an error message
    return 'Sorry, there was an error processing your request.';
  }
}

module.exports = {
  generateResponse,
  transletResponse
};
