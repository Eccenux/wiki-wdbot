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

### Base variant
Running in batches is significantly faster:
<blockquote>
Done all 4 chunks.
Elapsed time for massRemoveValue-batches: 0:03.566 [m:s.ms] (per Q: 0:00.178 [m:s.ms]).
</blockquote>

And a single batch is about the same as if no other batch is running:
<blockquote>
Done. Removed at least one value from 5 of 5 entities (total values 5).
Elapsed time for massRemoveValue: 0:03.562 [m:s.ms] (per Q: 0:00.712 [m:s.ms]).
</blockquote>

### Re-run (empty edit)
Re-runnig same list is extremely fast. So seems like removal api call takes the most time.
<blockquote>
Done all 4 chunks (total items: 20).
Elapsed time for massRemoveValue-batches: 0:01.155 [m:s.ms] (per Q: 0:00.057 [m:s.ms]).
</blockquote>

### More batches

* 4 chunks: 0:03.566 [m:s.ms] (per Q: 0:00.178 [m:s.ms]). 20 items.
* 5 chunks: 0:03.236 [m:s.ms] (per Q: 0:00.161 [m:s.ms]). 20 items.
* 6 chunks: 0:04.943 [m:s.ms] (per Q: 0:00.126 [m:s.ms]). 40 items.
