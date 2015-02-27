var net = require( 'net' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' ),
	AbstractConnection = require( './abstract-connection' );

/**
 * Represents a TCP connection made by this deepstream instance
 * to another deepstream instance. It is the Outgoing Connection's
 * responsibility to handle reconnection if the connection is lost.
 *
 * @constructor
 * @extends {AbstractConnection}
 * 
 * @param {String} url    A basic URL without protocol <host>:<port>
 * @param {Object} config The configuration as passed to the MessageConnector
 */
var OutgoingConnection = function( url, config ) {
	AbstractConnection.call( this );
	
	this._config = config;
	this._params = this._parseUrl( url );
	this._connectionAttempts = 0;
	this._socket = null;
	this._reconnectTimeout = null;
	this._createSocket();
};

util.inherits( OutgoingConnection, AbstractConnection );

/**
 * Listener for socket errors.
 * 
 * If the connection is lost, but not rejected, this class
 * will attempt to reconnect
 *
 * @param   {Error} error
 *
 * @private
 * @returns {void}
 */
OutgoingConnection.prototype._onSocketError = function( error ) {
	if( error.code === 'ECONNREFUSED' && this.isRejected === false ) {
		this._scheduleReconnect();
	} else {
		this.emit( 'error', error );
	}
};

/**
 * Schedules the next reconnection attempt. If the number of failed attempts
 * exceeds the considered threshold no additional attempts will be made
 * and the connection emits an error event
 *
 * @private
 * @returns {void}
 */
OutgoingConnection.prototype._scheduleReconnect = function() {
	this._connectionAttempts++;
	
	if( this._connectionAttempts <= this._config.maxReconnectAttempts ) {
		this._destroySocket();
		this._reconnectTimeout = setTimeout( this._createSocket.bind( this ), this._config.reconnectInterval );
	} else {
		this.emit( 'error', 'max reconnection attempts (' + this._config.maxReconnectAttempts + ') exceeded' );
	}
};

/**
 * Parses the provided url strings and constructs a connection parameter
 * object. If a localhost and -port is specified, it will be used, otherwise
 * the system will work out the local port itself
 *
 * @param {String} url    A basic URL without protocol <host>:<port>
 *
 * @private
 * @returns {Object} connectionParameter
 */
OutgoingConnection.prototype._parseUrl = function( url ) {
	var parts = url.split( ':' ),
		params = {
			host: parts[ 0 ],
			port: parseInt( parts[ 1 ], 10 )
		};
		
	if( this._config.localHost && this._config.localPort ) {
		params.localAddress = this._config.localHost + ':' + this._config.localPort;
	}
	
	if( !params.host || !params.port ) {
		this.emit( 'error', 'invalid URL ' + url );
	} else {
		return params;
	}
};

/**
 * Destroys the connection
 *
 * @private
 * @returns {void}
 */
OutgoingConnection.prototype._destroySocket = function() {
	clearTimeout( this._reconnectTimeout );
	this._socket.destroy();
	this._socket.removeAllListeners();
};

/**
 * Creates the socket, based on the connection parameters
 *
 * @private
 * @returns {void}
 */
OutgoingConnection.prototype._createSocket = function() {
	this._socket = net.createConnection( this._params );
	this._configureSocket();
};

module.exports = OutgoingConnection;