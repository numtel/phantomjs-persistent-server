# PhantomJS Persistent Server Meteor Package

Synchronously spawn a PhantomJS instance then pass functions to its context
for execution.

## Installation

```bash
$ meteor add numtel:phantomjs-persistent-server
```

## Implements

#### phantomLaunch({...})

Launch a PhantomJS instance that can listen for requests.

**Options:**

Key    | Description
-------|----------------------------------------------------------------------
`port` | Specify a port to run the PhantomJS server. If left undefined, the port will be determined automatically.
`debug` | On `True`, PhantomJS stdout will be forwarded along with other debug info

**Returns:** Function for executing methods.

    phantomLaunch() -> function(func, args...)

The first argument, `func` (function), is copied as a string to the PhantomJS
server. This means that it is not included in the context of the surrounding
code but within the PhantomJS context. All parameters must be passed in as
JSON-serializable objects in the following arguments.

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
