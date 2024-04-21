  // helper/subscriptionHelper.js

  const Redis = require('ioredis');
  require('dotenv').config();
  const { createClient } = require('@supabase/supabase-js'); // Import createClient function from supabase library
  const { sendMessage, yesNo } = require('./messengerApi');

  const redis = new Redis(process.env.REDIS_URL_1);
  console.log('Redis connection established!');
  const expired = `
  📢 Offre de Renouvellement - Détails et Paiement :
  🗓️ Durée : 30 jrs (24h/24) ⏰
  💰 Prix : 2 000 Ariary 
  🏧 Moyens de paiement acceptés :
  Artel Money:
  033    (👤 Jean Marc.)
  📲 Une fois le paiement effectué, veuillez nous fournir votre numéro (10 chiffres) pour la vérification.
  (Aza asina espace na soratra fa tonga dia ny numéro ihany)`;
  const msgE =`📢 Votre abonnement a expiré. 😢 Pour continuer à bénéficier des services de notre chatbot, nous vous encourageons à renouveler votre abonnement dès maintenant. L'abonnement est disponible à partir de 2500 Ariary seulement. Si vous avez besoin de plus de détails, n'hésitez pas à nous le demander ! 💬` 
  const welcomeMsg = `Bienvenue ! 🌟 Nous sommes ravis de vous accueillir ! N'hésitez pas à explorer nos services et à poser vos questions. Nous sommes là pour vous aider. 🚀`;
  const check = async (fbid) => {
    try {
      const cacheItems = await redis.lrange(fbid, 0, 1);
      if (cacheItems && cacheItems.length >= 2) {
        const [cacheItem0, cacheItem1] = cacheItems; // Destructuring assignment for clarity
        if (cacheItem0 === 'E') {
          await sendMessage(fbid, msgE);
          return { };
        } else {
          return { access: 'TC', chatHistory: cacheItem1 };

        }
      }
      console.log('Cache not found or incomplete');
      return { access: 'Incomplete', chatHistory: null };
    } catch (error) {
      console.error('Error occurred while checking:', error);
      throw error; // Rethrow the error to handle it elsewhere
    }
  };

  const checkSubscription = async (fbid) => {
    try {
      const cacheItems = await redis.lrange(fbid, 0, 1);
      if (cacheItems && cacheItems.length >= 2) {
        const [cacheItem0, cacheItem1] = cacheItems; // Destructuring assignment for clarity

        if (cacheItem0 === 'E') {
          await sendMessage(fbid, expired);
          console.log('Expired.');
          return {};
        } else if (cacheItem0 === 'Chat') {
          console.log('Status is ChatC');
          return { Status: 'C', chathistory: cacheItem1 }; // Corrected typo chathistory -> chatHistory
        } else if (cacheItem0 === 'Trad') {
          console.log('Status is T.');
          return { Status: 'T' };
        } else if (cacheItem0 === 'Book') {
          console.log('Status is B.');
          return { Status: 'B' };
        } else if (cacheItem0 === 'Live') {
          console.log('Status is L.');
          return { Status: 'L' };
        }
      }
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
      const { data, error } = await supabase.from('chat_responses').select('*').eq('fbid', fbid);

          if (error) {
            console.error('Error:', error.message);
            return { status: 'Error', message: error.message };
          }

          if (data.length > 0) {
            console.log('Data found');
            await supabase.from('chat_responses').update({ expireDate: 'E' }).eq('fbid', fbid);
            const cacheKey = `${fbid}`;
            await redis.multi()
              .rpush(`${cacheKey}`, `E`)
              .rpush(`${cacheKey}`, 1, '  ')
              .exec();// Assuming redis is defined and initialized elsewhere
            await sendMessage(fbid, msgE);
            console.log(data[0]);
            return 1 ;
          } else {
            console.log(`No data found in table chat_responses with fbid '${fbid}'`);
            await Promise.all([
                sendMessage(fbid, welcomeMsg),
                yesNo(fbid),
              ]);
            return 1;
          }
        } catch (error) {
          console.error('Error:', error.message);
          return { status: 'Error', message: error.message };
        }
      }
  module.exports = {
    checkSubscription,
    check
  };
