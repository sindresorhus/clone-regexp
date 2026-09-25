import {expectTypeOf} from 'nz';
import cloneRegexp from './index.js';

// eslint-disable-next-line require-unicode-regexp -- The flags are irrelevant to a type assertion. Adding one would only constrain the `tsd` target for no gain.
const regex = /[a-z]/gi;

expectTypeOf(cloneRegexp(regex)).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {source: 'unicorn'})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {hasIndices: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {global: false})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {ignoreCase: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {multiline: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {dotAll: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {sticky: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {unicode: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {unicodeSets: true})).toBe<RegExp>();
expectTypeOf(cloneRegexp(regex, {lastIndex: 1})).toBe<RegExp>();
