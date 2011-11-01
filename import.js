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

function afterCheckout(code) {
    if(code != 0) {
        throw new Error('checkout of ' + repository + ' failed!');
    }
    git.getRevisionList(repository, branch, afterRevisionList);
}
function afterRevisionList(code, in_revisions) {
    console.log("yo");
    if(code != 0) {
        throw new Error('rev-list of ' + repository + ' ' + branch + ' failed!');
    }
    revisions = in_revisions;
    console.log(revisions);
}
function afterDiff(code) {
}

git.checkoutRepository(repository, afterCheckout);
