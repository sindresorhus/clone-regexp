import {expectType} from 'tsd';
import cloneRegexp from './index.js';

const regex = /[a-z]/gi;

expectType<RegExp>(cloneRegexp(regex));
expectType<RegExp>(cloneRegexp(regex, {source: 'unicorn'}));
expectType<RegExp>(cloneRegexp(regex, {global: false}));
expectType<RegExp>(cloneRegexp(regex, {ignoreCase: true}));
expectType<RegExp>(cloneRegexp(regex, {multiline: true}));
expectType<RegExp>(cloneRegexp(regex, {dotAll: true}));
expectType<RegExp>(cloneRegexp(regex, {sticky: true}));
expectType<RegExp>(cloneRegexp(regex, {unicode: true}));
expectType<RegExp>(cloneRegexp(regex, {lastIndex: 1}));
