// eslint-disable-next-line no-unused-vars
import { mwn as Mwn, mwn } from 'mwn';

import * as verlib from './version.js';
const version = await verlib.readVersion('./package.json');

/**
 * MediaWiki bot basics.
 * 
 * Mini helper for MWN library.
 * Based on: [[:en:Wikipedia:Wikiploy]] (WikiployLite)
 */
export default class WikiBotLite {
	constructor(botpass) {
		/** Disable save. */
		this.mock = false;
		/** Default wiki site (domain). */
		this.site = 'pl.wikipedia.org';

		/** [[Special:BotPasswords]] data. */
		this.botpass = {
			username: botpass.username,
			password: botpass.password,
		};
	
		/** @private Bots cache. */
		this._bots = {};
	}

	/**
	 * Init/get bot for given config.
	 * @param {String} site Mediawiki site domain.
	 * @returns {Promise<mwn>} bot object
	 */
	async getBot(site) {
		// from cache
		if (site in this._bots) {
			return this._bots[site];
		}
		const apiUrl = `https://${site}/w/api.php`;
		const bot = await Mwn.init({
			apiUrl: apiUrl,
			username: this.botpass.username,
			password: this.botpass.password,
			// UA required for WMF wikis: https://meta.wikimedia.org/wiki/User-Agent_policy
			userAgent: `WikiBotLite ${version} (by [[:en:User:Nux]])`,
		});
		this._bots[site] = bot;
		return bot;
	}

	/**
	 * Purge cache.
	 * @param {mwn} bot MWN bot instance.
	 * @param {String} title Page title.
	 */
	purge(bot, title) {
		return new Promise((resolve) => {
			bot.request({
				action: 'purge',
				titles: title,
			}).then((data) => {
				let purged = data?.purge;
				if (!purged) {
					console.warn('Unable to purge', data);
					return;
				}
				const info = purged.map(p=>`Page "${p.title}" purge status: ${p.purged?'OK - purged':'fail?'}`);
				console.log(info.join('\n'));
				resolve(true);
			});
		})	
	}
}