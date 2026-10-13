/* eslint-disable require-unicode-regexp -- Every literal below pins one specific flag combination on purpose. `u` and `v` are mutually exclusive, and the whole point of these fixtures is to prove the clone copies the flags it was given rather than normalising them. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import cloneRegexp from './index.js';

test('clone and modify RegExp', () => {
	assert.equal(cloneRegexp(/a/, {multiline: true}).toString(), '/a/m');
	assert.equal(cloneRegexp(/a/gi, {source: 'b', global: false}).toString(), '/b/i');
	assert.equal(cloneRegexp(/a/, {
		source: 'b',
		global: true,
		ignoreCase: true,
		multiline: true,
	}).toString(), '/b/gim');
});

test('an empty source replaces the pattern', () => {
	assert.equal(cloneRegexp(/abc/g, {source: ''}).toString(), '/(?:)/g');
});

test('throws on a non-RegExp', () => {
	assert.throws(() => cloneRegexp('unicorn'), {message: 'Expected a RegExp instance'});
});

test('rejects objects that imitate a RegExp tag', () => {
	const regexp = {
		[Symbol.toStringTag]: 'RegExp',
		source: 'unicorn',
		global: true,
		lastIndex: 2,
	};

	assert.throws(() => cloneRegexp(regexp), {
		name: 'TypeError',
		message: 'Expected a RegExp instance',
	});
});

test('clones RegExp instances with a custom tag', () => {
	class TaggedRegExp extends RegExp {
		get [Symbol.toStringTag]() {
			return 'TaggedRegExp';
		}
	}

	const original = new TaggedRegExp('unicorn', 'gi');
	original.lastIndex = 2;
	const clone = cloneRegexp(original);

	assert.equal(clone.source, original.source);
	assert.equal(clone.flags, original.flags);
	assert.equal(clone.lastIndex, 2);
	assert.notEqual(clone, original);
	assert.equal(Object.getPrototypeOf(clone), RegExp.prototype);
});

test('clones tagged RegExp instances from another realm', () => {
	const original = vm.runInNewContext('Object.assign(/unicorn/gi, {[Symbol.toStringTag]: "ForeignRegExp", lastIndex: 3})');
	const clone = cloneRegexp(original, {global: false});

	assert.equal(clone.source, 'unicorn');
	assert.equal(clone.flags, 'i');
	assert.equal(clone.lastIndex, 3);
	assert.equal(Object.getPrototypeOf(clone), RegExp.prototype);
});

test('rejects invalid inputs without reading their tags or patterns', () => {
	const invalidInputs = [undefined, null, true, 1, 1n, Symbol('regexp'), {}, [], RegExp.prototype, Object.create(RegExp.prototype)];
	const unreadable = {
		get [Symbol.toStringTag]() {
			throw new Error('Validation must not read Symbol.toStringTag');
		},
		get source() {
			throw new Error('Validation must not read source');
		},
	};

	for (const input of [...invalidInputs, unreadable]) {
		// eslint-disable-next-line node-test/no-conditional-assertion -- Every entry in this nonempty fixture list must be rejected.
		assert.throws(() => cloneRegexp(input), {
			name: 'TypeError',
			message: 'Expected a RegExp instance',
		});
	}
});

test('lastIndex is copied by default', () => {
	const duckRegex = /duck/g;

	// Mutate duckRe by running 'test'
	duckRegex.test('duck duck goose');

	const clonedDuckRegex = cloneRegexp(duckRegex);

	assert.equal(clonedDuckRegex.lastIndex, duckRegex.lastIndex);
});

test('lastIndex can be configured via the options object', () => {
	const duckRegex = /duck/g;

	// Mutate duckRe by running 'test'
	duckRegex.test('duck duck goose');

	const clonedDuckRegex = cloneRegexp(duckRegex, {lastIndex: 0});

	assert.equal(clonedDuckRegex.lastIndex, 0);
});

test('clone is a distinct instance', () => {
	const original = /unicorn/g;

	assert.notEqual(cloneRegexp(original), original);
});

const subject = 'a\nc\nunicorn\nUnicorn\nduck\nDUCK 123 é 🦄';

// One literal per flag and per meaningful combination. The flags comparison below covers all
// eight flags; this table adds matching behaviour on top. Every literal has to match the
// subject or it would assert nothing:
// - `i` on `/[a-z]/gi` reaches the uppercase letters that `/[a-z]/g` never sees.
// - `m` on `/^Unicorn$/m` only matches because the anchor may sit on an inner line.
// - `s` on `/unicorn.Unicorn/s` only matches because `.` may cross the newline.
// - `u` and `v` are mutually exclusive, so each needs a property escape and its own entry.
// - `d` surfaces as `match.indices` on `/^a.c$/dgimsuy`.
// - `/\b/g` is here for the zero-length match path, and `/(?<animal>duck)/g` for `match.groups`.
// - `y` is the one flag this table cannot discriminate. A sticky regexp that matches at
//   `lastIndex` 0 scans identically with or without `y`, and the vacuity guard in
//   `clone behaves the same as the original` rules out the sticky fixtures that would not.
//   `y` is covered by the flags comparison instead.
const regexps = [
	/unicorn/,
	/unicorn/g,
	/[a-z]/g,
	/[a-z]/gi,
	/a/y,
	/a/gy,
	/duck/,
	/duck/g,
	/^Unicorn$/m,
	/^Unicorn$/gm,
	/unicorn.Unicorn/s,
	/^a.c$/ms,
	/^a.c$/dgimsuy,
	/\p{Letter}+/u,
	/\p{Letter}+/uy,
	/é/u,
	/[\p{Letter}&&\p{ASCII}]/v,
	/\p{RGI_Emoji}/v,
	/(?<animal>duck)/g,
	/\b/g,
];

// Scan the given RegExp and record what a caller could observe. This runs on the clone itself
// rather than on a rebuild from its source and flags, so a clone that does not actually match
// what the original matches shows up here.
const scan = regexp => {
	regexp.lastIndex = 0;
	const results = [];

	for (let match = regexp.exec(subject); match !== null; match = regexp.exec(subject)) {
		results.push([match[0], match.index, match.groups, match.indices?.[0]]);

		if (match[0] === '') {
			regexp.lastIndex++;
		}

		// Only a global or sticky regexp advances its own cursor. Anything else would loop forever.
		if (!regexp.global && !regexp.sticky) {
			break;
		}
	}

	return results;
};

test('clone preserves source and flags', () => {
	assert.deepEqual(
		regexps.map(regexp => {
			const clone = cloneRegexp(regexp);
			return [clone.source, clone.flags];
		}),
		regexps.map(regexp => [regexp.source, regexp.flags]),
	);
});

test('clone behaves the same as the original', () => {
	const clones = regexps.map(regexp => cloneRegexp(regexp));
	const originalResults = regexps.map(regexp => scan(regexp));
	const cloneResults = clones.map(regexp => scan(regexp));

	// Guard against a vacuous pass: a fixture that matches nothing would make both sides equal.
	assert.equal(cloneResults.filter(results => results.length > 0).length, regexps.length);

	assert.deepEqual(cloneResults, originalResults);
});

test('hasIndices is preserved', () => {
	const clone = cloneRegexp(/a/d);

	assert.equal(clone.flags, 'd');
	assert.deepEqual([...clone.exec('a').indices], [[0, 1]]);
});

test('hasIndices can be turned on and off via the options object', () => {
	assert.equal(cloneRegexp(/a/d, {hasIndices: false}).flags, '');
	assert.equal(cloneRegexp(/a/, {hasIndices: true}).flags, 'd');
	assert.equal(cloneRegexp(/a/d, {hasIndices: true}).flags, 'd');
});

test('unicodeSets is preserved and keeps its meaning', () => {
	const original = /\p{RGI_Emoji}/v;
	const clone = cloneRegexp(original);

	assert.equal(clone.flags, 'v');
	assert.equal(clone.source, original.source);
	assert.ok(clone.test('🦄'));
	assert.ok(!clone.test('p{RGI_Emoji}'));
});

// `v` is not a drop-in replacement for `u`: under `v` a character class is a set operation
// language, so the same source can be valid with the flag and a hard SyntaxError without it.
// Without `v` the parser falls back to the Annex B rules, where `--` is read as a character
// range. This is why the clone must never force the flag onto a source the caller wrote.
const setOperation = String.raw`[\p{Number}--[0-9]]`;

test('unicodeSets is passed through untouched, whatever the source', () => {
	assert.equal(cloneRegexp(/a/, {source: setOperation, unicodeSets: true}).toString(), `/${setOperation}/v`);
	assert.throws(() => cloneRegexp(/a/, {source: setOperation, unicodeSets: false}), SyntaxError);
});

test('unicodeSets can be turned off via the options object', () => {
	assert.equal(cloneRegexp(/\p{RGI_Emoji}/v, {unicodeSets: false}).flags, '');
});

test('unicode and unicodeSets cannot both be on', () => {
	assert.throws(() => cloneRegexp(/a/u, {unicodeSets: true}), SyntaxError);
	assert.throws(() => cloneRegexp(/a/v, {unicode: true}), SyntaxError);
});

const flagCharacters = [...'dgimsuvy'];
const flagCombinations = Array.from({length: 2 ** flagCharacters.length}, (_, mask) => flagCharacters.filter((character, index) => Math.floor(mask / (2 ** index)) % 2 === 1).join(''))
	.filter(flags => !(flags.includes('u') && flags.includes('v')));

test('preserves every valid flag combination', () => {
	const originals = flagCombinations.map(flags => new RegExp('a', flags));

	assert.equal(originals.length, 192);
	assert.deepEqual(originals.map(regexp => cloneRegexp(regexp).flags), flagCombinations);
});

for (const [property, character] of Object.entries({
	hasIndices: 'd', global: 'g', ignoreCase: 'i', multiline: 'm', dotAll: 's', unicode: 'u', unicodeSets: 'v', sticky: 'y',
})) {
	test(`${property} can be enabled, disabled, or inherited`, () => {
		const originals = flagCombinations.map(flags => new RegExp('a', flags));
		const compatible = originals.filter(regexp => !(character === 'u' && regexp.unicodeSets) && !(character === 'v' && regexp.unicode));

		assert.deepEqual(compatible.map(regexp => cloneRegexp(regexp, {[property]: true}).flags), compatible.map(regexp => new RegExp('a', regexp.flags.replace(character, '') + character).flags));
		assert.deepEqual(originals.map(regexp => cloneRegexp(regexp, {[property]: false}).flags), flagCombinations.map(flags => flags.replace(character, '')));
		assert.deepEqual(originals.map(regexp => cloneRegexp(regexp, {[property]: undefined}).flags), flagCombinations);
		assert.deepEqual(originals.map(regexp => regexp.flags), flagCombinations);
	});
}

test('switches Unicode modes when the previous mode is explicitly disabled', () => {
	assert.equal(cloneRegexp(/a/u, {unicode: false, unicodeSets: true}).flags, 'v');
	assert.equal(cloneRegexp(/a/v, {unicodeSets: false, unicode: true}).flags, 'u');
});

test('global and sticky clones advance their own cursors independently', () => {
	const original = /duck/g;
	original.exec('duck duck');
	const clone = cloneRegexp(original);

	assert.equal(clone.lastIndex, 4);
	assert.equal(clone.exec('duck duck').index, 5);
	assert.equal(clone.lastIndex, 9);
	assert.equal(original.lastIndex, 4);
	assert.equal(original.exec('duck duck').index, 5);

	const sticky = cloneRegexp(original, {global: false, sticky: true, lastIndex: 4});
	assert.equal(sticky.exec('duck duck'), null);
	assert.equal(sticky.lastIndex, 0);
	sticky.lastIndex = 5;
	assert.equal(sticky.exec('duck duck').index, 5);
	assert.equal(sticky.lastIndex, 9);
	assert.equal(original.lastIndex, 9);
});

test('preserves exact numeric lastIndex values and honors overrides', () => {
	const values = [0, -0, -1, 1.5, Number.MAX_SAFE_INTEGER, Infinity, -Infinity, NaN];
	const original = /a/g;

	assert.deepEqual(values.map(lastIndex => {
		original.lastIndex = lastIndex;
		return cloneRegexp(original).lastIndex;
	}), values);
	assert.deepEqual(values.map(lastIndex => cloneRegexp(original, {lastIndex}).lastIndex), values);
});

test('preserves named capture groups and their indices', () => {
	const original = /(?<animal>duck) (?<other>goose)/dg;
	const clone = cloneRegexp(original);
	const match = clone.exec('a duck goose');

	assert.deepEqual({...match.groups}, {animal: 'duck', other: 'goose'});
	assert.deepEqual({...match.indices.groups}, {animal: [2, 6], other: [7, 12]});
	assert.equal(clone.lastIndex, 12);
	assert.equal(original.lastIndex, 0);
});

test('preserves escaped sources and matching behavior', () => {
	const fixtures = [
		['', 'text'],
		['/', 'a/b'],
		['\n', 'a\nb'],
		['\r', 'a\rb'],
		['\u{2028}', 'a\u{2028}b'],
		['\u{2029}', 'a\u{2029}b'],
		[String.raw`\\`, String.raw`a\b`],
		['(?<=duck )goose', 'duck goose'],
	];
	const originals = fixtures.map(([source]) => new RegExp(source, 'dg'));
	const clones = originals.map(regexp => cloneRegexp(regexp));
	const matches = originals.map((regexp, index) => regexp.exec(fixtures[index][1]));

	assert.ok(matches.every(match => match !== null));
	assert.deepEqual(clones.map(regexp => regexp.source), originals.map(regexp => regexp.source));
	assert.deepEqual(clones.map((regexp, index) => regexp.exec(fixtures[index][1])), matches);
});

test('does not mutate frozen inputs or options', () => {
	const original = /duck/gi;
	original.lastIndex = 4;
	Object.freeze(original);
	const options = Object.freeze({source: 'goose', global: false, lastIndex: 0});
	const clone = cloneRegexp(original, options);

	assert.equal(clone.source, 'goose');
	assert.equal(clone.flags, 'i');
	assert.equal(clone.lastIndex, 0);
	assert.equal(original.source, 'duck');
	assert.equal(original.flags, 'gi');
	assert.equal(original.lastIndex, 4);
});

test('invalid patterns throw without changing the original', () => {
	const original = /duck/g;
	original.lastIndex = 4;

	assert.throws(() => cloneRegexp(original, {source: '('}), SyntaxError);
	assert.equal(original.source, 'duck');
	assert.equal(original.flags, 'g');
	assert.equal(original.lastIndex, 4);
});
