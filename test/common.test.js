/*
 * common.js: tests functionality that's common to the VError, SError, and
 * WError classes.
 */
'use strict';

// external modules
const assert = require('chai').assert;

const { SError, VError, WError } = require('../lib/verror');
const { cleanStack } = require('./utils');

[SError, VError, WError].forEach(function(Cons) {
    describe(`common ${Cons.name}`, function() {
        let name = Cons.name;

        // Name exception
        if (Cons === SError) {
            name = 'VError';
        }

        it('with no arguments', function() {
            const err = new Cons();
            assert.equal(err.name, name);
            assert.ok(err instanceof Error);
            assert.ok(err instanceof Cons);
            assert.equal(err.message, '');
            assert.ok(err.cause() === undefined);

            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            const stack = cleanStack(err.stack);
            assert.equal(
                stack,
                [
                    name,
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );
        });

        it('used without new', function() {
            const err = Cons('test %s', 'foo');
            assert.equal(err.name, name);
            assert.ok(err instanceof Error);
            assert.ok(err instanceof Cons);
            assert.equal(err.message, 'test foo');
        });

        it('options-argument form', function() {
            const err = new Cons({});
            assert.equal(err.name, name);
            assert.equal(err.message, '');
            assert.ok(err.cause() === undefined);
        });

        it('simple message', function() {
            let err = new Cons('my error');
            assert.equal(err.name, name);
            assert.equal(err.message, 'my error');
            assert.ok(err.cause() === undefined);
            const stack = cleanStack(err.stack);
            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            assert.equal(
                stack,
                [
                    name + ': my error',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );

            err = new Cons({}, 'my error');
            assert.equal(err.name, name);
            assert.equal(err.message, 'my error');
            assert.ok(err.cause() === undefined);
        });

        it('isVError', function() {
            const err = new Cons();
            assert.ok(VError.isVError(err));
        });

        it('fullStack', function() {
            const err = new Cons('Some error');
            const stack = cleanStack(VError.fullStack(err));
            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            assert.equal(
                stack,
                [
                    name + ': Some error',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );
        });

        it('printf-style message', function() {
            let err = new Cons('%s error: %3d problems', 'very bad', 15);
            assert.equal(err.message, 'very bad error:  15 problems');
            assert.ok(err.cause() === undefined);

            err = new Cons({}, '%s error: %3d problems', 'very bad', 15);
            assert.equal(err.message, 'very bad error:  15 problems');
            assert.ok(err.cause() === undefined);
        });

        it('null cause (for backwards compatibility with older versions)', function() {
            let err = new Cons(null, 'my error');
            assert.equal(err.message, 'my error');
            assert.ok(err.cause() === undefined);
            let stack = cleanStack(err.stack);
            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            assert.equal(
                stack,
                [
                    name + ': my error',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );

            err = new Cons({ cause: null }, 'my error');
            assert.equal(err.message, 'my error');
            assert.ok(err.cause() === undefined);

            err = new Cons(null);
            assert.equal(err.message, '');
            assert.ok(err.cause() === undefined);
            stack = cleanStack(err.stack);
            assert.equal(
                stack,
                [
                    name,
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );
        });

        it('constructor opts', function() {
            function makeErr(options) {
                return new Cons(options, 'test error');
            }
            let err = makeErr({});
            let stack = cleanStack(err.stack);
            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            assert.equal(
                stack,
                [
                    name + ': test error',
                    '    at makeErr (dummy filename)',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );

            err = makeErr({ constructorOpt: makeErr });
            stack = cleanStack(err.stack);
            assert.equal(
                stack,
                [
                    name + ': test error',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );
        });

        it('custom name', function() {
            const err = new Cons(
                { name: 'SomeOtherError' },
                'another kind of error'
            );
            assert.equal(err.name, 'SomeOtherError');
            assert.ok(err instanceof Cons);
            assert.ok(err instanceof Error);
            assert.equal(err.message, 'another kind of error');
            const stack = cleanStack(err.stack);
            const nodestack = new Error().stack
                .split('\n')
                .slice(4)
                .join('\n');
            assert.equal(
                stack,
                [
                    'SomeOtherError: another kind of error',
                    '    at Context.<anonymous> (dummy filename)',
                    '    at callFn (dummy filename)',
                    '    at Test.Runnable.run (dummy filename)'
                ].join('\n') +
                    '\n' +
                    nodestack
            );
        });

        it('disabling printf', function() {
            let err = new Cons({ skipPrintf: true }, '%s');
            assert.equal(err.message, '%s');
            err = new Cons({ skipPrintf: true });
            assert.equal(err.message, '');
            assert.throws(function() {
                console.error(new Cons({ skipPrintf: true }, '%s', 'foo'));
            }, /only one argument is allowed with options.skipPrintf/);
            err = new Cons({ skipPrintf: false }, '%s', 'foo');
            assert.equal(err.message, 'foo');
            err = new Cons({ skipPrintf: null }, '%s', 'foo');
            assert.equal(err.message, 'foo');
            err = new Cons({ skipPrintf: undefined }, '%s', 'foo');
            assert.equal(err.message, 'foo');
        });
    });
});
