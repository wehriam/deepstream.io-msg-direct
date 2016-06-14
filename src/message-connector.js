var events = require( 'events' ),
  util = require( 'util' ),
  net = require( 'net' ),
  IncomingConnection = require( './incoming-connection' ),
  OutgoingConnection = require( './outgoing-connection' ),
  PendingConnection = require( './pending-connection' ),
  RemoteSubscriberRegistry = require( './remote-subscriber-registry' ),
  pckg = require( '../package.json' ),
  MESSAGE = require( './message-enums' )


/**
 * This message connector connects deepstream nodes directly with each other via tcp.
 *
 * The upsides of using direct connections rather than a message broker are increased
 * speed and - of course - one less system that needs to be maintained.
 *
 * This however is offset by a lack of scalability since each server needs to connect to each other server,
 * so you end up with an exponential number of connections as well as higher maintenance since every server needs
 * to know every other server's URL. This could however be automated.
 *
 * Monitoring can also be quite tricky due to the large number of connections.
 *
 * So basically, for smaller clusters of 3-4 nodes that need to communicate with low latency, this
 * might be a good choice. For larger clusters though it make make more sense to use an AMQP broker
 * or Apache Kafka as a messaging backbone.
 *
 *
 * In addition to the message connector interface methods this class offers addPeer( url ) and removePeer( url ) methods
 * to support adding and removing servers at runtime
 *
 * @param {Object} config Connection configuration.
 *
 * {
 *     localhost: <String> e.g. 0.0.0.0
 *     localport: <Number> e.g. 6024
 *     remoteUrls: <Array> e.g. [ '192.168.0.12:6024', 'mydomain:6024' ]
 *     securityToken: <String> A token that all deepstream instances that connect directly to each other need to share
 *     reconnectInterval: <Number> e.g. 2000  // time between reconnection attempts in ms
 *     maxReconnectAttempts: <Number> e.g. 10 // number of attempts after a remote server is assumed dead
 *     minimumRequiredConnections: <Number> e.g. 1 // number of other deepstream instances this instance needs to
 *                            // be connected to before it emits its ready event
 * }
 *
 * @constructor
 */
var MessageConnector = function( config ) {
  this.isReady = false
  this.name = pckg.name
  this.version = pckg.version

  this._serverIsReady = false
  this._emitter = new events.EventEmitter()
  this._remoteSubscriberRegistry = new RemoteSubscriberRegistry()

  this._uid = Math.round( Math.random() * 10000000000000000 ).toString( 36 )
  this._config = config
  this._checkConfig()
  this._config.reconnectInterval = this._config.reconnectInterval || 2000
  this._config.maxReconnectAttempts = this._config.maxReconnectAttempts || Infinity

  if( this._config.minimumRequiredConnections === undefined ) {
    this._config.minimumRequiredConnections = 1
  }

  this._tcpServer = net.createServer( this._onIncomingConnection.bind( this ) )
  this._tcpServer.listen( config.localport, config.localhost, this._onServerReady.bind( this ) )

  this._connections = []
  this._config.remoteUrls.forEach( this.addPeer.bind( this ) )
}

util.inherits( MessageConnector, events.EventEmitter )

MessageConnector.prototype.addPeer = function( url ) {
  var outgoingConnection = new OutgoingConnection( url, this._config )

  outgoingConnection.on( 'connect', () => {
    var pendingConnection = new PendingConnection( outgoingConnection, this )
    pendingConnection.on( 'open', this._addConnection.bind( this ) )
  } )
}

MessageConnector.prototype.removePeer = function( url ) {

}

MessageConnector.prototype.close = function() {
  var connection, i

  for( i = 0; i < this._connections.length; i++ ) {
    connection = this._connections[ i ]
    if( !connection.isClosed ) {
      connection.once( 'closed', this._checkClose.bind( this ) )
      connection.destroy()
    }
  }

  this._checkClose()
}


MessageConnector.prototype._checkClose = function() {
  for( var i = 0; i < this._connections.length; i++ ) {
    if( !this._connections[ i ].isClosed ) {
      return
    }
  }

  if( this._serverIsReady ) {
    this._serverIsReady = false
    this._tcpServer.close( this.emit.bind( this, 'close' ) )
  }
}

MessageConnector.prototype.getUid = function() {
  return this._uid
}

MessageConnector.prototype.getSecurityToken = function() {
  return this._config.securityToken
}

MessageConnector.prototype.isConnectedToPeer = function( peerUid ) {
  for( var i = 0; i < this._connections.length; i++ ) {
    if( this._connections[ i ].remoteUid === peerUid ) {
      return true
    }
  }

  return false
}

/**
 * Unsubscribes a function as a listener for a topic.
 *
 * Often it makes sense to make only one subscription per topic to the messaging
 * middleware and use an eventemitter to notify multiple subscribers of updates
 * for the same topic. This however does mean that the message-connector
 * needs to keep track of the subscribers and unsubscribe from the messaging middleware
 * if all subscribers have unsubscribed
 *
 * @param   {String}   topic
 * @param   {Function} callback
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.unsubscribe = function( topic, callback ) {
  this._emitter.removeListener( topic, callback )

  if( this._emitter.listeners( topic ).length === 0 ) {
    this.publish( MESSAGE.UNSUBSCRIBE, topic )
  }
} 

/**
 * Adds a function as a listener for a topic.
 *
 * It might make sense to only send the subscription to the messaging
 * middleware for the first subscriber for a topic and multiplex incoming
 * messages using an eventemitter
 *
 * @param   {String}   topic
 * @param   {Function} callback
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.subscribe = function( topic, callback ) {
  if( this._emitter.listeners( topic ).length === 0 ) {
    for( var i = 0; i < this._connections.length; i++ ) {
      this._connections[ i ].send( MESSAGE.SUBSCRIBE + topic )
    }
  }

  this._emitter.addListener( topic, callback )
}

/**
 * Publishes a message on a topic
 *
 * Please note: message is a javascript object. Its up to the client
 * to serialize it. message will look somewhat like this:
 *
 * {
 *    topic: 'R',
 *    action: 'P',
 *    data: [ 'user-54jcvew34', 32, 'zip', 'SE34JN' ]
 * }
 *
 * @param   {String}   topic
 * @param   {Object}   message
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.publish = function( topic, message ) {
  var msg, i

  try{
    msg = MESSAGE.MSG + topic + MESSAGE.TOPIC_SEPERATOR + JSON.stringify( message )
  } catch( e ) {
    this.emit( 'error', 'error while serializing message: ' + e.toString() )
    return
  }

  this._remoteSubscriberRegistry.sendMsgForTopic( topic, msg )
}

MessageConnector.prototype.close = function() {
  this._tcpServer.close( this.emit.bind( this, 'close' ) )

  for( var i = 0; i < this._connections.length; i++ ) {
    this._connections[ i ].destroy()
  }
}

MessageConnector.prototype._checkConfig = function() {
  if( typeof this._config.localhost !== 'string' ) {
    throw new Error( 'Missing parameter \'localhost\'' )
  }

  if( typeof this._config.securityToken !== 'string' ) {
    throw new Error( 'Missing parameter \'securityToken\'' )
  }

  if( typeof this._config.localport !== 'number' ) {
    throw new Error( 'Missing parameter \'localport\'' )
  }

  if( typeof this._config.remoteUrls !== 'object' || this._config.remoteUrls.length === 0 ) {
    throw new Error( 'Missing parameter \'remoteUrls\'' )
  }
}

MessageConnector.prototype._onIncomingConnection = function( socket ) {
  var incomingConnection = new IncomingConnection( socket, this._config ),
    pendingConnection = new PendingConnection( incomingConnection, this )

  pendingConnection.on( 'open', this._addConnection.bind( this ) )
}

MessageConnector.prototype._addConnection = function( connection ) {
  connection.on( 'close', this._removeConnection.bind( this, connection ) )
  connection.on( 'error', this._onConnectionError.bind( this, connection ) )
  connection.on( 'msg', this._onMessage.bind( this, connection ) )

  this._connections.push( connection )
  this._checkReady()
}

MessageConnector.prototype._onMessage = function( connection, msg ) {
  var msgType = msg[ 0 ],
    msgContent = msg.substr( 1 )

  if( msgType === MESSAGE.MSG ) {
    var parts = msgContent.split( MESSAGE.TOPIC_SEPERATOR ),
      data

    try{
      data = JSON.parse( parts[ 1 ] )
    } catch( e ) {
      this.emit( 'error', 'error while parsing message: ' + e.toString() )
      return
    }
    this._emitter.emit( parts[ 0 ], data )
  }
  else if( msgType === MESSAGE.SUBSCRIBE ) {
    this._remoteSubscriberRegistry.add( msgContent, connection )
  }
  else if( msgType === MESSAGE.UNSUBSCRIBE ) {
    this._remoteSubscriberRegistry.remove( msgContent, connection )
  } else if( msgType === MESSAGE.ERROR ) {
    console.log( 'ERROR', msg )
  }
}

MessageConnector.prototype._removeConnection = function( connection ) {
  this._connections.splice( this._connections.indexOf( connection ), 1 )
}

MessageConnector.prototype._onConnectionError = function( connection, errorMsg ) {
  this.emit( 'error', 'Direct connection ' + connection.getRemoteUrl() + ' ' + errorMsg )
}

MessageConnector.prototype._onServerReady = function() {
  this._serverIsReady = true
  this._checkReady()
}

MessageConnector.prototype._checkReady = function() {
  if( this._serverIsReady && this._connections.length >= this._config.minimumRequiredConnections ) {
    this.isReady = true
    this.emit( 'ready' )
  }
}

module.exports = MessageConnector