# Wikidata performance

Scenario base:
Standard account, use mwn, get entinty and remove a single value.

## One-by-one

Running on by one is rather slow: about 600ms per record.
<blockquote>
Done. Removed at least one value from 19 of 20 entities (total values 19).
Skipped 1: (1) ['Q30067298']

Elapsed time for massRemoveValue: 0:12.573 [m:s.ms] (per Q: 0:00.628 [m:s.ms]).
</blockquote>

## Batches

Running in batches is significantly faster:
<blockquote>
Done all 4 chunks.
Elapsed time for massRemoveValue-batches: 0:03.566 [m:s.ms] (per Q: 0:00.178 [m:s.ms]).
</blockquote>

And a single batch is about the same as if no other batch is running:
<blockquote>
Done. Removed at least one value from 5 of 5 entities (total values 5).
WikidataApiHandler.js:78
Elapsed time for massRemoveValue: 0:03.562 [m:s.ms] (per Q: 0:00.712 [m:s.ms]).
</blockquote>
