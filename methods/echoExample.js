// Example method that simply returns the options provided, with one extra
(function(){

methods.echo = function(options, callback){
  if(typeof options === 'object'){
    options.echoed = "fo'sho";
  };
  callback(undefined, options);
};

})();
