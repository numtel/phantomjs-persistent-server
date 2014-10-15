// phantomjs-persistent-server
// MIT License ben@latenightsketches.com
// Main Meteor Package module, defines phantomLaunch function

var Future = Npm.require('fibers/future');
var phantomjs = Npm.require('phantomjs');
var shell = Npm.require('child_process');
var fs = Npm.require('fs');

// Options
// port: specify a port number. Undefined auto-selects a port.
// debug: boolean. forward PhantomJS stdout on true
phantomLaunch = function(options){
  var port;
  options = options || {};
  if(options.port) port = options.port;

  if(!port){
    // An unspecified port will automatically select a port
    port = 13470; // Default port
    while(getPortStatus(port) === 'in-use'){
      port++;
    };
    options.port = port;
  };

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
    var retval = HTTP.post(url, {
      headers: {
        // Packaged PhantomJS is 1.8.1, requires Case-Sensitive header
        // https://github.com/ariya/phantomjs/issues/11000
        'Content-Length': content.length
      },
      content: content
    });
    if(retval.statusCode === 200){
      return JSON.parse(retval.content);
    }else{
      console.log('PhantomJS server error', retval);
      throw new Meteor.Error(500, 'method-error');
    };
  };

  // Check port status then start PhantomJS
  var fut = new Future();
  var portStatus = getPortStatus(port);
  if(portStatus === 'in-use'){
    // Port in use by a different server
    throw new Meteor.Error(500, 'port-in-use');
  }else if(portStatus !== undefined){
    // Port has phantomjs, check if orphaned
    fs.readFile('/proc/' + portStatus + '/status',
        Meteor.bindEnvironment(function(error, data){
      if(error) throw new Meteor.Error(500, error);
      data = String(data);
      var pPid = data.match(/PPid:[\s]+[0-9]+/);
      if(pPid.length === 0){
        throw new Meteor.Error(500, 'server-error');
      };
      // Extract from matched array
      pPid = pPid[0].substr(5).trim();
      fs.readFile('/proc/' + pPid + '/status',
          Meteor.bindEnvironment(function(error, parentStatus){
        if(error) throw new Meteor.Error(500, error);
        parentStatus = String(parentStatus);
        var isInit = /^Name:[\s]+init/.test(parentStatus);
        if(isInit){
          process.kill(portStatus, 'SIGINT');
          if(options.debug){
            console.log("Recovering orphaned port ", port);
          };
          fut['return'](phantomLaunch(options));
        };
      }));
    }));
  }else{
    // Port is open
    var command = shell.spawn(phantomjs.path,
      [assetDir + 'src/phantom-server.js', port]);
    if(options.debug){
      command.stdout.pipe(process.stdout);
    };
    command.stderr.pipe(process.stderr);
    command.stdout.on('data', Meteor.bindEnvironment(function(data){
      data = String(data).trim();
      if(data.substr(-6) === 'Ready.'){
        fut['return'](executive);
      };
    }));
    command.on('exit', Meteor.bindEnvironment(function(code){
      // Restart on exit
      phantomLaunch(options);
    }));
  };
  return fut.wait();
};


// Return undefined if port open,
//        'in-use'  if port occupied by other server
//        pid       if port occupied by phantomjs server
var getPortStatus = function(port){
  var fut = new Future();
  var command  = shell.spawn('lsof', ['-i:' + port]);
  command.stdout.on('data', Meteor.bindEnvironment(function(data){
    if(!fut.isResolved()){
      data = String(data).split('\n');
      if(data.length < 3){
        return fut['return'](undefined);
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
        fut['return'](undefined);
      };
    }, 100);
  }));
  return fut.wait();
};
