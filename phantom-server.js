// phantomjs-queue
// MIT License ben@latenightsketches.com
// Main PhantomJS module, creates server and routes methods

var system = require('system');
var options = {
  port: system.args[1],
  methods: system.args[2] || ''
};

if(!options.port){
  console.log('Must specify port as first argument.');
  phantom.exit(1);
};

var webserver = require('webserver');
var server = webserver.create();

console.log('PhantomJS server starting on port', options.port);

// Load available methods
var methods = {};
var methodsArray = options.methods.split(',');

for(var i = 0; i < methodsArray.length; i++){
  var success = phantom.injectJs(methodsArray[i]);
  if(!success){
    console.log('Failed to load', methodsArray[i]);
  };
};

var service = server.listen(options.port, {
  keepAlive: true
}, function(request, response) {
  if(request.post && request.headers.method && 
      methods.hasOwnProperty(request.headers.method)){
    var packetData = JSON.parse(request.post);
    methods[request.headers.method](packetData, function(error, result){
      var output;
      response.statusCode = 200;
      if(error){
        output = {error: 500, reason: error};
      }else{
        output = result;
      };
      var outputString = JSON.stringify(output || null);
      response.setHeader('Content-Length', outputString.length);
      response.write(outputString);
      response.close();
    });
  }else{
    response.statusCode = 404;
    var error = {error: 404, reason: 'invalid-method', req: request};
    var errorString = JSON.stringify(error);
    response.setHeader('Content-Length', errorString.length);
    response.write(errorString);
    response.close();
  };
});

// TODO die after inactivity
console.log(options.port, 'Ready.');
