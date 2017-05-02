deepstream.io-msg-direct [![npm version](https://badge.fury.io/js/deepstream.io-msg-direct.svg)](http://badge.fury.io/js/deepstream.io-msg-direct)
======================

[![Greenkeeper badge](https://badges.greenkeeper.io/deepstreamIO/deepstream.io-msg-direct.svg)](https://greenkeeper.io/)

[deepstream](http://deepstream.io) message connector for direct tcp connections between all deepstream nodes


##Basic Setup
```yaml
plugins:
  message:
    name: direct
    options:
      localport: localPort
      localhost: localHost
      remoteUrls:
        - localhost:remotePort1
        - localhost:remotePort2
      reconnectInterval: 100
      securityToken: securityToken
      minimumRequiredConnections: 0
```

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

