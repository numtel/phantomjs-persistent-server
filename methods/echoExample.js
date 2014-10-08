console.log('Loading echo example...');
methods.echo = function(options, callback){
  var output;
  try{
    output = JSON.stringify(options);
  }catch(err){
    callback(err, undefined);
    return;
  };
  callback(undefined, output);
};
