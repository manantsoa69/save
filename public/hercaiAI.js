const { Hercai } = require("hercai");
require('dotenv').config();

async function askHercai(content) {
    try {
        const herc = new Hercai(); // Using default values for model and apiKey
        const response = await herc.question({ model: "turbo-16k", content });
        return response.reply;
    } catch (error) {
        console.error('Error occurred while using Hercai:', error);
        throw error; // Re-throwing the error to handle it at a higher level
    }
}

module.exports = {
    askHercai,
};
