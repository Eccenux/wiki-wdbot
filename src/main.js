// Test
var wikidataApi = new WikidataApiHandler();
var entityId = 'Q30159570';
var propertyId = 'P625';

await wikidataApi.removeProp(entityId, propertyId);
