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
	.trim()
	.split('\n')
	.filter(v => v.startsWith('Q'))
	.map(v => v.replace(/^(Q[0-9]+).+/g, '$1'))
;
console.log(qList.length, qList);

/**
//
// Mass-remove a property
var wikidataApi = new WikidataApiHandler();
var propertyId = 'P625';
wikidataApi.massRemoveProp(qList, propertyId);
/**/
