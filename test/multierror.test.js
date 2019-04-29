'use strict';

const assert = require('chai').assert;
const { cleanStack } = require('./utils');

const { MultiError, errorFromList, errorForEach } = require('../lib/verror');

describe('multierror', function() {
    const err1 = new Error('error one');
    const err2 = new Error('error two');
    const err3 = new Error('error three');
    let merr, stack, accum;

    it('should support MultiError', function() {
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');

        assert.throws(function() {
            console.error(new MultiError());
        }, /list of errors \(array\) is required/);

        assert.throws(function() {
            console.error(new MultiError([]));
        }, /must be at least one error/);

        merr = new MultiError([err1, err2, err3]);
        assert.equal(err1, merr.cause());
        assert.equal(merr.message, 'first of 3 errors: error one');
        assert.equal(merr.name, 'MultiError');
        stack = cleanStack(merr.stack);
        assert.equal(
            stack,
            [
                'MultiError: first of 3 errors: error one',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );

        merr = new MultiError([err1]);
        assert.equal(merr.message, 'first of 1 error: error one');
        assert.equal(merr.name, 'MultiError');
        stack = cleanStack(merr.stack);
        assert.equal(
            stack,
            [
                'MultiError: first of 1 error: error one',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );
    });

    it('errorFromList', function() {
        assert.throws(function() {
            console.error(errorFromList());
        }, 'errors ([object]) is required');

        assert.throws(function() {
            console.error(errorFromList(null));
        }, 'errors ([object]) is required');

        assert.throws(function() {
            console.error(errorFromList({}));
        }, 'errors ([object]) is required');

        assert.throws(function() {
            console.error(errorFromList('asdf'));
        }, 'errors ([object]) is required');

        assert.throws(function() {
            console.error(errorFromList([new Error(), 17]));
        }, 'errors ([object]) is required');

        assert.throws(function() {
            console.error(errorFromList([new Error(), {}]));
        }, 'all errors must be an Error');

        assert.strictEqual(null, errorFromList([]));
        assert.ok(err1 === errorFromList([err1]));
        assert.ok(err2 === errorFromList([err2]));
        merr = errorFromList([err1, err2, err3]);
        assert.ok(merr instanceof MultiError);
        assert.ok(merr.errors()[0] === err1);
        assert.ok(merr.errors()[1] === err2);
        assert.ok(merr.errors()[2] === err3);
    });

    it('errorForEach', function() {
        assert.throws(function() {
            console.error(errorForEach());
        }, 'err must be an Error');

        assert.throws(function() {
            console.error(errorForEach(null));
        }, 'err must be an Error');

        assert.throws(function() {
            console.error(errorForEach(err1));
        }, 'func (func) is required');

        assert.throws(function() {
            console.error(errorForEach(err1, {}));
        }, 'func (func) is required');

        assert.throws(function() {
            // eslint-disable-next-line
            console.error(errorForEach({}, function() {}));
        }, 'err must be an Error');

        accum = [];
        const doAccum = function(e) {
            accum.push(e);
        };

        accum = [];
        errorForEach(err1, doAccum);
        assert.equal(accum.length, 1);
        assert.ok(accum[0] === err1);

        accum = [];
        errorForEach(merr, doAccum);
        assert.equal(accum.length, 3);
        assert.ok(accum[0] === err1);
        assert.ok(accum[1] === err2);
        assert.ok(accum[2] === err3);
    });
});
