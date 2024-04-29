// helper/messengerApi.js
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

// Create a new instance of NodeCache
const tokenCache = new NodeCache();

// Function to get the cached token
const getCachedToken = () => {
  const cachedToken = tokenCache.get('TOKEN');
  if (cachedToken) {
    return cachedToken;
  }
  // If not cached, retrieve from process.env and cache it
  const TOKEN = process.env.TOKEN;
  tokenCache.set('TOKEN', TOKEN);
  return TOKEN;
};

// Function to get the cached page ID
const getCachedPageID = () => {
  const cachedPageID = tokenCache.get('PAGE_ID');
  if (cachedPageID) {
    return cachedPageID;
  }
  // If not cached, retrieve from process.env and cache it
  const PAGE_ID = process.env.PAGE_ID;
  tokenCache.set('PAGE_ID', PAGE_ID);
  return PAGE_ID;
};

// Create a single HTTP client instance and reuse it
const apiClient = axios.create({
  baseURL: 'https://graph.facebook.com/v18.0/',
});

// Set the access token in the client instance's defaults by calling getCachedToken()
apiClient.defaults.params = {
  access_token: getCachedToken(),
};
const splitMessage = (message, maxLength) => {
  const parts = [];
  let currentPart = '';

  if (typeof message !== 'string') {
    console.error('Invalid message format. Expected a string. Received:', message);
    return parts;
  }

  const splitTokens = /(\s+|[,.;!?])/;
  const words = message.split(splitTokens);

  for (const word of words) {
    if ((currentPart + word).length <= maxLength) {
      currentPart += word;
    } else {
      parts.push(currentPart);
      currentPart = word;
    }
  }

  if (currentPart.length > 0) {
    parts.push(currentPart);
  }

  return parts;
};

async function sendMessage(recipientId, message) {
 //console.log('message:' + message)
  try {
    if (!message) {
      console.error('Message is null.');
      return 0; // Return 0 to indicate failure
    }
    const maxMessageLength = 1666;
    if (message.length <= maxMessageLength) {
      await sendSingleMessage(recipientId, message);
    } else {
      const messageParts = splitMessage(message, maxMessageLength);
      for (const part of messageParts) {
        await sendSingleMessage(recipientId, part);
      }
    }
    return 1;
  } catch (error) {
    console.error('Error occurred while sending message:', error);
    return 0;
  }
}

async function sendSingleMessage(recipientId, message) {
  try {
      await apiClient.post(`${getCachedPageID()}/messages`, {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text: message },
    });
    //console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

async function sendQuickReplyMessage(recipientId, text, quickReplies) {
  try {
    const messageData = {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text, quick_replies: quickReplies },
    };
    const response = await apiClient.post(`${getCachedPageID()}/messages`, messageData);
    //console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

async function selectLang(fbid) {
  try {
    const messageText = 'Ho adika amin\'ny teny 👇 ';
    const quickReplies = [
      { content_type: 'text', title: '🇲🇬 Malagasy', payload: 'mg' },
      { content_type: 'text', title: '🇫🇷 Français', payload: 'fr' },
      { content_type: 'text', title: '🇬🇧 English', payload: 'en' },
      { content_type: 'text', title: '🇩🇪 Allemand', payload: 'de' }, 
      { content_type: 'text', title: '🇪🇸 Español', payload: 'es' }, 
      { content_type: 'text', title: '🇨🇳 Chinois', payload: 'zh-CN' }, 
      { content_type: 'text', title: '🇯🇵 Japonais', payload: 'ja' } 
    ];
    await sendQuickReplyMessage(fbid, messageText, quickReplies);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

async function selectLangtrad(fbid) {
  try {
    const messageText = 'Ho adika amin\'ny teny 👇 ';
    const quickReplies = [
      { content_type: 'text', title: '🇲🇬 Malagasy', payload: '/mg' },
      { content_type: 'text', title: '🇫🇷 Français', payload: '/fr' },
      { content_type: 'text', title: '🇬🇧 English', payload: '/en' },
      { content_type: 'text', title: '🇩🇪 Allemand', payload: '/de' }, 
      { content_type: 'text', title: '🇪🇸 Español', payload: '/es' }, 
      { content_type: 'text', title: '🇨🇳 Chinois', payload: '/zh-CN' }, 
      { content_type: 'text', title: '🇯🇵 Japonais', payload: '/ja' } 
    ];
    await sendQuickReplyMessage(fbid, messageText, quickReplies);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

async function menuMesg(fbid) {
  try {
    const messageText =  'Quel modèle de volet utilisez-vous ?' ;
    const quickReplies = [
     { content_type: 'text', title: '🤖 ChatGPT', payload: 'Chat' },
     { content_type: 'text', title: '🌍 TradGPT', payload: 'Trad' },
     { content_type: 'text', title: '🔴 LiveGPT', payload: 'Live' },
     { content_type: 'text', title: '📚 BookGPT', payload: 'Book' }
    ];
    await sendQuickReplyMessage(fbid, messageText, quickReplies);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}
  
async function yesNo(fbid) {
  try {
    const messageText =  `
    Désirez-vous explorer notre service pendant 24 heures sans frais et
    tester notre bot ? 🌟🔓  \n 
    Pour l\'activer, appuyez sur (oui)👇 `;
    const quickReplies = [
     { content_type: 'text', title: 'Oui ✔️ ', payload: 'oui' },
     { content_type: 'text', title: 'Tuto 📚', payload: 'tuto' }
     //{ content_type: 'text', title: 'Notre Service', payload: 'service' }    
    ];
    await sendQuickReplyMessage(fbid, messageText, quickReplies);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  sendMessage,
  selectLang,
  menuMesg,
  selectLangtrad,
  yesNo
};
