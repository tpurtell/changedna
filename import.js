//@author T.J. Purtell
//MIT License, i.e. do whatever you want and don't bug me unless you like it :-)

//make sure we actually have a repository to import
if(process.argv.length < 3) {
    console.error('Usage: node import.js git://github.com/ENTITY/REPOSITORY.git [branch]');
    exit(1);
}

var repository = process.argv[2];
var branch = "master";

//optionally setup the branch name
if(process.argv.length == 4) {
    branch = process.argv[3];
}

var git = require('./git.js');
var fs = require('fs');

//should all be relative paths from the root where this script is run
console.log(git.getRepositoryPath(repository));
console.log(git.getOutputPath(repository));

var revisions = [];
var tallies = {};

var identifier_re = /[_a-zA-Z][_a-zA-Z0-9]*/g;
function tallyWords(line, multiplier, tally) {
    var terms = line.match(identifier_re);
    if(!terms)
        return;
    for(var i = 0; i < terms.length; ++i) {
        var term = terms[i]
        if(term in tally) {
            tally[term] += multiplier;
        } else {
            tally[term] = multiplier;
        }
    }
}
function mergeTallies(merged) {
    for(var i = 1; i < arguments.length; ++i) {
        var tally = arguments[i];
        for(var term in tally) {
            if(term in merged) {
                merged[term] += tally[term];
            } else {
                merged[term] = tally[term];
            }
        }
    }
    return merged;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.startsWith = function(prefix) {
    return this.lastIndexOf(prefix, 0) === 0;
};

function getWordFrequencyFromDiff(diff) {
    var tally = {};
    var lines = diff.split('\n');
    for(var i = 0; i < lines.length; ++i) {
        var line = lines[i];
        if(line.startsWith('+++') || line.startsWith('---')) {
            //do nothing based on the file name
        } else if(line.startsWith('+')) {
            tallyWords(line, 1, tally);
        } else if(line.startsWith('-')) {
            tallyWords(line, -1, tally);
        }
    }
    return tally;
}

function afterCheckout(code) {
    if(code != 0) {
        throw new Error('checkout of ' + repository + ' failed!');
    }
    git.getRevisionList(repository, branch, afterRevisionList);
}
function afterRevisionList(code, in_revisions) {
    if(code != 0) {
        throw new Error('rev-list of ' + repository + ' ' + branch + ' failed!');
    }
    revisions = in_revisions;
    var remaining_revisions = revisions.slice();
    var commit = remaining_revisions.pop();
    function afterDiff(code, diff) {
        if(code != 0) {
            throw new Error('show of ' + repository + ' ' + commit + ' failed!');
        }
        tallies[commit] = getWordFrequencyFromDiff(diff);
        if(remaining_revisions.length == 0)
            return afterAllDiffs();
        console.log('got diff for commit ' + commit);
        commit = remaining_revisions.pop();
        git.getCommitDiff(repository, commit, afterDiff);
    };
    git.getCommitDiff(repository, commit, afterDiff);
}

function afterAllDiffs() {
    var f = fs.createWriteStream(git.getOutputPath(repository));
    var data = {
        "repo":repository,
        "revisions":revisions,
        "words":tallies,
    };
    f.write(JSON.stringify(data));
    f.end();
    console.log('summary written');
    var merged = {};
    for(var commit in tallies) {
        mergeTallies(merged, tallies[commit]);
    }
    var sorted = [];
    for(var term in merged) {
        sorted.push({score:merged[term], term:term});
    }
    sorted.sort(function(a,b) { return a.score - b.score; });
    sorted.slice(0, 100);
    console.log(sorted);
}

git.checkoutRepository(repository, afterCheckout);
