import {DeployConfig, WikiployLite} from 'wikiploy';

// lite
import * as botpass from './bot.config.mjs';
const ployBot = new WikiployLite(botpass);

// custom summary
ployBot.summary = () => {
	return `v0.0.1: info when needed`;
}

// run asynchronously to be able to wait for results
(async () => {
	ployBot.site = "www.wikidata.org"; 
	const configs = [];
	configs.push(new DeployConfig({
		src: 'src/WikidataApiHandler.js',
		dst: '~/MassWdOps.js',
	}));
	await ployBot.deploy(configs);
})().catch(err => {
	console.error(err);
	process.exit(1);
});