'use strict';

/*
 * test that inheriting from VError and WError work as expected.
 */

const assert = require('assert');
const util = require('util');

const { VError, WError } = require('../lib/verror');
const { cleanStack } = require('./utils');

function VErrorChild(...args) {
    VError.call(this, ...args);
}

util.inherits(VErrorChild, VError);
VErrorChild.prototype.name = 'VErrorChild';

function WErrorChild(...args) {
    WError.call(this, ...args);
}

util.inherits(WErrorChild, WError);
WErrorChild.prototype.name = 'WErrorChild';

describe('inherit', function() {
    it('should inherit', function() {
        let err, suberr, stack;
        const nodestack = new Error().stack
            .split('\n')
            .slice(4)
            .join('\n');
        suberr = new Error('root cause');
        err = new VErrorChild(suberr, 'top');
        assert.ok(err instanceof Error);
        assert.ok(err instanceof VError);
        assert.ok(err instanceof VErrorChild);
        assert.equal(err.cause(), suberr);
        assert.equal(err.message, 'top: root cause');
        assert.equal(err.toString(), 'VErrorChild: top: root cause');
        stack = cleanStack(err.stack);
        assert.equal(
            stack,
            [
                'VErrorChild: top: root cause',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)',
                nodestack
            ].join('\n')
        );

        suberr = new Error('root cause');
        err = new WErrorChild(suberr, 'top');
        assert.ok(err instanceof Error);
        assert.ok(err instanceof WError);
        assert.ok(err instanceof WErrorChild);
        assert.equal(err.cause(), suberr);
        assert.equal(err.message, 'top');
        assert.equal(
            err.toString(),
            'WErrorChild: top; caused by Error: root cause'
        );
        stack = cleanStack(err.stack);

        assert.equal(
            stack,
            [
                'WErrorChild: top',
                '    at Context.<anonymous> (dummy filename)',
                '    at callFn (dummy filename)',
                '    at Test.Runnable.run (dummy filename)',
                nodestack
            ].join('\n')
        );
    });

    it('"<Ctor>.toString()" uses the constructor name, so that setting <Ctor>.prototype.name" isn\'t necessary.', function() {
        function VErrorChildNoName() {
            VError.apply(this, Array.prototype.slice.call(arguments));
        }
        util.inherits(VErrorChildNoName, VError);
        let err = new VErrorChildNoName('top');
        assert.equal(err.toString(), 'VErrorChildNoName: top');

        function WErrorChildNoName() {
            WError.apply(this, Array.prototype.slice.call(arguments));
        }
        util.inherits(WErrorChildNoName, WError);
        err = new WErrorChildNoName('top');
        assert.equal(err.toString(), 'WErrorChildNoName: top');
    });

    it('`<Ctor>.prototype.name` can be used for the `.toString() when the ctor is anonymous.', function() {
        const VErrorChildAnon = function() {
            VError.apply(this, Array.prototype.slice.call(arguments));
        };
        util.inherits(VErrorChildAnon, VError);
        VErrorChildAnon.prototype.name = 'VErrorChildAnon';
        let err = new VErrorChildAnon('top');
        assert.equal(err.toString(), 'VErrorChildAnon: top');

        const WErrorChildAnon = function() {
            WError.apply(this, Array.prototype.slice.call(arguments));
        };
        util.inherits(WErrorChildAnon, WError);
        WErrorChildAnon.prototype.name = 'WErrorChildAnon';
        err = new WErrorChildAnon('top');
        assert.equal(err.toString(), 'WErrorChildAnon: top');
    });

    it('should get an appropriate exception name in toString()', function() {
        let err = new VError('top');
        err.name = 'CustomNameError';
        assert.equal(err.toString(), 'CustomNameError: top');

        err = new WError('top');
        err.name = 'CustomNameError';
        assert.equal(err.toString(), 'CustomNameError: top');
    });
});
