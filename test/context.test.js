'use strict';

/*
 * tests that cause works with errors from different contexts.
 */

const isError = require('lodash.iserror');
const assert = require('assert');
const vm = require('vm');

const { VError } = require('../lib/verror');

describe('context', function() {
    it('should work with errors from different contexts', function(done) {
        const err = new Error();
        const verr = new VError(err);
        assert.ok(isError(verr.cause()));

        const context = vm.createContext({
            callback: function callback(err2) {
                assert.ok(isError(err2));
                const verr2 = new VError(err);
                assert.ok(isError(verr2.cause()));
                done();
            }
        });
        vm.runInContext('callback(new Error())', context);
    });
});
