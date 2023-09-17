WdBot
==========================

WdBot or WikidataBot is mostly a tool for removing values from entities.
It was battle tested with large batches and NPM releases should be stable.

With WdBot you can read many entites (Q) in paralel. This is mostly limited by your PC and network.

Removal of properties (P) is an edit operation and is limited to about 90 per minute.
This is a server side limit, but your account might have different limits.

## License

MIT License.
Author: Maciej Nux.

## Exports

main.js:
```js
export {
	utils,
	WikiBotLite,
	WikidataBot
};
```

## Usage

For bot configuration setup see setup for [WikiployLite](https://github.com/Eccenux/Wikiploy).

You can consider runBot.js as a usage example, but don't run it directly.

Note! WdBot is fast. Make sure you check your batch on a smaller example.
Unlike QuickStatements, WdBot does not have a revert feature.
