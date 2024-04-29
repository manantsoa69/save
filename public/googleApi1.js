const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const NodeCache = require('node-cache');
const { askHercai } = require('./hercaiAI');
const myCache = new NodeCache();
const { generatePrompt  } = require('./param');
const { sendMessage } = require("../helper/messengerApi");

// Function to retrieve the API key from the cache or environment variables
const getApiKey = () => {
  const cachedApiKey = myCache.get('api_key');
  if (cachedApiKey) {
    return cachedApiKey;
  } else {
    const apiKey = process.env.API_KEY1; // Update to your environment variable
    if (!apiKey) {
      throw new Error("API_KEY environment variable not found.");
    }
    myCache.set('api_key', apiKey, /* set cache expiration time in seconds */);
    return apiKey;
  }
};

const genAI = new GoogleGenerativeAI(getApiKey());
const googlechat1 = async (chathistory, query, param) => {
  try {
    const generationConfig = { maxOutputTokens: 1500, temperature: 1.0, topP: 0.36, topK: 1 };
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig, safetySettings });
    console.log(`GOOGLE1 `);
    const prompt = await generatePrompt  (chathistory, query, param);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    if (!content) {
      console.warn('GoogleGenerativeAI returned an empty response.');     
      return await handleFallback(prompt);
    }

    return  content ;

  } catch (googleError) {

    console.error('Error occurred while using GoogleGenerativeAI:',googleError);
    const prompt = await generatePrompt  (chathistory, query, param);

    return await handleFallback(prompt);
  }
};
const handleFallback = async (prompt) => {
  try {
    const result = await askHercai(prompt);
    console.log("Using OpenAI's chatCompletion");
    return  result ;
  } catch (openaiError) {
    console.error('Error occurred during chatCompletion fallback:', openaiError);
    await sendMessage(fbid,"Je suis un peu confus. Veuillez reposer votre question, s'il vous plaît.");
    return 1 ; 
    
  }
};

module.exports = {
  googlechat1,

};
