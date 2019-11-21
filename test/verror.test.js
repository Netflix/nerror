'use strict';

/*
 * tests functionality that's specific to the VError and SError classes.
 */

const assert = require('assert');

const { SError, VError, WError } = require('../lib/verror');
const { cleanStack } = require('./utils');

describe('verror', function() {
    let err, suberr, stack;

    it('"null" or "undefined" as string for extsprintf */', function() {
        err = new VError('my %s string', null);
        assert.equal('my null string', err.message);
        err = new VError('my %s string', undefined);
        assert.equal('my undefined string', err.message);

        assert.throws(function() {
            console.error(new VError({ strict: true }, 'my %s string', null));
        }, /attempted to print undefined or null as a string/);
        assert.throws(function() {
            console.error(new SError('my %s string', undefined));
        }, /attempted to print undefined or null as a string/);

        assert.throws(function() {
            console.error(new SError('my %s string', null));
        }, /attempted to print undefined or null as a string/);
        assert.throws(function() {
            console.error(new SError('my %s string', undefined));
        }, /attempted to print undefined or null as a string/);
    });

    it("don't call extsprintf if pass single string to VError constructor", function() {
        const errString = 'my %s error';
        err = new VError(errString);
        assert.equal(err.message, 'errString');
    });

    it('caused by another error, with no additional message */', function() {
        suberr = new Error('root cause');
        err = new VError(suberr);
        assert.equal(err.message, ': root cause');
        assert.ok(err.cause() === suberr);

        err = new VError({ cause: suberr });
        assert.equal(err.message, ': root cause');
        assert.ok(err.cause() === suberr);
    });

    it('caused by another error, with annotation */', function() {
        err = new VError(suberr, 'proximate cause: %d issues', 3);
        assert.equal(err.message, 'proximate cause: 3 issues: root cause');
        assert.ok(err.cause() === suberr);
        stack = cleanStack(err.stack);
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                'VError: proximate cause: 3 issues: root cause',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );

        err = new SError({ cause: suberr }, 'proximate cause: %d issues', 3);
        assert.equal(err.message, 'proximate cause: 3 issues: root cause');
        assert.ok(err.cause() === suberr);
        stack = cleanStack(err.stack);
    });

    it('See the comment in tst.common.js. */', function() {
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                'VError: proximate cause: 3 issues: root cause',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );
    });

    it('caused by another VError, with annotation. */', function() {
        suberr = err;
        err = new VError(suberr, 'top');
        assert.equal(err.message, 'top: proximate cause: 3 issues: root cause');
        assert.ok(err.cause() === suberr);

        err = new VError({ cause: suberr }, 'top');
        assert.equal(err.message, 'top: proximate cause: 3 issues: root cause');
        assert.ok(err.cause() === suberr);
    });

    it('caused by a WError */', function() {
        suberr = new WError(new Error('root cause'), 'mid');
        err = new VError(suberr, 'top');
        assert.equal(err.message, 'top: mid');
        assert.ok(err.cause() === suberr);
    });

    it('fullStack */', function() {
        suberr = new VError(new Error('root cause'), 'mid');
        err = new VError(suberr, 'top');
        stack = cleanStack(VError.fullStack(err));
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                'VError: top: mid: root cause',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack +
                '\n' +
                [
                    'caused by: VError: mid: root cause',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                '\n' +
                nodestack +
                '\n' +
                [
                    'caused by: Error: root cause',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                '\n' +
                nodestack
        );
    });

    describe('#_assertError', function() {
        it('should not throw with Error type input', function() {
            VError._assertError(new Error('My Error'));
        });

        it('should throw with undefined input', function() {
            assert.throws(function() {
                VError._assertError();
            }, /err must be an Error but got undefined/);
        });

        it('should throw with non Error object input', function() {
            assert.throws(function() {
                VError._assertError({ foo: 'bar' });
            }, /err must be an Error but got \[object Object\]/);
        });

        it('should throw with custom message', function() {
            assert.throws(function() {
                VError._assertError(undefined, '"cause" must be an Error');
            }, /"cause" must be an Error but got undefined/);
        });
    });
});
