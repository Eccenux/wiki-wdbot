import * as botpass from './bot.config.mjs';
import WikiBotLite from './src/WikiBotLite.js';
import WikidataApiHandler from './src/WikidataApiHandler.js';
import { runInBatches } from './src/utils.js';

const baseBot = new WikiBotLite(botpass);
const mwnBot = await baseBot.getBot('www.wikidata.org');
const wdBot = new WikidataApiHandler(mwnBot);

// test purge
// var re = await baseBot.purge(mwnBot, "User:Nux/test WLZ mass remove coords");
// console.log('purged:', re);

// test get entity
// var entityId = 'Q30159570';
// var entity = await wdBot.getEntity(entityId);
// console.log(entity);

// remove props
import qids from './temp.qids.js';
let qList = qids //[qids[0]];
let propertyId = 'P1435';
let valueMatcher = (v => v === 'Q21438156') // zabytek w Polsce
// let re = await wdBot.massRemoveValue(qList, propertyId, valueMatcher);
const asyncOp = (chunk) => {
	return wdBot.massRemoveValue(chunk, propertyId, valueMatcher);
};
runInBatches(qList, asyncOp, 'massRemoveValue-batches', 4);
