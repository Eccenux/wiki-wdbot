/**
 * Format time as ms.
 * @param {Number} startTime performance.now()
 * @param {Number} endTime 
 * @returns 
 */
export function formatTime(startTime, endTime, perNum) {
	let elapsedMs = endTime - startTime;

	if (typeof perNum === 'number') {
		elapsedMs /= perNum;
	}

	const ms = Math.floor(elapsedMs % 1000);
	let elapsedS = Math.floor((elapsedMs - ms) / 1000);
	const minutes = Math.floor(elapsedS / 60);
	let seconds = (elapsedS - minutes * 60);
	seconds = (''+seconds).padStart(2, '0');

	return `${minutes}:${seconds}.${(''+ms).padStart(3, '0')} [m:s.ms]`;
}

/** Split list to chunks running `op`. */
export function splitList(list, chunkSize, op) {
	for (let i = 0; i < list.length; i += chunkSize) {
		const chunk = list.slice(i, i + chunkSize);
		op(chunk);
	}
}

/**
 * Run async operation in batches.
 * 
 * @param {Array} qList Some items.
 * @param {Function} asyncOp Async functtion. E.g. (chunk) => new Promise.resolved();
 * @param {Number} maxBatches Maximum number of batches.
 */
export async function runInBatches(qList, asyncOp, name='op', maxBatches=4) {
	const startTime = performance.now();

	let promises = [];
	let chunkSize = Math.ceil(qList.length / maxBatches);
	let chunkCount = 0;
	splitList(qList, chunkSize, (chunk) => {
		let re = asyncOp(chunk);
		promises.push(re);
		chunkCount++;
	});
	await Promise.allSettled(promises);
	console.log('Done all %d chunks (total items: %d).', chunkCount, qList.length);

	const elapsed = formatTime(startTime, performance.now());
	const elapsedPerRecord = formatTime(startTime, performance.now(), qList.length);
	console.log(`Elapsed time for ${name}: ${elapsed} (per Q: ${elapsedPerRecord}).`);
}
