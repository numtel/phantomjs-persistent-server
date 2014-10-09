# PhantomJS Queue Manager Meteor Package

Specify PhantomJS methods and execute them quickly with very little configuration.

[![Build Status](https://travis-ci.org/numtel/phantomjs-queue.svg?branch=master)](https://travis-ci.org/numtel/phantomjs-queue)

## Installation

Run the following command **Not Yet**

    meteor add numtel:phantomjs-queue

## Implements

#### phantomLaunch([method, method], port)

Spool up a PhantomJS instance that can listen for requests on your methods.

* `[method, method]` Specify an array of javascript files relative to this package's asset directory. These methods will be run in the PhantomJS context. Each method file should append to the global `methods` object like so:

        methods.echo = function(options, callback){
          // callback = function(error, result)
          callback(undefined, options);
        }

    See more examples in the `methods` directory.

* `port` Optionally, specify a port to run the PhantomJS server. If left undefined, the port will be determined automatically.

**Returns** function for executing methods.

    // phantomLaunch([...]) -> function(methodKey, options)

    var phantomExec = phantomLaunch(['methods/echoExample.js']);
    var result = phantomExec('echo', {some: 'value'});

