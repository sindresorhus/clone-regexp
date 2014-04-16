'use strict';

var flagMap = {
	global: 'g',
	ignoreCase: 'i',
	multiline: 'm'
};

function isRegexp(re) {
	return Object.prototype.toString.call(re) === '[object RegExp]';
}

function flagSupported(flag) {
	var supported = true;

	try {
		new RegExp('', flag);
	} catch (err) {
		supported = false;
	}

	return supported;
}

if (flagSupported('y')) {
	flagMap.sticky = 'y';
}

if (flagSupported('u')) {
	flagMap.unicode = 'u';
}

module.exports = function (re, opts) {
	if (!isRegexp(re)) {
		throw new TypeError('Expected a RegExp instance');
	}

	opts = opts || {};

	var flags = Object.keys(flagMap).map(function (el) {
		return (typeof opts[el] === 'boolean' ? opts[el] : re[el]) ? flagMap[el] : '';
	}).join('');

	return new RegExp(opts.source || re.source, flags);
};
