// Extract all <link rel="stylesheet"> and <style> tags from a page by URL
// 1 Required Option:
// url - string url to extract
(function(){

methods.getSheetsFromUrl = function(options, callback){
  var page = require('webpage').create();

  page.open(options.url, function(status){
    if(status === 'success'){
      var output = page.evaluate(function(){
        var output = ''
        var style = document.getElementsByTagName('style');
        for(var i = 0; i<style.length; i++){
          output+= style[i].outerHTML + '\n';
        };
        var link = document.getElementsByTagName('link');
        for(var i = 0; i<link.length; i++){
          if(link[i].rel.toLowerCase() === 'stylesheet'){
            output+='<link rel="stylesheet" media="' + link[i].media + '" '+
                    'href="' + link[i].href + '" type="' + link[i].type + '">\n';
          };
        };
        return output;
      });
      callback(undefined, output);
      return;
    }else{
      callback({code:'load-failure'});
      return;
    };
  });
};

})();
