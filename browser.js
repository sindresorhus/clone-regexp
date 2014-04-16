!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.cloneRegexp=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var flagMap = {
	global: 'g',
	ignoreCase: 'i',
	multiline: 'm'
};

function isRegExp (o) {
  return 'object' == typeof o
      && '[object RegExp]' == toString.call(o);
}

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

},{}]},{},[1])
(1)
});