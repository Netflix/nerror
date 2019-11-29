'use strict';

/*
 * tests the ability to upcast a standard Error into a VError without wrapping
 * it.
 */

const assert = require('assert');

const { VError } = require('../lib/verror');

describe('info', function() {
    it('should upcast Error into VError', function() {
        const err = new TypeError('bad');
        const upcasted = VError.upcast(err);

        // should mutate in place
        assert.equal(upcasted, err);
        assert.ok(err.stack);
        assert.ok(err.name, 'TypeError');

        // should have VError instance methods
        err.assignInfo({
            remote_ip: '127.0.0.1'
        });
        const info = err.info();

        assert.deepStrictEqual(info, {
            remote_ip: '127.0.0.1'
        });
    });
});
