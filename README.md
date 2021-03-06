# PhantomJS Persistent Server Meteor Package

Synchronously spawn a PhantomJS instance then pass functions to its context
for execution.

[![Build Status](https://travis-ci.org/numtel/phantomjs-persistent-server.svg?branch=master)](https://travis-ci.org/numtel/phantomjs-persistent-server)


## Installation

```bash
$ meteor add numtel:phantomjs-persistent-server
```

## Implements

#### phantomLaunch({...})

Launch a PhantomJS instance that can listen for requests. If PhantomJS is 
installed, the installed version will be used. If not available, the
package `gadicohen:phantomjs` will be used.

**Options:**

Key    | Type |Description
-------|------|------------------------------------------------------
`port` | Integer | Port to run PhantomJS server, leave unspecified for any open port
`forcePort` | Boolean | Kill PhantomJS if currently using port
`debug` | Boolean | Forward PhantomJS stdout as well as other debug info

*Notes:* 

* When using an automatically selected port, automatic code pushes will result in orphaned PhantomJS processes that will exist until the Meteor server closes.
* If specifying a port, `forcePort` must be set to `true` for automatic code pushes to restart the PhantomJS server.

**Returns:** Function for executing methods.

    phantomLaunch() -> function(func, args...)

The first argument, `func` (function), is copied as a string to the PhantomJS
server. This means that it is not included in the context of the surrounding
code but within the PhantomJS context. All parameters must be passed in as
JSON-serializable objects in the following arguments and no external functions
may be called.

The returned function also contains the following properties and methods:
```javascript
var phantomExec = phantomLaunch();
console.log(phantomExec.port) // Print port number
phantomExec.kill() // Kill server (will not kill orphaned processes)
```

## Example in CoffeeScript

Load Google.com and print the page title.

```coffee
if Meteor.isServer
  # Launch PhantomJS server and wait for the server to be ready.
  phantomExec = phantomLaunch()

  # Define a function that will be copied to the server by string and executed
  # in the PhantomJS context. Its arguments include the arguments passed as
  # well as a callback function in the normal style (error, result).
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

  # Perform the request.
  result = phantomExec titleTest, 'http://google.com/'
  console.log result # Print 'Google'
```

## Run Tests

```bash
$ git clone https://github.com/numtel/phantomjs-persistent-server.git
$ cd phantomjs-persistent-server
$ meteor test-packages ./
```

## License

MIT
