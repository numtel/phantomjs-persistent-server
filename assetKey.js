// Work-around for inconsistent asset paths
// Issue: https://github.com/meteor/meteor/issues/2580
// Author: numtel (ben@latenightsketches.com)
// Search for unique string stored in asset directory using grep
// Just reference the assetDir variable in package

// Installation in package.js:

// Package.onUse(function(api) {
//   api.addFiles('assetKey.js', 'server', {isAsset: true});
//   api.addFiles('assetKey.js', 'server');
// });

var assetKey = 'is29jdoiasdj20j0jaosj2093joifjsan2093kmnlds';
var thisFilename = 'assetKey.js'

var Future = Npm.require('fibers/future');
var shell = Npm.require('child_process');

assetDir = (function(){
  // Run 'grep -rl [assetKey]' on the shell
  var command = shell.spawn('grep', ['-rl', assetKey]);

  var fut = new Future();

  var throwError = function(){
    fut.throw(new Meteor.Error(500, 'Unable to local asset directory!'));
  };

  command.stdout.on('data', Meteor.bindEnvironment(function(data){
    // Successful grep output
    var path;
    var files = String(data).split('\n');
    // From multiple files, match the one with this filename
    for(var i = 0; i<files.length; i++){
      if(files[i].substr(-thisFilename.length) === thisFilename){
        path = files[i];
        break;
      };
    };
    if(!path){
      throwError();
    };
    // Remove this file's name from the end of the path
    path = path.substr(0, path.length - thisFilename.length);
    fut.return(path);
  }));

  command.stderr.on('data', Meteor.bindEnvironment(function(data){
    console.log('Asset Directory Not Found', String(data));
    throwError();
  }));

  command.on('exit', Meteor.bindEnvironment(function(code) {
    Meteor.setTimeout(function(){
      if(!fut.isResolved()){
        throwError();
      };
    }, 100);
  }));

  return fut.wait();
})();
