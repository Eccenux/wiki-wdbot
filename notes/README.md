# Notes

## ToC
* `notes\wdApi.notes.js` -- basic API notes for "wbgetentities", "wbremoveclaims", "wbcreateclaim".
* `notes\entity-re.json` -- dump of a random entity with all the claims and snaks and stuff...
* [notes\performance.md](notes\performance.md) -- notes on performance of mass-read and mass-remove of claims.

There is also batches info, ~temp in: `notes\mass-zabytki-w-Polsce`.

## wikibase-sdk/docs

Seems to be a read-only framework, but has interesting simplifications... Would be more interesting if the results could actually be inserted into the API...

https://github.com/maxlath/wikibase-sdk/blob/main/docs/simplify_claims.md

```js
// base
res = wbk.simplify.claims(entity.claims)
res = {
	"P279": [ "Q340169", "Q2342494", "Q386724" ]
	// ...
};

// qualifiers
res = wbk.simplify.claims(entity.claims, { keepQualifiers: true })
res = {
	"P50": [
		{
		"value": "Q5111731",
		"qualifiers": { "P1545": ["17"], "P1416": ["Q1341845"]}
		},
		// ...
	]
}

// refs
res = wbk.simplify.claims(entity.claims, { keepReferences: true })
res = {
  "P50": [
    {
      "value": "Q5111731",
      "references": [
        { "P854": [ "https://zuper.trustable/source" ], "P143": [ "Q191769" ] }
        { "P248": [ "Q54919" ], "P813": [ "2015-08-02T00:00:00.000Z" ] }
      ]
    },
  ]
}
```