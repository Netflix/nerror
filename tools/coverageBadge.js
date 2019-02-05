#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const COVERAGE_LINE_ID = '[manual coverage]';
const START_CHAR = '/coverage-';
const END_CHAR = ')]()';

const report = require('./../coverage/coverage-summary.json');
const pct = Math.round(report.total.lines.pct);
let color;

if (pct > 80) {
    color = 'green';
} else if (pct > 60) {
    color = 'yellow';
} else {
    color = 'red';
}

// read in the README
const README_PATH = path.join(__dirname, '../README.md');
const originalReadmeStr = fs.readFileSync(README_PATH).toString();
// process it
const out = processLines(originalReadmeStr);
// now write it back out
fs.writeFileSync(README_PATH, out);

/**
 * Process lines
 * @function processLines
 * @param {String} readmeStr - readme
 * @returns {String} readme
 */
function processLines(readmeStr) {
    const lines = readmeStr.toString().split('\n');
    let outLines = '';

    lines.forEach(function(line) {
        if (line.indexOf(COVERAGE_LINE_ID) > -1) {
            const startIdx = line.indexOf(START_CHAR);
            const endIdx = line.indexOf(END_CHAR);

            const newLine = [
                line.slice(0, startIdx + 1),
                'coverage-' + pct + '%25-' + color + '.svg',
                line.slice(endIdx),
                '\n'
            ].join('');

            outLines += newLine;
        } else {
            outLines += line + '\n';
        }
    });

    // chop off last newline
    return outLines.slice(0, -1);
}
