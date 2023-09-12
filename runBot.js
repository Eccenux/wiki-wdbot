/* eslint-disable no-unused-vars */
import * as botpass from './bot.config.mjs';
import WikiBotLite from './src/WikiBotLite.js';
import WikidataBot from './src/WikidataBot.js';
import { runInBatches, formatTime } from './src/utils.js';
import fs from 'fs';

const baseBot = new WikiBotLite(botpass);
const mwnBot = await baseBot.getBot('www.wikidata.org');
const wdBot = new WikidataBot(mwnBot);

// test purge
// var re = await baseBot.purge(mwnBot, "User:Nux/test WLZ mass remove coords");
// console.log('purged:', re);

// test get entity
// var entityId = 'Q30159570';
// var entity = await wdBot.getEntity(entityId);
// console.log(entity);

//
// Remove many props by value.
// step1: prepare a list of ids of claims that should be removed
async function removePrepare (maxBatches = 10) {
	let allIds = [];
	const asyncOp = (chunk) => {
		return new Promise((resolve, reject) => {
			wdBot.massClaimIds(chunk, propertyId, valueMatcher).then((ids)=>{
				allIds = allIds.concat(ids);
				resolve(ids.length);
			}, (e) => {
				reject(e);
			});
		})
	};
	await runInBatches(qList, asyncOp, 'claims-batches', maxBatches);
	fs.writeFileSync('./temp.ids.js', JSON.stringify(allIds, null, '\t'));
	console.log(`Written ${allIds.length} ids.`);
	return allIds.length;
}
// step2: read ids of claims and remove them
async function removeById () {
	const startTime = performance.now();

	const claimIds = JSON.parse(fs.readFileSync('./temp.ids.js'));
	const count = claimIds.length;
	console.log(`Read ${count} ids.`);
	if (!count) {
		return 0;
	}
	const removed = await wdBot.removeClaims(claimIds);
	console.log(`Done. Removed: ${removed}.`);

	const elapsed = formatTime(startTime, performance.now());
	const elapsedPerRecord = formatTime(startTime, performance.now(), count);
	console.log(`Elapsed time for massRemove: ${elapsed} (per id: ${elapsedPerRecord}).`);
	return removed;
}

/**/
import qids from './temp.qids.js';
let qList = qids //[qids[0]];
let propertyId = 'P1435';
let valueMatcher = (v => v === 'Q21438156') // zabytek w Polsce

await removePrepare(15);
await removeById();
/**/
