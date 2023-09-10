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
	 * Remove property.
	 * @param {string} entityId Q-ID of the entity to retrieve information for.
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
			const claimId = entity.claims[propertyId].id;
			await this.removeClaim(claimId);
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
		
		return response.entieties[entityId];

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
