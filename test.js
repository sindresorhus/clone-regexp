import test from 'ava';
import cloneRegexp from './index.js';

test('clone and modify RegExp', t => {
	t.is(cloneRegexp(/a/, {multiline: true}).toString(), '/a/m');
	t.is(cloneRegexp(/a/gi, {source: 'b', global: false}).toString(), '/b/i');
	t.is(cloneRegexp(/a/, {
		source: 'b',
		global: true,
		ignoreCase: true,
		multiline: true
	}).toString(), '/b/gim');
});

test('lastIndex is copied by default', t => {
	const duckRegex = /duck/g;

	// Mutate duckRe by running 'test'
	duckRegex.test('duck duck goose');

	const clonedDuckRegex = cloneRegexp(duckRegex);

	t.is(clonedDuckRegex.lastIndex, duckRegex.lastIndex);
});

test('lastIndex can be configured via the options object', t => {
	const duckRegex = /duck/g;

	// Mutate duckRe by running 'test'
	duckRegex.test('duck duck goose');

	const clonedDuckRegex = cloneRegexp(duckRegex, {lastIndex: 0});

	t.is(clonedDuckRegex.lastIndex, 0);
});
