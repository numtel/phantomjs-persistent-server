// Create a webserver that will serve a sample page with a CSS file for
// testing the provided methods
// 1 Required Option:
// port - integer port to run server
(function(){

var server = require('webserver').create();
var instance;

var serverRequest = function(request, response){
  var output;
  switch(request.url){
    case '/':
      output = [
        '<html><head><title>Test Page</title>',
        '<link rel="stylesheet" href="sample.css">',
        '<style>h2 { color: #00f; }</style></head>',
        '<body><h1>Sample element <em>really</em></h1></body></html>'
      ].join('\n');
      break;
    case '/sample.css':
      output = 'h1 { color: #f00; }';
      break;
    default:
      output = 'Invalid request!';
  };
  response.statusCode = 200;
  response.write(output);
  response.close();
};

methods.startServer = function(options, callback){
  instance = server.listen(options.port, serverRequest);
  if(!instance){
    callback('service-initialize-failure');
  }else{
    callback();
  };
};

methods.stopServer = function(options, callback){
  server.close();
  callback();
};

})();
