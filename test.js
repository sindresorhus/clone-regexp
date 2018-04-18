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

test('lastIndex is copied', t => {
	const duckRe = /duck/g;

	// Mutate duckRe by running 'test'
	duckRe.test('duck duck goose');

	const clonedDuckRe = m(duckRe);

	t.is(duckRe.lastIndex, clonedDuckRe.lastIndex);
});
