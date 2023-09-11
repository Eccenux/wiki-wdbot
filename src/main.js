/* global WikidataApiHandler */
// Test
/**
var wikidataApi = new WikidataApiHandler();
var entityId = 'Q30159570';
var propertyId = 'P625';

await wikidataApi.removeProp(entityId, propertyId);
/**/

//
// Q-list from quick statements
var input = document.querySelector('textarea');
var qList = input.value
	.replace(/[\r\n]+/g, '\n')
	.split('\n')
	.map(v => v.replace(/^(Q[0-9]+).+/g, '$1'))
;

//
// Mass-remove a property
var wikidataApi = new WikidataApiHandler();
var propertyId = 'P625';
run(qList);
async function run(qList) {
	console.log(`Running %d removals of ${propertyId}.`, qList.length);
	let removed = 0;
	for (const entityId of qList) {
		let ok = await wikidataApi.removeProp(entityId, propertyId);
		if (ok) {
			console.log(`Removed from ${entityId}`);
			removed++;
		}
	}
	console.log(`Done. Removed %d of %d of ${propertyId}.`, removed, qList.length);
}