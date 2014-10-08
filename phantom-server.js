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

console.log('PhantomJS server started', JSON.stringify(options), server);

// Load available methods
var methods = {};
var methodsArray = options.methods.split(',');

for(var i = 0; i < methodsArray.length; i++){
  console.log('Loading Method Definition Script...', methodsArray[i]);
  var success = phantom.injectJs(methodsArray[i]);
  console.log(success ? 'Success' : 'Failed');
};

var service = server.listen(options.port, function(request, response) {
  if(request.post && request.post.method && 
      methods.hasOwnProperty(request.post.method)){
    methods[request.post.method](request.post, function(error, result){
      response.statusCode = 200;
      response.write(JSON.stringify(error));
      response.write(JSON.stringify(result));
      response.close();
    });
  }else{
    response.statusCode = 404;
    var errorMethod = {error: 404, reason: 'invalid-method', req: request};
    response.write(JSON.stringify(errorMethod));
    response.close();
  };
});

// TODO die after inactivity
console.log('Ready.');
