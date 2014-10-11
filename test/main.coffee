# phantomjs-persistent-server
# MIT License ben@latenightsketches.com
# Main Test Runner

console.time 'phantomLaunch'
phantomExec = phantomLaunch()
console.timeEnd 'phantomLaunch'

testAsyncMulti 'phantomjs-persistent-server - echo', [
  (test, expect) ->
    sample = {cow: 'horse'}
    echoTest = (options, callback) ->
      callback undefined, options
    result = phantomExec echoTest, sample
    test.isTrue _.isEqual result, sample
]

testAsyncMulti 'phantomjs-persistent-server - no arguments', [
  (test, expect) ->
    argTest = (callback) ->
      callback undefined, 'someval'
    result = phantomExec argTest
    test.isTrue _.isEqual result, 'someval'
]

testAsyncMulti 'phantomjs-persistent-server - many arguments', [
  (test, expect) ->
    argTest = (callback) ->
      args = Array.prototype.slice.call arguments, 0
      callback = args.pop()
      sum = args.reduce (prev, cur) ->
        return prev + cur
      callback undefined, sum
    result = phantomExec argTest, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
    # result is the sum of 1..13
    max = 13
    test.isTrue _.isEqual result, (max * (max + 1)) / 2
]

titleTest = (url, callback) ->
  webpage = require 'webpage'
  page = webpage.create()
  page.open url, (status) ->
    if status == 'fail'
      callback 'load-failure'
    else
      title = page.evaluate ()->
        return document.title
      callback undefined, title

testAsyncMulti 'phantomjs-persistent-server - get page title (success)', [
  (test, expect) ->
    result = phantomExec titleTest, 'http://google.com/'
    test.isTrue _.isEqual result, 'Google'
]

testAsyncMulti 'phantomjs-persistent-server - get page title (failure)', [
  (test, expect) ->
    try
      result = phantomExec titleTest, 'http://asjdfoafm/'
    catch err
      test.equal err.toString(),
        'Error: failed [500] {"error":500,"reason":"load-failure"}'
      hadError = true
    finally
      test.isTrue hadError
]
