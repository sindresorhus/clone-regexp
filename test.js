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
