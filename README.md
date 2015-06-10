deepstream.io-msg-direct [![npm version](https://badge.fury.io/js/deepstream.io-msg-direct.svg)](http://badge.fury.io/js/deepstream.io-msg-direct)
======================

[deepstream](http://deepstream.io) message connector for direct tcp connections between all deepstream nodes


##Basic Setup
```javascript
var Deepstream = require( 'deepstream.io' ),
    DirectMessageConnector = require( 'deepstream.io-msg-direct' ),
    server = new Deepstream();

var directMessageConnector =new DirectMessageConnector({
  localhost: 0.0.0.0,
  localpost: 6024,
  remoteUrls: [ 'deepstream-one:6024', 'deepstream-two:6024' ]
});
server.set( 'messageConnector', directMessageConnector);

server.start();

//Add another deepstream node during runtime
directMessageConnector.addPeer( 'deepstream-three:6024' );

//Remove another deepstream node during runtime
directMessageConnector.removePeer( 'deepstream-one:6024' );
```

