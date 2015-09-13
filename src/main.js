// phantomjs-persistent-server
// MIT License ben@latenightsketches.com
// Main Meteor Package module, defines phantomLaunch function

var Future = Npm.require('fibers/future');
var phantomjs = Npm.require('phantomjs');
var shell = Npm.require('child_process');
var fs = Npm.require('fs');

// Options
// port: specify a port number. Undefined auto-selects a port.
// forcePort: boolean. Kill PhantomJS if currently using port
// debug: boolean. forward PhantomJS stdout on true
phantomLaunch = function(options){
  var port;
  options = options || {};
  if(options.port) port = options.port;
  else port = getOpenPort();

  // Returned by phantomLaunch for executing methods on this server
  // func: function copied as string and executed in phantomjs context
  //       In addition to the args defined, a last argument, 'callback' must
  //       be accepted. By default, async.
  //       Called as normal callback(error, result).
  // args... any more parameters will be applied to the function passed
  // TODO: test for phantom disappearance and try to remedy
  //        launch Phantom if port open, error if something else on port
  var executive = function(/* arguments */){
    var args = Array.prototype.slice.call(arguments, 0);
    var func = args.shift();
    if(typeof func !== 'function'){
      throw new Meteor.Error(400, 'function-required');
    };
    var url = 'http://localhost:' + port + '/';
    var content = JSON.stringify({
      func: func.toString(),
      args: args
    });
    try{
      var retval = HTTP.post(url, {
        headers: {
          // Packaged PhantomJS is 1.8.1, requires Case-Sensitive header
          // https://github.com/ariya/phantomjs/issues/11000
          'Content-Length': content.length
        },
        content: content
      });
    }catch(err){
      throw new Meteor.Error(500, err.toString());
    }
    if(retval && retval.statusCode === 200){
      return JSON.parse(retval.content);
    };
  };

  // Public properties/methods
  executive.port = port;
  executive.kill = function(){
    options.debug && console.log(
      'Killing PhantomJS on port', port, ', pid', executive.pid);
    process.kill(executive.pid, 'SIGINT');
  };

  // Check port status then start PhantomJS
  var fut = new Future();
  var portStatus = getPortStatus(port);
  if(portStatus !== null){
    if(options.forcePort){
      // Kill phantomjs process in specified port
      options.debug && console.log(
        'Recovering oprhaned port', port,
        'from PhantomJS, pid', portStatus);
      process.kill(portStatus, 'SIGINT');
    }else{
      // Port in use by a different server
      throw new Meteor.Error(500, 'port-in-use');
    }
  }else{
    // Port is open
    var command = shell.spawn(phantomjs.path,
      [assetDir + 'src/phantom-server.js', port]);
    options.debug && command.stdout.pipe(process.stdout);
    command.stderr.pipe(process.stderr);
    command.stdout.on('data', Meteor.bindEnvironment(function(data){
      options.debug && console.log(String(data));

      data = String(data).trim();
      if(data.substr(-6) === 'Ready.'){
        executive.pid = command.pid;
        fut['return'](executive);
      };
    }));
    command.on('exit', Meteor.bindEnvironment(function(code){
      // Restart on exit
      var newExec = phantomLaunch(options);
      // Update handle, port may change on auto-port
      executive.port = port = newExec.port;
      executive.pid = newExec.pid;
    }));
  };
  return fut.wait();
};

// Return an unused TCP port
var getOpenPort = function(){
  var fut = new Future();
  Npm.require('get-port')(function (err, port) {
    if(err) return fut['throw'](err);
    fut['return'](port);
  }); 
  return fut.wait();
};

// Return null       if port open,
//        'in-use'  if port occupied by other server
//        pid       if port occupied by phantomjs server
var getPortStatus = function(port){
  var fut = new Future();
  var command  = shell.spawn('lsof', ['-i:' + port]);
  command.stdout.on('data', Meteor.bindEnvironment(function(data){
    if(!fut.isResolved()){
      data = String(data).split('\n');
      if(data.length < 3){
        return fut['return'](null);
      };
      var infoLine = data[1].split(' ');
      if(infoLine[0] === 'phantomjs'){
        return fut['return'](infoLine[1]);
      };
      fut['return']('in-use');
    };
  }));
  command.stderr.on('data', Meteor.bindEnvironment(function(data){
    if(!fut.isResolved()){
      data = String(data);
      fut['throw'](data);
    };
  }));
  command.on('exit', Meteor.bindEnvironment(function(code){
    Meteor.setTimeout(function(){
      if(!fut.isResolved()){
        fut['return'](null);
      };
    }, 100);
  }));
  return fut.wait();
};
