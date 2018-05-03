import test from 'ava';
import m from '.';

test('clone and modify RegExp', t => {
	t.is(m(/a/, {multiline: true}).toString(), '/a/m');
	t.is(m(/a/gi, {source: 'b', global: false}).toString(), '/b/i');
	t.is(m(/a/, {
		source: 'b',
		global: true,
		ignoreCase: true,
		multiline: true
	}).toString(), '/b/gim');
});

test('lastIndex is copied by default', t => {
	const duckRe = /duck/g;

	// Mutate duckRe by running 'test'
	duckRe.test('duck duck goose');

	const clonedDuckRe = m(duckRe);

	t.is(clonedDuckRe.lastIndex, duckRe.lastIndex);
});

test('lastIndex can be configured via the options object', t => {
	const duckRe = /duck/g;

	// Mutate duckRe by running 'test'
	duckRe.test('duck duck goose');

	const clonedDuckRe = m(duckRe, {lastIndex: 0});

	t.is(clonedDuckRe.lastIndex, 0);
});
