// eslint-disable-next-line no-unused-vars
import { mwn } from "mwn";
import { formatTime } from './utils.js';

const logTag = '[wdBot]';

/**
 * Wikidata entity operations.
 */
class WikidataBot {
	/**
	 * Create a new instance.
	 * 
	 * @param {mwn} bot Initilized MWN bot.
	 */
	constructor(bot) {
		this.bot = bot;

		this.elapsedDebug = {
			apiCall: false,
		}
	}

	/**
	 * Mass-remove a property.
	 * 
	 * @param {Array} qList List of Qs from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 */
	async massRemoveProp(qList, propertyId) {
		const startTime = performance.now();

		console.log(`Running %d removals of ${propertyId}.`, qList.length);
		let removed = 0;
		let skipped = [];
		for (const entityId of qList) {
			let ok = await this.removeProp(entityId, propertyId);
			if (ok) {
				console.log(`Removed from ${entityId}`);
				removed++;
			} else {
				skipped.push(entityId);
			}
		}
		console.log(`Done. Removed %d of %d of ${propertyId}.`, removed, qList.length);
		if (skipped.length) {
			console.warn(`Skipped %d:`, skipped.length, skipped);
		}

		const elapsed = formatTime(startTime, performance.now());
		const elapsedPerRecord = formatTime(startTime, performance.now(), qList.length);
		console.log(`Elapsed time for massRemoveValue: ${elapsed} (per Q: ${elapsedPerRecord}).`);
	}

	/**
	 * Mass-remove a value of a property.
	 * 
	 * Note! This seems to brake when executed in batches.
	 * Probably some flood control on Wikidata.
	 * 
	 * @param {Array} qList List of Qs from which to remove matching values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 */
	async massRemoveValue(qList, propertyId, valueMatcher) {
		const startTime = performance.now();

		console.log(`Running %d removals of ${propertyId}.`, qList.length);
		let removed = 0;	// nuymber of entities with some values removed
		let valuesRemoved = 0;
		let skipped = [];
		for (const entityId of qList) {
			let count = await this.removePropValue(entityId, propertyId, valueMatcher);
			if (count > 0) {
				console.log(`Removed from ${entityId}`);
				removed++;
				valuesRemoved += count;
			} else {
				skipped.push(entityId);
			}
		}
		console.log(`Done. Removed at least one value from %d of %d entities (total values %d).`, removed, qList.length, valuesRemoved);
		if (skipped.length) {
			console.warn(`Skipped %d:`, skipped.length, skipped);
		}

		const elapsed = formatTime(startTime, performance.now());
		const elapsedPerRecord = formatTime(startTime, performance.now(), qList.length);
		console.log(`Elapsed time for massRemoveValue: ${elapsed} (per Q: ${elapsedPerRecord}).`);
	}

	/**
	 * Get claim ids.
	 * 
	 * @param {Array} qList List of Qs from which to remove matching values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 * @param {Function} valueMatcher A value matcher `(value, claim) => value === 'Q123'`.
	 * @returns {Array} of claim.id.
	 */
	async massClaimIds(qList, propertyId, valueMatcher) {
		const startTime = performance.now();

		console.log(`Running %d massClaimIds of ${propertyId}.`, qList.length);
		let read = 0;	// number of entities with some values read
		let valuesRead = 0;
		let all = [];
		for (const entityId of qList) {
			let ids = await this.getClaimIds(entityId, propertyId, valueMatcher);
			if (ids.length > 0) {
				read++;
				valuesRead += ids.length;
				all = all.concat(ids);
			}
		}
		console.log(`Done. Read at least one value from %d of %d entities (total values %d).`, read, qList.length, valuesRead);

		const elapsed = formatTime(startTime, performance.now());
		const elapsedPerRecord = formatTime(startTime, performance.now(), qList.length);
		console.log(`Elapsed time for massClaimIds: ${elapsed} (per Q: ${elapsedPerRecord}).`);

		return all;
	}

	/**
	 * Read property claims for the entity.
	 * 
	 * @param {String} entityId Q-ID.
	 * @param {String} propertyId Property id (e.g. P625)
	 * @returns
	 * 	<li>false if entity was not found;
	 * 	<li>empty array if property was not;
	 * 	<li>claims array otheriwse.
	 */
	async getClaims(entityId, propertyId) {
		let entity;
		try {
			entity = await this.getEntity(entityId);
		} catch (error) {
			console.warn(logTag, `Entity ${entityId} not found?`, error);
			return false;
		}
		if (!entity.claims || typeof entity.claims[propertyId] !== 'object') {
			console.log(logTag, `Property ${propertyId} not found in ${entityId}.`);
			return [];
		}
		return entity.claims[propertyId];
	}

	/**
	 * Remove property.
	 * 
	 * @param {String} entityId Q-ID from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 * @returns
	 * 	<li>false if entity was not found or there was a problem removing claim(s);
	 * 	<li>true if property was removed or was not set already.
	 */
	async removeProp(entityId, propertyId) {
		const claims = await this.getClaims(entityId, propertyId);
		if (claims === false) {
			return false;
		}
		try {
			for (const claim of claims) {
				const claimId = claim.id;
				await this.removeClaim(claimId);
			}
		} catch (error) {
			console.warn(logTag, `Problem removing property ${propertyId} from ${entityId}.`, error);
			return false;
		}
		return true;
	}

	/**
	 * Remove specific property value.
	 * 
	 * Removes value from the prop for which valueMatcher functions returns true.
	 * 
	 * @param {String} entityId Q-ID from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 * @param {Function} valueMatcher A value matcher `(value, claim) => value === 'Q123'`.
	 * @returns
	 * 	<li>-1 if entity was not found;
	 * 	<li>0..n = count of removed values (claims).
	 */
	async removePropValue(entityId, propertyId, valueMatcher) {
		const claims = await this.getClaims(entityId, propertyId);
		if (claims === false) {
			return -1;
		}
		let removed = 0;
		for (const claim of claims) {
			if (typeof valueMatcher === 'function') {
				const value = this.getClaimValue(claim);
				if (!valueMatcher(value, claim)) {
					continue;
				}
			}
			const claimId = claim.id;
			try {
				await this.removeClaim(claimId);
				removed++;
			} catch (error) {
				console.warn(logTag, `Problem removing claim ${claimId} from ${entityId}.`, error);
			}
		}
		return removed;
	}

	/**
	 * Remove specific claims by id.
	 * 
	 * @param {Array} claimIds Claims ids as read from the entity.
	 * @returns
	 * 	<li>-1 if entity was not found;
	 * 	<li>0..n = count of removed values (claims).
	 */
	async removeClaims(claimIds, progressStep=10) {
		let removed = 0;
		let count = claimIds.length;
		for (const claimId of claimIds) {
			try {
				await this.removeClaim(claimId);
				removed++;
			} catch (error) {
				console.warn(logTag, `Problem removing claim ${claimId}.`, error);
			}
			// progress
			if (removed && removed%progressStep === 0) {
				console.log(logTag, `Removed ${removed} of ${count}.`);
			}
		}
		return removed;
	}

	/**
	 * Get claim ids.
	 * 
	 * @param {String} entityId Q-ID from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 * @param {Function} valueMatcher A value matcher `(value, claim) => value === 'Q123'`.
	 * @returns {Array} of claim.id.
	 */
	async getClaimIds(entityId, propertyId, valueMatcher) {
		const claims = await this.getClaims(entityId, propertyId);
		const ids = [];
		if (!Array.isArray(claims)) {
			return ids;
		}
		for (const claim of claims) {
			if (typeof valueMatcher === 'function') {
				const value = this.getClaimValue(claim);
				if (!valueMatcher(value, claim)) {
					continue;
				}
			}
			const claimId = claim.id;
			ids.push(claimId);
		}
		return ids;
	}
	
	/** @private */
	getClaimValue(claim) {
		const data = claim?.mainsnak?.datavalue;
		if (!data) {
			return '';
		}
		if (data.type === 'wikibase-entityid') {
			return data.value.id;	// Q123
		}
		if ('value' in data) {
			return data.value;	// e.g. string
		}
		return data;
	}

	/**
	 * Get information about a Wikidata entity.
	 * 
	 * @param {string} entityId Q-ID of the entity to retrieve information for.
	 * @returns Entity object that should contain claims (props).
	 */
	async getEntity(entityId) {
		const response = await this.apiCall(false, {
			action: 'wbgetentities',
			ids: entityId,
		});
		
		return response.entities[entityId];

	}

	/**
	 * Remove a claim from a Wikidata entity.
	 * 
	 * @private
	 * @param {string} claimId ID of the claim to be removed.
	 * @returns Resolves with a server response if removed.
	 */
	async removeClaim(claimId) {
		const response = await this.apiCall(true, {
			action: 'wbremoveclaims',
			claim: claimId,
		});
		return response;
	}

	/** @private */
	async apiCall(isEdit, params) {
		const action = params.action ?? false;

		const startTime = performance.now();
		const asyncOp = () => this.apiWrapper(isEdit, action, params);
		let re = await this.retry(asyncOp);

		if (this.elapsedDebug.apiCall) {
			const elapsed = formatTime(startTime, performance.now());
			console.log(`Elapsed time action:${action}: ${elapsed}.`);
		}

		return re;
	}

	/**
	 * Retry async operation.
	 * @private
	 * 
	 * Note! Assumes retry is possible when `asyncOp` rejects with `errorInfo.code === 'failed-save'`
	 * 
	 * @param {Function} asyncOp 
	 * @param {Number} retryCount Number of tries.
	 * @param {Number} retryDelay Next try [ms]
	 */
	async retry(asyncOp, retryCount=10, retryDelay=15000) {
		let re;

		let done = false;
		do {
			try {
				re = await asyncOp();
				done = true;
			} catch (errorInfo) {
				if (errorInfo.code === 'failed-save') {
					retryCount--;
					if (retryCount > 0) {
						await new Promise((resolve) => setTimeout(resolve, retryDelay));
					} else {
						done = true;
					}
				} else {
					done = true;
				}
			}
		} while (!done);

		return re;
	}

	/** @private */
	apiWrapper(isEdit, action, params) {
		return new Promise((resolve, reject) => {
			let request;
			if (!isEdit) {
				request = this.bot.request(params);
			} else {
				const editParams = { ...params, token: this.bot.csrfToken };
				request = this.bot.request(editParams);
			}
			request
				.then((response) => {
					// should have .success = 1
					if (response.success) {
						resolve(response);
					} else {
						const errorInfo = {
							code: -1,
							info: 'NN, success!=1',
							params: params,
						};
						console.warn(logTag, `Request was not successful (${action}).`, errorInfo);
						reject(errorInfo);
					}
				})
				.catch((re) => {
					const errorInfo = {
						code: re?.code,
						info: re?.info,
						params: params,
						message: re?.message,
						docref: re?.docref,
					};
					if (errorInfo.code === 'failed-save') {
						console.warn(logTag, `Failed to save (${action}). Should retry in less then a minute.`);
					} else {
						console.error(logTag, `Request failed (${action}).`, errorInfo);
					}
					// console.error(logTag, JSON.stringify(errorInfo, null, '\t'));
					reject(errorInfo);
				})
			;
		});
	}
}

export default WikidataBot;
