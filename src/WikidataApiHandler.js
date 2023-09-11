/* global mw */
(function () {
	
const logTag = '[MassWdOps]';

/**
 * Wikidata entity operations.
 */
class WikidataApiHandler {
	/**
	 * Create a new instance.
	 */
	constructor() {
		this.api = new mw.Api();
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
	 * Remove property.
	 * @param {string} entityId Q-ID from which to remove all(!) values of propertyId.
	 * @param {String} propertyId Property id (e.g. P625)
	 */
	async removeProp(entityId, propertyId) {
		let entity;
		try {
			entity = await this.getEntity(entityId);
		} catch (error) {
			console.warn(logTag, `Entity ${entityId} not found?`, error);
			return false;
		}
		if (!entity.claims || typeof entity.claims[propertyId] !== 'object') {
			console.log(logTag, `Property ${propertyId} not found in ${entityId}.`);
			return true;
		}
		try {
			const claims = entity.claims[propertyId];
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
	 * Get information about a Wikidata entity.
	 * 
	 * @private
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
			this.api.postWithToken('csrf', params)
				.done(function (response) {
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
				.fail(function (re, r2) {
					//debugger;
					const errorInfo = {
						code: r2?.error?.code,
						info: r2?.error?.info,
						warn: JSON.stringify(r2?.warnings),
						params: params,
					};
					console.error(logTag, `Request failed (${action}).`, errorInfo);
					reject(errorInfo);
				})
			;
		});
	}
}

// export default WikidataApiHandler;
window.WikidataApiHandler = WikidataApiHandler;

})();
