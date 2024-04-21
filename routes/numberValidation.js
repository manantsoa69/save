//routes/numberValidation.js
const Redis = require("ioredis");
require('dotenv').config();
const { sendMessage } = require('../helper/messengerApi');
async function checkNumber(number, fbid) {
  const redisUrl = process.env.REDIS_NUBSAVE;
  console.log('Redis save!');
  const redisClient = new Redis(redisUrl);
  if (!/^\d+$/.test(number)) {
    return "Veuillez fournir un numero valide, s'il vous plaît.";
  }

  if (number.length === 10) {
    if (number.startsWith("034") || number.startsWith("038") || number.startsWith("033") || number.startsWith("032")) {
      // Get the current date
      const currentDate = new Date().toISOString();

      // Save number as the key with senderId as value1 and currentDate as value2 in Redis
      await redisClient.hset(number, "number", number, "fbid", fbid, "receivedate", currentDate);
      //await sendMessage(fbid, "Nous vous prions de bien vouloir patienter pendant que nous traitons et vérifions votre paiement. 🕐 Nous vous remercions pour votre confiance.");
      await sendMessage(fbid, "verification encours ...")

      return  "Nous vous prions de bien vouloir patienter pendant que nous traitons et vérifions votre paiement. 🕐 Nous vous remercions pour votre confiance.";
    } else {
      return "Il y a un problème avec votre numéro. Il doit commencer par 034 ou 038.";
    }
  } else if (number.length < 10) {
    return "Veuillez s'il vous plaît fournir un numéro composé exactement de 10 chiffres.";
  } else {
    return "Nous vous prions de bien vouloir vous assurer qu'il ne dépasse pas 10 chiffres.";
  }
}

module.exports = {
  checkNumber,
};
