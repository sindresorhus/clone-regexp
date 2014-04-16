'use strict';
var assert = require('assert');
var cloneRegexp = require('./index');

it('should clone and modify RegExp', function () {
	assert.strictEqual(cloneRegexp(/a/, {multiline: true}).toString(), '/a/m');
	assert.strictEqual(cloneRegexp(/a/gi, {source: 'b', global: false}).toString(), '/b/i');
	assert.strictEqual(cloneRegexp(/a/, {
		source: 'b',
		global: true,
		ignoreCase: true,
		multiline: true
	}).toString(), '/b/gim');
});
