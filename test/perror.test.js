'use strict';

const assert = require('chai').assert;

const { PError } = require('../lib/verror');

describe('perror', function() {
    it('should create a PError', function() {
        const err = new PError('%s');
        assert.equal(err.message, '%s');
    });

    it('should not allow multiple arguments', function() {
        assert.throws(function() {
            console.error(new PError('%s', 'foo'));
        }, /only one argument is allowed with options.skipPrintf/);
    });
});
