//@author T.J. Purtell
//MIT License, i.e. do whatever you want and don't bug me unless you like it :-)

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

var GIT_BINARY = 'C:\\program files (x86)\\git\\bin\\git.exe';

//save this just in case some weird spawn code causes it to change
var base_path = process.cwd();

function encodeRepository(repository) {
    return encodeURIComponent(repository);
}
function getOutputBase(repository) {
    return path.join(base_path, 'processed', encodeRepository(repository));
}
function getOutputPath(repository) {
    return getOutputBase(repository) + '.json';
}
function getRepositoryPath(repository) {
    return path.join(base_path, 'git', encodeRepository(repository));
}
//callback invoked with first argument as code: success ==0 or fail !=0
function checkoutRepository(repository, callback) {
    //if stat fails, the git folder doesn't exist so check it out
    try {
        fs.statSync(path.join(getRepositoryPath(repository), '.git'));
        //TODO: could pull to refresh it? but meh
        callback(0);
    } catch (err) {
        var child = spawn(GIT_BINARY, [ 'clone', repository, getRepositoryPath(repository)]);
        child.stdout.on('data', function(data){process.stdout.write(data)});
        child.stderr.on('data', function(data){process.stderr.write(data)});
        child.on('exit', callback);
    }
}
//callback invoked with first argument as code: success ==0 or fail !=0
//                      second argument is revision list
function getRevisionList(repository, branch, callback) {
    var child = spawn(GIT_BINARY, [ 'rev-list', branch ], { cwd:getRepositoryPath(repository) });
    var revisions_raw = "";
    child.stdout.on('data', function(data){revisions_raw += data});
    child.stderr.on('data', function(data){process.stderr.write(data)});
    child.on('exit', function(code) {
        var revisions = revisions_raw.split(/\W+/).filter(function(s){ return s.length > 0;}).reverse();
        callback(code, revisions);
    });
}
function getCommitDiff(repository, commit, callback) {
    var child = spawn(GIT_BINARY, [ 'show', '--format=format:', commit ], { cwd:getRepositoryPath(repository) });
    var diff_raw = "";
    child.stdout.on('data', function(data){diff_raw += data});
    child.stderr.on('data', function(data){process.stderr.write(data)});
    child.on('exit', function(code) {
        callback(code, diff_raw);
    });
}
function getCommitUrl(repository, commit, callback) {
}

try {
    fs.mkdirSync(getOutputBase(''),0777);
} catch (err) {
    if(err.code != "EEXIST") {
        throw err;
    }
}
try {
    fs.mkdirSync(getRepositoryPath(''), 0777);
} catch (err) {
    if(err.code != "EEXIST") {
        throw err;
    }
}

exports.getOutputPath = getOutputPath;
exports.getRepositoryPath = getRepositoryPath;
exports.checkoutRepository = checkoutRepository;
exports.getCommitDiff = getCommitDiff;
exports.getCommitUrl = getCommitUrl;
exports.getRevisionList = getRevisionList;

