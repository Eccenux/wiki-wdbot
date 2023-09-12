/* global describe, it */
import { assert } from 'chai';
import { formatTime } from '../src/utils.js';

describe('utils', function () {

	describe('formatTime', function () {
		let startTime = performance.now();
		let endTimeGen = (elapsedMs) => startTime + elapsedMs;
		// test stability helper
		function formatTimeEl(elapsedMs, perNum) {
			let formated = formatTime(startTime, endTimeGen(elapsedMs), perNum);
			let trimmed = formated.replace(/\s*\[.+\].*/, '');
			return trimmed;
		}
		it('should format ms', async function () {
			assert.equal(  formatTimeEl(3), '0:00.003');
			assert.equal( formatTimeEl(23), '0:00.023');
			assert.equal(formatTimeEl(123), '0:00.123');
		});
		it('should format seconds', async function () {
			assert.equal( formatTimeEl(1700), '0:01.700');
			assert.equal( formatTimeEl(7000), '0:07.000');
			assert.equal(formatTimeEl(21700), '0:21.700');
		});
		it('should format min:ss', async function () {
			assert.equal(formatTimeEl(60*1000), '1:00.000');
			assert.equal(formatTimeEl(60*1000 + 1), '1:00.001');
			assert.equal(formatTimeEl((2*60)*1000 + 1), '2:00.001');
			assert.equal(formatTimeEl((5*60 + 3)*1000 + 4), '5:03.004');
		});
		it('should format with perNum', async function () {
			assert.equal(formatTimeEl((2*60)*1000, 2), '1:00.000');
			assert.equal(formatTimeEl((2*60)*1000, 4), '0:30.000');
			assert.equal(formatTimeEl((2*60)*1000, 8), '0:15.000');
			assert.equal(formatTimeEl((2*60)*1000, 16),'0:07.500');
		});
	});
});
