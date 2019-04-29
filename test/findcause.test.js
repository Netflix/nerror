'use strict';

/*
 * tests findCauseByName()/hasCauseWithName().
 */

const assert = require('assert');
const util = require('util');

const {
    SError,
    VError,
    WError,
    findCauseByName,
    hasCauseWithName
} = require('../lib/verror');

describe('findcause', function() {
    /*
     * This class deliberately doesn't inherit from our error classes.
     */
    function MyError() {
        Error.call(this, 'here is my error');
    }

    util.inherits(MyError, Error);
    MyError.prototype.name = 'MyError';
    /*
     * We'll build up a cause chain using each of our classes and make sure
     * that findCauseByName() traverses all the way to the bottom.  This
     * ends up testing that findCauseByName() works with each of these
     * classes.
     */
    let err1 = new MyError();
    const err2 = new VError(
        {
            name: 'ErrorTwo',
            cause: err1
        },
        'basic verror (number two)'
    );
    const err3 = new SError(
        {
            name: 'ErrorThree',
            cause: err2
        },
        'strict error (number three)'
    );
    const err4 = new WError(
        {
            name: 'ErrorFour',
            cause: err3
        },
        'werror (number four)'
    );

    it('should have all of the causes in its chain', function() {
        /*
         * Our top-level error should have all of the causes in its chain.
         */
        assert.strictEqual(err4, findCauseByName(err4, 'ErrorFour'));
        assert.strictEqual(true, hasCauseWithName(err4, 'ErrorFour'));
        assert.strictEqual(err3, findCauseByName(err4, 'ErrorThree'));
        assert.strictEqual(true, hasCauseWithName(err4, 'ErrorThree'));
        assert.strictEqual(err2, findCauseByName(err4, 'ErrorTwo'));
        assert.strictEqual(true, hasCauseWithName(err4, 'ErrorTwo'));
        assert.strictEqual(err1, findCauseByName(err4, 'MyError'));
        assert.strictEqual(true, hasCauseWithName(err4, 'MyError'));
    });
    it('should have only their own causes', function() {
        /*
         * By contrast, the next-level errors should have only their own causes.
         */
        assert.strictEqual(null, findCauseByName(err3, 'ErrorFour'));
        assert.strictEqual(false, hasCauseWithName(err3, 'ErrorFour'));
        assert.strictEqual(err3, findCauseByName(err3, 'ErrorThree'));
        assert.strictEqual(true, hasCauseWithName(err3, 'ErrorThree'));
        assert.strictEqual(err2, findCauseByName(err3, 'ErrorTwo'));
        assert.strictEqual(true, hasCauseWithName(err3, 'ErrorTwo'));
        assert.strictEqual(err1, findCauseByName(err3, 'MyError'));
        assert.strictEqual(true, hasCauseWithName(err3, 'MyError'));

        assert.strictEqual(null, findCauseByName(err2, 'ErrorFour'));
        assert.strictEqual(false, hasCauseWithName(err2, 'ErrorFour'));
        assert.strictEqual(null, findCauseByName(err2, 'ErrorThree'));
        assert.strictEqual(false, hasCauseWithName(err2, 'ErrorThree'));
        assert.strictEqual(err2, findCauseByName(err2, 'ErrorTwo'));
        assert.strictEqual(true, hasCauseWithName(err2, 'ErrorTwo'));
        assert.strictEqual(err1, findCauseByName(err2, 'MyError'));
        assert.strictEqual(true, hasCauseWithName(err2, 'MyError'));
    });
    it('should work on non-VError errors', function() {
        /*
         * These functions must work on non-VError errors.
         */
        assert.strictEqual(err1, findCauseByName(err1, 'MyError'));
        assert.strictEqual(true, hasCauseWithName(err1, 'MyError'));
        assert.strictEqual(null, findCauseByName(err1, 'ErrorTwo'));
        assert.strictEqual(false, hasCauseWithName(err1, 'ErrorTwo'));

        err1 = new Error('a very basic error');
        assert.strictEqual(err1, findCauseByName(err1, 'Error'));
        assert.strictEqual(true, hasCauseWithName(err1, 'Error'));
        assert.strictEqual(null, findCauseByName(err1, 'MyError'));
        assert.strictEqual(false, hasCauseWithName(err1, 'MyError'));
    });
    it('should throw an Error when given bad argument types', function() {
        /*
         * These functions should throw an Error when given bad argument types.
         */
        assert.throws(function() {
            findCauseByName(null, 'AnError');
        }, /err must be an Error/);
        assert.throws(function() {
            hasCauseWithName(null, 'AnError');
        }, /err must be an Error/);
        assert.throws(function() {
            findCauseByName(err1, null);
        }, /string.*is required/);
        assert.throws(function() {
            hasCauseWithName(err1, null);
        }, /string.*is required/);
    });
});
