#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

'use strict';

// core modules
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

// configurable local globals
const CHANGES_MD_PATH = path.join(__dirname, '../CHANGES.md');
const PKGJSON_PATH = path.join(__dirname, '../package.json');

// local globals
const ACTION = process.argv.length === 3 && process.argv[2];
const PKG_JSON = JSON.parse(fs.readFileSync(PKGJSON_PATH).toString());
let CHANGES_MD = fs.readFileSync(CHANGES_MD_PATH).toString();
const COMMIT_TYPES = [
    'fix', // for a bug fix
    'update', // for a backwards-compatible enhancement
    'new', // implemented a new feature
    'breaking', // for a backwards-incompatible enhancement or feature
    'docs', // changes to documentation only
    'build', // changes to build process only
    'upgrade', // for a dependency upgrade
    'chore' // for refactoring, adding tests, etc., anything not user-facing
];
const MD_RELEASE_HEADER = '## ';
const MD_COMMIT_TYPE_HEADER = '#### ';

// configurable globals. this special thing where the current package.json
// version is the "staged" version to be published. use that to generate the
// changelog.
const STR_UNRELEASED_HEADER = 'Unreleased';

/**
 * semver utility
 * @type {Object}
 */
const semver = {
    /**
     * returns true if version1 greater than version2
     * @param {String} v1 semver string 1
     * @param {String} v2 semver string 2
     * @return {Boolean}
     */
    gt(v1, v2) {
        const v1s = v1.split('.').map(function(digit) {
            return parseInt(digit, 10);
        });
        const v2s = v2.split('.').map(function(digit) {
            return parseInt(digit, 10);
        });

        if (v1s[0] > v2s[0]) {
            return true;
        } else if (v1s[0] === v2s[0]) {
            if (v1s[1] > v2s[1]) {
                return true;
            } else if (v1s[1] === v2s[1]) {
                if (v1s[2] > v2s[2]) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * returns true if version1 equal to version 2
     * @param {String} v1 semver string 1
     * @param {String} v2 semver string 2
     * @return {Boolean}
     */
    eq(v1, v2) {
        const v1s = v1.split('.');
        const v2s = v2.split('.');

        return v1s[0] === v2s[0] && v1s[1] === v2s[1] && v1s[2] === v2s[2];
    },

    /**
     * increment patch.
     * @param {String} version version to increment
     * @return {String}
     */
    patch(version) {
        const newVersion = version.split('.');
        newVersion[2] = parseInt(newVersion[2]) + 1;

        return newVersion.join('.');
    },

    /**
     * increment minor
     * @param {String} version version to increment
     * @return {String}
     */
    minor(version) {
        const newVersion = version.split('.');
        newVersion[1] = parseInt(newVersion[1]) + 1;
        newVersion[2] = 0;

        return newVersion.join('.');
    },

    /**
     * increment major
     * @param {String} version version to increment
     * @return {String}
     */
    major(version) {
        const newVersion = version.split('.');
        newVersion[0] = parseInt(newVersion[0]) + 1;
        newVersion[1] = 0;
        newVersion[2] = 0;

        return newVersion.join('.');
    },

    /**
     * duck type check for semver
     * @function isSemver
     * @param {String} str the semver string
     * @return {Boolean}
     */
    isSemver(str) {
        let valid = true;

        if (!str) {
            return false;
        }

        const split = str.split('.');

        if (split.length !== 3) {
            return false;
        }

        split.forEach(function(strNum) {
            const parsed = parseInt(strNum);

            if (Number.isNaN(parsed) === true) {
                valid = false;
            }
        });

        return valid;
    }
};

const git = {
    /**
     * find all released versions by looking at git tags found on master.
     * returns array of version tags, sorted chronologically creation date:
     * [ v4.1.0, v4.2.0, v4.3.0, v4.4.0 ]
     * @function getVersions
     * @param {Object} opts an options object
     * @returns {Array}
     */
    getVersions(opts) {
        const stdout = execSync('git tag --sort version:refname').toString();

        // trim empty new lines
        let versions = trim(stdout.split('\n'));

        if (opts && opts.trimVPrefix === true) {
            versions = versions.map(function(version) {
                return version.split('v')[1] || version;
            });
        }

        return versions.reverse();
    },

    /**
     * return last released version in git.
     * @function getLastReleasedVersion
     * @returns {String}
     */
    getLastReleasedVersion() {
        return this.getVersions({
            trimVPrefix: true
        })[0];
    },

    /**
     * git the last n commits from the last published version (last published
     * version is assumed to be the current version in package.json).
     * @function getNewCommits
     * @param {Function} callback a callback function
     * @returns {Array} an array of objects describing commits
     */
    getNewCommits(callback) {
        // this is usually run after `npm version {rev}`, so we actually want
        // tag from previous release.
        const allTags = git.getVersions();
        // tags are in reverse chronological order
        const lastTag = allTags.length >= 1 ? allTags[0] : null;
        const gitLogCmd =
            'git log ' +
            (lastTag ? lastTag + '..HEAD' : 'HEAD') +
            ' --pretty=oneline';
        const stdout = execSync(gitLogCmd).toString();

        // expected commit message would look like this:
        // ba14b5e Upgrade: commit new deps
        // Expected template is:
        // {gitsha} {commitType}: {commitMsg}
        //
        // commits will be ordered in reverse chronological order, with lowest
        // index being newest. trim empty new lines, then trim the last commit
        // was the last release.
        const lines = trim(stdout.split('\n')).slice(0, -1);
        const rawCommits = [];

        lines.forEach(function(line) {
            const fields = line.split(':');
            let commit;

            // ignore all release commits.
            if (!semver.isSemver(line.split(' ')[1])) {
                // if commit message does not have a {verb}.
                if (fields.length === 1) {
                    console.error('[changelog] bad commit message: ' + line);
                    console.error(
                        '[changelog] commit message must be of format: '
                    );
                    console.error('[changelog] {type}: {message}');
                    console.error(
                        '[changelog] where type is one of the ' +
                            'following values:'
                    );
                    console.error(
                        '[changelog] ' + COMMIT_TYPES.join(', ') + '\n'
                    );
                    console.error('[changelog] exiting with error');
                    process.exit(1);
                }
                // otherwise, commit msg confirms to expected template
                else {
                    commit = {
                        gitsha: fields[0].split(' ')[0].trim(),
                        type: fields[0]
                            .split(' ')[1]
                            .trim()
                            .toLowerCase(),
                        msg: fields[1].trim()
                    };
                }

                // add a github link url
                if (commit) {
                    commit.url = PKG_JSON.homepage + '/commit/' + commit.gitsha;
                    rawCommits.push(commit);
                }
            }
        });

        return rawCommits;
    }
};

const md = {
    /**
     * verify the following:
     *  * the changelog does not have duplicated sections
     *  * the lastest version reflects what's in package.json
     * @private
     * @function verify
     * @param {Boolean} release when true, do not add the unreleased header
     * into versions to verify
     * @return {Boolean} return true if ok, false if not ok
     */
    verify(release) {
        // get all the released versions from git tags
        const gitVersions = git.getVersions({
            trimVPrefix: true
        });
        // get all the released versions found in changelog
        const changelogVersions = this.getVersions();

        // when we are generating changelog but not releasing, add a special
        // unreleased section to gitversions
        if (!release) {
            gitVersions.unshift(STR_UNRELEASED_HEADER);
        }
        // if we are in release mode, pop the newest changelog version because
        // git has not yet revved
        else {
            changelogVersions.shift();
        }

        // assert that there is no diff in elements between both arrays
        const missingGit = changelogVersions.filter(function(v) {
            return gitVersions.indexOf(v) === -1;
        });
        const missingChangelog = gitVersions.filter(function(v) {
            return changelogVersions.indexOf(v) === -1;
        });

        if (missingGit.length + missingChangelog.length > 0) {
            console.warn(
                '[changelog] versions found in git does not match ' +
                    'versions found in changelog!'
            );

            if (missingGit.length > 0) {
                console.warn('[changelog] missing git versions: ', missingGit);
            }

            if (missingChangelog.length > 0) {
                console.warn(
                    '[changelog] missing changelog versions: ',
                    missingChangelog
                );
            }

            process.exit(1);
        }
    },

    /**
     * update local value of changelog contents, write passed in string to
     * disk.
     * @private
     * @function write
     * @param {String} str new contents of changelog
     * @return {undefined}
     */
    write(str) {
        // update local global value
        CHANGES_MD = str;
        fs.writeFileSync(CHANGES_MD_PATH, str);
    },

    /**
     * find all the versions in changelog (no v prefix, unlike git tags). the
     * newest version has has lowest index.
     * @function getVersions
     * @returns {Array}
     */
    getVersions() {
        // get each version of the changelog split by section header (##)
        const sections = this.splitByVersions();

        return sections.map(function(version) {
            // split each section header off from the rest of the section by
            // splitting on the first whitespace/newline so we can capture only
            // the header, which is the version.
            return version.split(/\s/)[0];
        });
    },

    /**
     * parse the changelog, return an array of markdown where each element in
     * the array is a version/release in the changelog.
     * @function splitByVersions
     * @return {Array} an array of markdown strings
     */
    splitByVersions() {
        // split existing changes file using the release headers
        const versions = trim(CHANGES_MD.split('\n' + MD_RELEASE_HEADER));

        // remove leading header, since we split by newline, so the very first
        // section may will have extra ## characters
        if (versions.length > 0) {
            versions[0] = versions[0].replace(MD_RELEASE_HEADER, '');
        }

        return versions;
    },

    /**
     * format an array of commit objects into markdown.
     * @function generateUnreleasedMd
     * @param {String} version the string of new version section
     * @param {Array} rawCommits array of objects describing commits
     * @returns {String} markdown string
     */
    generateUnreleasedMd(version, rawCommits) {
        const categorizedCommits = categorizeCommits(rawCommits);

        // create markdown header section for this new "release" using the
        // specified string
        let markdown = MD_RELEASE_HEADER + version + '\n';
        const commitTypes = Object.keys(categorizedCommits).sort();

        commitTypes.forEach(function(commitType) {
            const commits = categorizedCommits[commitType];
            const capcaseType =
                commitType[0].toUpperCase() + commitType.slice(1);

            markdown += '\n' + MD_COMMIT_TYPE_HEADER + capcaseType + '\n\n';

            commits.forEach(function(commit) {
                markdown +=
                    '* ' +
                    commit.msg +
                    ' ([' +
                    commit.gitsha.slice(0, 7) +
                    '](' +
                    commit.url +
                    '))\n';
            });
        });

        return markdown;
    },

    /**
     * update CHANGES.md with latest unreleased commits
     * @function update
     * @param {String} newMd markdown string
     * @return {undefined}
     */
    update(newMd) {
        let versions = this.splitByVersions();

        // see what the first section is - if it matches the current unreleased
        // version, get rid of it. otherwise, assume it is from a proper
        // previous release, in which case we can safely move on.
        if (
            versions.length > 0 &&
            versions[0].indexOf(STR_UNRELEASED_HEADER) === 0
        ) {
            versions = versions.slice(1);
        }

        // add the new regenerated markdown
        versions.unshift(newMd);

        // join it back into a string and write it back to file
        this.write(versions.join('\n' + MD_RELEASE_HEADER));
    },

    /**
     * changes the current unreleased header to the actual version being
     * released.
     * @function release
     * @param {String} newVersion new version being released
     * @returns {undefined}
     */
    release(newVersion) {
        // first, figure out what the last published version was. get the last
        // published tag.
        const dateString = new Date().toISOString().replace(/T..+/, '');
        let lines = CHANGES_MD.split('\n');

        const unreleasedHeader = MD_RELEASE_HEADER + STR_UNRELEASED_HEADER;

        // loop through each line, replace the last auto rev patch version with
        // the actual newly released version specified in package.json
        lines = lines.map(function(line) {
            if (line.indexOf(unreleasedHeader) === 0) {
                return MD_RELEASE_HEADER + newVersion + ' (' + dateString + ')';
            } else {
                return line;
            }
        });

        this.write(lines.join('\n'));
    }
};

/**
 * capitalize first letter of string
 * @param {String} str the string to capitalize
 * @return {String}
 */
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

/**
 * filter falsy values from array
 * @function trim
 * @param {Array} arr an array to filter
 * @return {Array} filtered array
 */
function trim(arr) {
    return arr.filter(function(i) {
        return i !== '' && i !== null && typeof i !== 'undefined';
    });
}

/**
 * categorize raw commits into types of commits for consumption into md.
 * @function categorizeCommits
 * @param {Array} rawCommits array of objects describing commits
 * @return {Object}
 */
function categorizeCommits(rawCommits) {
    const categorizedCommits = {};

    // create a bucket of rawCommits by type:
    // { fixes: [], upgrades: [], breaking: [] }
    rawCommits.forEach(function(commit) {
        const capType = capitalize(commit.type);

        if (!categorizedCommits.hasOwnProperty(capType)) {
            categorizedCommits[capType] = [];
        }

        categorizedCommits[capType].push(commit);
    });

    return categorizedCommits;
}

/**
 * given categorized commits, determine what the semver of the next semver
 * should be using the latest commit from origin/master as the last version.
 * @param {Object} categorizedCommits an object where keys are commit types
 * and values are an array of commits of that commit type
 * @return {String}
 */
function determineNextSemver(categorizedCommits) {
    const breaking = categorizedCommits.Breaking;
    const newFeatures = categorizedCommits.New;
    const updates = categorizedCommits.Update;
    // get last version from git, split so we can increment
    const lastReleasedVersion = git.getLastReleasedVersion();

    // if undefined, this is the first release ever.
    if (typeof lastReleasedVersion === 'undefined') {
        return {
            version: '1.0.0',
            type: 'major'
        };
    }

    // if we have breaking commits, rev major version
    if (breaking && breaking.length >= 1) {
        return {
            version: semver.major(lastReleasedVersion),
            type: 'major'
        };
    }
    // any backwards compatible updates or new features are a minor rev
    else if (
        (newFeatures && newFeatures.length >= 1) ||
        (updates && updates.length >= 1)
    ) {
        return {
            version: semver.minor(lastReleasedVersion),
            type: 'minor'
        };
    }
    // for patch version, rev just last item
    else {
        return {
            version: semver.patch(lastReleasedVersion),
            type: 'patch'
        };
    }
}

// main function, do something based on argv
if (ACTION === 'generate') {
    const commits = git.getNewCommits();
    const newMarkdown = md.generateUnreleasedMd(STR_UNRELEASED_HEADER, commits);
    md.update(newMarkdown);
    md.verify();
} else if (ACTION === 'release') {
    const commits = git.getNewCommits();
    const categorizedCommits = categorizeCommits(commits);
    const next = determineNextSemver(categorizedCommits);
    const newMarkdown = md.generateUnreleasedMd(next.version, commits);
    md.update(newMarkdown);
    md.verify(true);

    // update changelog
    md.release(next.version);
    md.verify(next.version);

    // rev package.json
    execSync('npm version ' + next.type + ' --no-git-tag-version');
    // do git commands and commit
    execSync('git add .');
    execSync('git commit -m ' + next.version);
    execSync('git tag v' + next.version);
} else {
    console.error('[changelog] No action specified');
    process.exit(1);
}
