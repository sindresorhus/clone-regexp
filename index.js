const globalGetter = Object.getOwnPropertyDescriptor(RegExp.prototype, 'global').get;

function isRegexp(value) {
	try {
		// The native getter checks the RegExp brand without trusting Symbol.toStringTag or executing the pattern.
		return typeof globalGetter.call(value) === 'boolean';
	} catch {
		return false;
	}
}

// Every flag a RegExp can carry. `RegExp.prototype.flags` emits them in spec order regardless of
// the order they were given in, so the key order here is for readability, not correctness.
const flagEntries = Object.entries({
	hasIndices: 'd',
	global: 'g',
	ignoreCase: 'i',
	multiline: 'm',
	dotAll: 's',
	unicode: 'u',
	unicodeSets: 'v',
	sticky: 'y',
});

export default function clonedRegexp(regexp, options = {}) {
	if (!isRegexp(regexp)) {
		throw new TypeError('Expected a RegExp instance');
	}

	const flags = flagEntries.map(([property, character]) => (
		(typeof options[property] === 'boolean' ? options[property] : regexp[property]) ? character : ''
	)).join('');

	const clone = new RegExp(options.source ?? regexp.source, flags);

	clone.lastIndex = typeof options.lastIndex === 'number'
		? options.lastIndex
		: regexp.lastIndex;

	return clone;
}
