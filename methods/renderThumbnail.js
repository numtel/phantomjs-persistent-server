// phantomjs-queue
// MIT License ben@latenightsketches.com
// Return a PNG data URI string thumbnail of html code

// 4 Required Options:
// html      - string containing the page's html source
// testWidth - integer width of viewport in pixels
// width     - integer width of thumbnail image
// height    - integer width of thumbnail image
(function(){

methods.renderThumbnail = function(options, callback){
  var page = require('webpage').create();
  var testWidth = options.testWidth;
  var thumbWidth = options.width;
  var thumbHeight = options.height;
  var pageHtml = options.html;

  page.zoomFactor = thumbWidth / testWidth;
  page.viewportSize = {
    width: thumbWidth * page.zoomFactor,
    height: thumbHeight * page.zoomFactor
  };

  var resourceFailures = [];
  page.onResourceReceived = function(response) {
    if(response.stage === 'end' && response.status !== 200){
      resourceFailures.push(response.url);
    };
  };

  page.onLoadFinished = function(status){
    if(status === 'success'){
      if(resourceFailures.length){
        callback({code: 'resource-failed', data: resourceFailures});
        return;
      };
      var imageData = page.renderBase64('PNG');
      callback(undefined, 'data:image/png;base64,' + imageData);
      return;
    }else{
      callback({code: 'invalid-html'});
      return;
    };
  };

  page.setContent(pageHtml, 'http://localhost/');
};

})();
