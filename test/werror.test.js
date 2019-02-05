'use strict';

/*
 * tests basic functionality specific to the WError class.
 */

const assert = require('assert');

const { VError, WError } = require('../lib/verror');
const { cleanStack } = require('./utils');

describe('werror', function() {
    let err, suberr, stack, stackmessageTop;

    /*
     * Most of the test cases here have analogs in tst.common.js.  In this
     * test, we check for WError-specific behavior (e.g., toString()).
     */

    it('no arguments */', function() {
        err = new WError();
        assert.equal(err.toString(), 'WError');
        assert.ok(err.cause() === undefined);
        stack = cleanStack(err.stack);
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                'WError',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );
    });

    it('options-argument form */', function() {
        err = new WError({});
        assert.equal(err.toString(), 'WError');
        assert.ok(err.cause() === undefined);
    });

    it('simple message */', function() {
        err = new WError('my error');
        assert.equal(err.message, 'my error');
        assert.equal(err.toString(), 'WError: my error');
        assert.ok(err.cause() === undefined);
        stack = cleanStack(err.stack);
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                'WError: my error',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );

        err = new WError({}, 'my error');
        assert.equal(err.toString(), 'WError: my error');
        assert.ok(err.cause() === undefined);
    });

    it('caused by another error, with no additional message */', function() {
        suberr = new Error('root cause');
        err = new WError(suberr);
        assert.equal(err.message, '');
        assert.equal(err.toString(), 'WError; caused by Error: root cause');
        assert.ok(err.cause() === suberr);

        err = new WError({ cause: suberr });
        assert.equal(err.message, '');
        assert.equal(err.toString(), 'WError; caused by Error: root cause');
        assert.ok(err.cause() === suberr);
    });

    it('caused by another error, with annotation */', function() {
        err = new WError(suberr, 'proximate cause: %d issues', 3);
        assert.equal(err.message, 'proximate cause: 3 issues');
        assert.equal(
            err.toString(),
            'WError: proximate cause: 3 issues; caused by Error: root cause'
        );
        assert.ok(err.cause() === suberr);
        stack = cleanStack(err.stack);
    });

    it('See the comment in tst.inherit.js. */', function() {
        stackmessageTop = 'WError: proximate cause: 3 issues';
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                stackmessageTop,
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );

        err = new WError({ cause: suberr }, 'proximate cause: %d issues', 3);
        assert.equal(err.message, 'proximate cause: 3 issues');
        assert.equal(
            err.toString(),
            'WError: proximate cause: 3 issues; caused by Error: root cause'
        );
        assert.ok(err.cause() === suberr);
        stack = cleanStack(err.stack);
        assert.equal(
            stack,
            [
                stackmessageTop,
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack
        );
    });

    it('caused by another WError, with annotation. */', function() {
        suberr = err;
        err = new WError(suberr, 'top');
        assert.equal(err.message, 'top');
        assert.equal(
            err.toString(),
            'WError: top; caused by WError: ' +
                'proximate cause: 3 issues; caused by Error: root cause'
        );
        assert.ok(err.cause() === suberr);

        err = new WError({ cause: suberr }, 'top');
        assert.equal(err.message, 'top');
        assert.equal(
            err.toString(),
            'WError: top; caused by WError: ' +
                'proximate cause: 3 issues; caused by Error: root cause'
        );
        assert.ok(err.cause() === suberr);
    });

    it('caused by a VError */', function() {
        suberr = new VError(new Error('root cause'), 'mid');
        err = new WError(suberr, 'top');
        assert.equal(err.message, 'top');
        assert.equal(
            err.toString(),
            'WError: top; caused by VError: mid: root cause'
        );
        assert.ok(err.cause() === suberr);
    });

    it('fullStack */', function() {
        suberr = new WError(new Error('root cause'), 'mid');
        err = new WError(suberr, 'top');
        stack = cleanStack(VError.fullStack(err));
    });

    it('See the comment in tst.inherit.js. */', function() {
        const stackmessageMid = 'WError: mid';
        stackmessageTop = 'WError: top';
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        assert.equal(
            stack,
            [
                stackmessageTop,
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)'
            ].join('\n') +
                '\n' +
                nodestack +
                '\n' +
                [
                    'caused by: ' + stackmessageMid,
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
});
