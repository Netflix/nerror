'use strict';

/*
 * tests the way informational properties are inherited with nested
 * errors.
 */

const assert = require('assert');

const { VError } = require('../lib/verror');

describe('info', function() {
    it('base case using "options" to specify cause', function() {
        const err1 = new Error('bad');
        const err2 = new VError(
            {
                cause: err1
            },
            'worse'
        );
        assert.equal(err2.cause(), err1);
        assert.equal(err2.message, 'worse: bad');
        assert.deepEqual(VError.info(err2), {});
    });

    it('simple info usage', function() {
        const err1 = new VError(
            {
                name: 'MyError',
                info: {
                    errno: 'EDEADLK',
                    anobject: { hello: 'world' }
                }
            },
            'bad'
        );
        assert.equal(err1.name, 'MyError');
        assert.deepEqual(VError.info(err1), {
            errno: 'EDEADLK',
            anobject: { hello: 'world' }
        });
    });
    it('simple property propagation using old syntax', function() {
        const err1 = new VError(
            {
                name: 'MyError',
                info: {
                    errno: 'EDEADLK',
                    anobject: { hello: 'world' }
                }
            },
            'bad'
        );
        const err2 = new VError(err1, 'worse');
        assert.equal(err2.cause(), err1);
        assert.equal(err2.message, 'worse: bad');
        assert.deepEqual(VError.info(err2), {
            errno: 'EDEADLK',
            anobject: { hello: 'world' }
        });
    });
    it('one property override', function() {
        const err1 = new VError(
            {
                name: 'MyError',
                info: {
                    errno: 'EDEADLK',
                    anobject: { hello: 'world' }
                }
            },
            'bad'
        );
        const err2 = new VError(
            {
                cause: err1,
                info: {
                    anobject: { hello: 'moon' }
                }
            },
            'worse'
        );
        assert.equal(err2.cause(), err1);
        assert.equal(err2.message, 'worse: bad');
        assert.deepEqual(VError.info(err2), {
            errno: 'EDEADLK',
            anobject: { hello: 'moon' }
        });
    });
    it('add a third-level to the chain', function() {
        const err1 = new VError(
            {
                name: 'MyError',
                info: {
                    errno: 'EDEADLK',
                    anobject: { hello: 'world' }
                }
            },
            'bad'
        );
        const err2 = new VError(
            {
                cause: err1,
                info: {
                    anobject: { hello: 'moon' }
                }
            },
            'worse'
        );
        const err3 = new VError(
            {
                cause: err2,
                name: 'BigError',
                info: {
                    remote_ip: '127.0.0.1'
                }
            },
            'what next'
        );
        assert.equal(err3.name, 'BigError');
        assert.equal(VError.info(err3).remote_ip, '127.0.0.1');
        assert.equal(err3.cause(), err2);
        assert.equal(err3.message, 'what next: worse: bad');
        assert.equal(VError.info(err3).errno, 'EDEADLK');
        assert.deepEqual(VError.info(err3).anobject, { hello: 'moon' });
    });
});
