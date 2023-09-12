// eslint-disable-next-line no-unused-vars
import { mwn } from "mwn";

const logTag = '[MassWdOps]';

/**
 * Wikidata entity operations.
 */
class WikidataApiHandler {
	/**
	 * Create a new instance.
	 * 
	 * @param {mwn} bot 
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Mass-remove a property.
	 * 
	 * @param {Array} qList List of Qs from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 */
	async massRemoveProp(qList, propertyId) {
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
	}

	/**
	 * Mass-remove a value of a property.
	 * 
	 * @param {Array} qList List of Qs from which to remove matching values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 */
	async massRemoveValue(qList, propertyId, valueMatcher) {
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
			const value = this.getClaimValue(claim);
			if (!valueMatcher(value, claim)) {
				continue;
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
		const response = await this.apiCall({
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
		const response = await this.apiCall({
			action: 'wbremoveclaims',
			claim: claimId,
		});
		return response;
	}

	/** @private */
	apiCall(params) {
		const action = params.action ?? false;
		return new Promise((resolve, reject) => {
			this.bot.request(params)
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
						message: re?.message,
						docref: re?.docref,
						params: params,
					};
					console.error(logTag, `Request failed (${action}).`, errorInfo);
					console.error(logTag, JSON.stringify(errorInfo, null, '\t'));
					reject(errorInfo);
				})
			;
		});
	}
}

export default WikidataApiHandler;
