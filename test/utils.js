'use strict';

/*
 * common utility functions used in multiple tests
 */

const stackTraceRe = new RegExp('\\(/.*/*[.test].js:\\d+:\\d+\\)', 'gm');

/*
 * Remove full paths and relative line numbers from stack traces so that we can
 * compare against "known-good" output.
 */
function cleanStack(stacktxt) {
    return stacktxt.replace(stackTraceRe, '(dummy filename)');
}

/*
 * Node's behavior with respect to Error's names and messages changed
 * significantly with v0.12, so a number of tests regrettably need to check for
 * that.
 */
function oldNode() {
    return /^0\.10\./.test(process.versions.node);
}

module.exports = {
    cleanStack,
    oldNode
};
