// phantomjs-persistent-server
// MIT License ben@latenightsketches.com
// PhantomJS server (runs in PhantomJS context)

var system = require('system');
var options = {
  port: system.args[1]
};

if(!options.port){
  console.log('Must specify port as first argument.');
  phantom.exit(1);
};

var webserver = require('webserver');
var server = webserver.create();

console.log('PhantomJS server starting on port', options.port);

var service = server.listen(options.port, {
  keepAlive: true
}, function(request, response) {
  
  if(request.post){
    var packetData = JSON.parse(request.post);
    var func = eval('(' + packetData.func + ')');
    var args = packetData.args;

    var funcCallback = function(error, result){
      var output;
      if(error){
        response.statusCode = 500;
        output = {error: 500, reason: error};
      }else{
        response.statusCode = 200;
        output = result;
      };
      var outputString = JSON.stringify(output || null);
      response.setHeader('Content-Length', outputString.length);
      response.write(outputString);
      response.close();
    };
    args.push(funcCallback);
    try{
      func.apply(this, args);
    }catch(err){
      response.statusCode = 500;
      var output = {error: 500, reason: err.toString()};
      var outputString = JSON.stringify(output);
      response.setHeader('Content-Length', outputString.length);
      response.write(outputString);
      response.close();
    };
  }else{
    response.statusCode = 400;
    var error = {error: 400, reason: 'post-required', req: request};
    var errorString = JSON.stringify(error);
    response.setHeader('Content-Length', errorString.length);
    response.write(errorString);
    response.close();
  };
});

// TODO die after inactivity
console.log(options.port, 'Ready.');
