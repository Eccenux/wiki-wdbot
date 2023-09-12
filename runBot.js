import * as botpass from './bot.config.mjs';
import WikiBotLite from './src/WikiBotLite.js';

const wikiBot = new WikiBotLite(botpass);
const bot = await wikiBot.getBot('www.wikidata.org');

// test purge
var re = await wikiBot.purge(bot, "User:Nux/test WLZ mass remove coords");
console.log('purged:', re);
