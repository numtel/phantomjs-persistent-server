Package.describe({
  summary: "PhantomJS Queue Manager",
  version: "0.0.1",
  git: "https://github.com/numtel/phantomjs-queue.git"
});

var packageContents = function(api){
  api.use('underscore');
  api.use('http');
  api.use('gadicohen:phantomjs@0.0.2');
  api.addFiles('assetKey.js', 'server', {isAsset: true});
  api.addFiles('assetKey.js', 'server');

  api.addFiles('phantom-server.js', 'server', {isAsset: true});
  api.addFiles('methods/echoExample.js', 'server', {isAsset: true});

  api.addFiles('queue.js', 'server');
  api.export('phantomLaunch');
};

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.3.1');
  packageContents(api);
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('test-helpers');
  api.use('coffeescript');
  packageContents(api);
  api.addFiles('phantomjs-queue-tests.coffee', 'server');
});
