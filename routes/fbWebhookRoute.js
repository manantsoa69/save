const express = require('express');
const router = express.Router();
const { checkSubscription, check } = require('../helper/subscriptionHelper');
const { sendMessage, selectLang, menuMesg, selectLangtrad } = require('../helper/messengerApi');
const { checkNumber } = require('./numberValidation');
const { googlechat } = require('../public/googleApi');
const { googlechat1 } = require('../public/googleApi1');
const { googlechat2 } = require('../public/googleApi2');
const { googlechat3 } = require('../public/googleApi3');
const { transletResponse } = require('../helper/sendPost');
const { saveParams, saveChatHistory, googleBooksAPI } = require('./manageRoote');
const { saveSubscription } = require('../helper/saveSubscription');

const lastProcessedPrompts = {};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;

    if (!(entry && entry.length > 0 && entry[0].messaging && entry[0].messaging.length > 0)) {
      return res.sendStatus(200);
    }

    const { sender: { id: fbid }, message } = entry[0].messaging[0];

    if (!(message && message.text)) {
      return res.sendStatus(200);
    }

    const { text: query } = message;
    console.log(`fbid ${fbid}msg${query}`);

    if (/^03\d+$/.test(query)) {
      const numberValidationResult = await checkNumber(query, fbid);
      await sendMessage(fbid, numberValidationResult);
      console.log('Number message sent:', numberValidationResult);
      return res.sendStatus(200);
    }

    if (message.quick_reply && message.quick_reply.payload) {
      const payload = message.quick_reply.payload;
      console.log(`payload ${payload}`);

      if (payload.trim().startsWith('/')) {
        const comment = payload.trim().substring(1);
        const { access, chatHistory } = await check(fbid);
        if (access === 'TC') {
          const chatAfterAIIndex = chatHistory.indexOf('AI:');
          if (chatAfterAIIndex !== -1) {
            const lastPrompt = chatHistory.substring(chatAfterAIIndex + 3).trim();
            result = await transletResponse(fbid, lastPrompt, comment);
            await sendMessage(fbid, result);
            return res.sendStatus(200);
          }
        }
      } else if (['Chat', 'Trad', 'Live', 'Book'].includes(payload)) {
        const { Status } = await checkSubscription(fbid);
        if (Status === 'EE' || Status === 'E') {
          
        } else {
          await saveParams(fbid, payload);
          await sendMessage(fbid, `Vous êtes en mode ${payload} GPT. 🔥`);
          if (payload === 'Book') {
            await sendMessage(fbid, "📚 Envoyez simplement le titre de votre livre.");
          }
        }
        return res.sendStatus(200);
      } else if (payload === 'oui') { 
        await saveSubscription(fbid);
        // Handle the action for this payload
        return res.sendStatus(200);
      } else if (payload === 'service') { 
        await saveSubscription(fbid);
        // Handle the action for this payload
        return res.sendStatus(200);
      } else if (payload === 'tuto') {
        const postUrl = "Cliquez sur ce lien pour accéder au tutoriel : https://www.facebook.com/yourpage/posts/1234567890"; 
        // Send the post URL as a message to the user
        await sendMessage(fbid, postUrl);

        // Handle the action for this payload
        return res.sendStatus(200);
      }
    }

    if (query.toLowerCase() === 'trad') {
      await selectLangtrad(fbid);
      return res.sendStatus(200);
    }

    if (query.toLowerCase() === 'menu') {
      await menuMesg(fbid);
      return res.sendStatus(200);
    }

    lastProcessedPrompts[fbid] = query;

    const { Status, chathistory } = await checkSubscription(fbid);

    if (Status === 'C') { 
      const functions = shuffle([googlechat3]);
      let result;
      for (const func of functions) {
        result = await func(chathistory, query, 'Chat');
        if (result) break;
      }
      await Promise.all([
        saveChatHistory(fbid, query, result),
        sendMessage(fbid, result),
      ]);
    } else if (Status === 'B') { 
      const functions = shuffle([googlechat, googlechat1, googlechat2, googlechat3]);
      const aiResult = await googleBooksAPI(query);
      if (aiResult === null) {
        await sendMessage(fbid, "Je n'ai trouvé aucune information sur votre livre. Veuillez fournir à nouveau le titre du livre.");
        return res.sendStatus(200);
      } else {
        let result;
        for (const func of functions) {
          await sendMessage(fbid, aiResult);
          result = await func(query, aiResult, 'Book'); 
          if (result) break;
        }
        if (result) {
          await sendMessage(fbid, result);
        } else {
          await sendMessage(fbid, "I couldn't process your request. Please try again later.");
        }
      }
    } else if (Status === 'Q') { 
      const result = await googlefirst(query);
      if (result && result.content) {
        const responseText = result.content;
        await sendMessage(fbid, responseText);
      }
    } else if (Status === 'T') { 
      await selectLang(fbid);
    } else if (Status === 'L') { 
      const functions = shuffle([ googlechat3]);
      let result;
      for (const func of functions) {
        result = await func(chathistory, query, 'Live');
        if (result) break;
      }
      await Promise.all([
        saveChatHistory(fbid, query, result),
        sendMessage(fbid, result),
      ]);
    }

    return res.sendStatus(200);

  } catch (error) {
    console.error('Error occurred:', error);
    res.sendStatus(500);
  }
});


router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = {
  router,
};
