# phantomjs-persistent-server
# MIT License ben@latenightsketches.com
# Main Test Runner

methods = ['test/methods/samplePageServer.js']
_.each exampleMethodTestCases, (methodDetails) ->
  methods.push(methodDetails.src)

console.time 'phantomLaunch'
phantomExec = phantomLaunch(methods)
console.timeEnd 'phantomLaunch'

port = exampleMethodSampleServerPort
phantomExec 'startServer', {port: port}

# Count tests so that the sample server can be stopped after the last one
testCount = 0
testFinished = 0

# Test each case in test/cases/exampleMethods.js
_.each exampleMethodTestCases, (methodDetails, methodName) ->
  _.each methodDetails.cases, (testCase, testCaseName) ->
    testCount++
    testAsyncMulti 'phantomjs-persistent-server - Example Method: ' +
                     methodName + ' - ' + testCaseName,
    [ (test, expect) ->
      methodOutput = phantomExec methodName, testCase.options

      testFinished++
      phantomExec 'stopServer' if testCount == testFinished

      if testCase.debug
        console.log JSON.stringify methodOutput
      # Allow multiple partial expectations or one full expectation
      if testCase.output instanceof Array
        testCase.output.forEach (expectedPart) ->
          test.include methodOutput, expectedPart
      else
        test.isTrue _.isEqual methodOutput, testCase.output
    ]


