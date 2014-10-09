// Extract computed styles and applied rules of all elements in html code
// 3 Required Options:
// html   - string containing the page's html source
// url    - string matches the same origin as the stylesheets in order to read
//          the applied rules (security policy)
// widths - string (integers, comma separated) specify which viewport widths in
//          pixels to test
(function(){

methods.extractStyles = function(options, callback){
  var pageHtml = options.html;
  var testUrl = options.url;
  var testWidths = options.widths.split(',');
  
  var page = require('webpage').create();

  var resourceFailures = [];
  page.onResourceReceived = function(response) {
    if(response.stage === 'end' && response.status !== 200){
      resourceFailures.push(response);
    };
  };

  page.onLoadFinished = function(status){
    if(status === 'success'){
      if(resourceFailures.length){
        callback({code: 'resource-failed', data: resourceFailures});
        return;
      };
      var collected = {};
      testWidths.forEach(function(testWidth){
        page.viewportSize = {
          width: testWidth,
          height: 800
        };
        var output = page.evaluate(function(){
          var elementStyleAttributes = function(el, style){
            if(style === undefined){
              style = window.getComputedStyle(el);
            };
            var attributes = {};
            var propertyName;
            for(var j = 0; j<style.length; j++){
              propertyName = style.item(j);
              attributes[propertyName] = style.getPropertyValue(propertyName);
            };
            return attributes;
          };
          var extractChildStyles = function(base, baseSelector){
            if(baseSelector === undefined){
              baseSelector = '';
            };
            var output = [];
            for(var i = 0; i < base.children.length; i++){
              var child = base.children[i];
              var classes = '';
              for(var j = 0; j<child.classList.length; j++){
                classes += '.' + child.classList[j];
              };
              var selector = baseSelector + '>' + child.nodeName + 
                             (child.id ? '#' + child.id : '') + classes +
                             ':nth-child(' + (i+1) + ')';

              // getMatchedCSSRules only works for stylesheets from the same origin
              var ruleList = child.ownerDocument.defaultView.getMatchedCSSRules(child, '');
              var rules = [];
              if(ruleList){
                for(var j = 0; j<ruleList.length; j++){
                  rules.push({
                    selector: ruleList[j].selectorText,
                    sheet: ruleList[j].parentStyleSheet.href,
                    attributes: elementStyleAttributes(undefined, ruleList[j].style)
                  });
                };
              };

              output.push({
                ignore: child.attributes.hasOwnProperty('test-ignore'),
                selector: selector,
                attributes: elementStyleAttributes(child),
                rules: rules,
                children: extractChildStyles(child, selector)
              });
            };
            return output;
          };
          // Recurse through <body> children
          var elementStyles = extractChildStyles(document.body, 'BODY');
          // <html> and <body> separately
          [['HTML', document.documentElement], 
           ['BODY', document.body]]
          .forEach(function(additional){
            elementStyles.push({
              ignore: additional[1].attributes.hasOwnProperty('test-ignore'),
              selector: additional[0],
              attributes: elementStyleAttributes(additional[1]),
              children: []
            });
          });
          return elementStyles;
        });
        collected[testWidth] = output;
      });
      callback(undefined, collected);
      return;
    }else{
      callback({code: 'invalid-html'});
      return;
    };
  };

  page.setContent(pageHtml, testUrl);
};

})();
