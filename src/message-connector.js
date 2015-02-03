var events = require( 'events' ),
	util = require( 'util' ),
	net = require( 'net' ),
	IncomingConnection = require( './incoming-connection' ),
	OutgoingConnection = require( './outgoing-connection' ),
	pckg = require( '../package.json' ),
	TOPIC_SEPERATOR = String.fromCharCode( 29 ),
	SUBSCRIBE = '__S',
	UNSUBSCRIBE = '__U';

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
 *     reconnectInterval: <Number> e.g. 2000  // time between reconnection attempts in ms
 *     maxReconnectAttepts: <Number> e.g. 10 // number of attempts after a remote server is assumed dead
 * }
 *
 * @constructor
 */
var MessageConnector = function( config ) {
	this.isReady = false;
	this.name = pckg.name;
	this.version = pckg.version;
	
	this._emitter = new events.EventEmitter();
	
	this._config = config;
	this._checkConfig();
	this._config.reconnectInterval = this._config.reconnectInterval || 2000;
	this._config.maxReconnectAttepts = this._config.maxReconnectAttepts || Infinity;
	
	this._tcpServer = net.createServer( this._onIncomingConnection.bind( this ) );
	this._tcpServer.listen( config.localport, config.localhost, this._onServerReady.bind( this ) );
	
	this._connections = [];
	this._config.remoteUrls.forEach( this.addPeer.bind( this ) );
};

util.inherits( MessageConnector, events.EventEmitter );

MessageConnector.prototype.addPeer = function( url ) {
	if( !this._isConnectedTo( url ) ) {
		this._addConnection( new OutgoingConnection( url, this._config ) );
	}
};

MessageConnector.prototype.removePeer = function( url ) {
	
};

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
	this._emitter.removeListener( topic, callback );
		
	if( this._emitter.listeners( topic ).length === 0 ) {
		this.publish( UNSUBSCRIBE, topic );
	}
};

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
		this.publish( SUBSCRIBE, topic );
	}
	
	this._emitter.addListener( topic, callback );
};

/**
 * Publishes a message on a topic
 *
 * Please note: message is a javascript object. Its up to the client
 * to serialize it. message will look somewhat like this:
 *
 * {
 * 		topic: 'R',
 * 		action: 'P',
 * 		data: [ 'user-54jcvew34', 32, 'zip', 'SE34JN' ]
 * }
 *
 * @param   {String}   topic
 * @param   {Object}   message
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.publish = function( topic, message ) {
	var msg = topic + TOPIC_SEPERATOR + message,
		i;
	
	for( i = 0; i < this._connections.length; i++ ) {
		this._connections[ i ].send( msg );
	}
};

MessageConnector.prototype._isConnectedTo = function( url ) {
	for( var i = 0; i < this._connections.length; i++ ) {
		console.log( this._connections[ i ].getRemoteUrl() );
		if( this._connections[ i ].getRemoteUrl() === url ) {
			return true;
		}
	}
	
	return false;
};

MessageConnector.prototype._checkConfig = function() {
	if( typeof this._config.localhost !== 'string' ) {
		throw new Error( 'Missing parameter \'localhost\'' );
	}
	
	if( typeof this._config.localport !== 'number' ) {
		throw new Error( 'Missing parameter \'localport\'' );
	}
	
	if( typeof this._config.remoteUrls !== 'object' || this._config.remoteUrls.length === 0 ) {
		throw new Error( 'Missing parameter \'remoteUrls\'' );
	}
};

MessageConnector.prototype._onIncomingConnection = function( socket ) {
	if( !this._isConnectedTo( socket.remoteAddress + ':' + socket.remotePort ) ) {
		
	}
	this._addConnection( new IncomingConnection( socket, this._config ) );
};

MessageConnector.prototype._addConnection = function( connection ) {
	connection.on( 'close', this._removeConnection.bind( this, connection ) );
	connection.on( 'error', this._onConnectionError.bind( this, connection ) );
	connection.on( 'msg', this._onMessage.bind( this ) );
	
	this._connections.push( connection );
};

MessageConnector.prototype._onMessage = function( msg ) {
	
};

MessageConnector.prototype._removeConnection = function( connection ) {
	this._connections.splice( this._connections.indexOf( connection ), 1 );	
};

MessageConnector.prototype._onConnectionError = function( connection, errorMsg ) {
	console.log( 'Direct connection ' + connection.getRemoteUrl() + ' ' + errorMsg );
	this.emit( 'error', 'Direct connection ' + connection.getRemoteUrl() + ' ' + errorMsg );
}

MessageConnector.prototype._onServerReady = function() {
	this.isReady = true;
	this.emit( 'ready' );
};

module.exports = MessageConnector;