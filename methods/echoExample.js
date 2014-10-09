console.log('Loading echo example...');
methods.echo = function(options, callback){
  if(typeof options === 'object'){
    options.echoed = "fo'sho";
  };
  callback(undefined, options);
};
