testAsyncMulti 'phantomjs-queue', [
  (test, expect) ->
    phantomExec = phantomLaunch(['methods/echoExample.js'])
    console.log(phantomExec('echo', {cow: 'horse'}));
    test.equal true, true
]
