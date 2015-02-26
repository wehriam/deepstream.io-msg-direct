var net = require( 'net' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' ),
	AbstractConnection = require( './abstract-connection' );

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

OutgoingConnection.prototype._onSocketError = function( error ) {
	if( error.code === 'ECONNREFUSED' && this.isRejected === false ) {
		this._scheduleReconnect();
	} else {
		this.emit( 'error', error );
	}
};

OutgoingConnection.prototype._scheduleReconnect = function() {
	this._connectionAttempts++;
	
	if( this._connectionAttempts <= this._config.maxReconnectAttempts ) {
		this._destroySocket();
		this._reconnectTimeout = setTimeout( this._createSocket.bind( this ), this._config.reconnectInterval );
	} else {
		this.emit( 'error', 'max reconnection attempts (' + this._config.maxReconnectAttempts + ') exceeded' );
	}
};

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

OutgoingConnection.prototype._destroySocket = function() {
	clearTimeout( this._reconnectTimeout );
	this._socket.destroy();
	this._socket.removeAllListeners();
};

OutgoingConnection.prototype._createSocket = function() {
	this._socket = net.createConnection( this._params );
	this._configureSocket();
};

module.exports = OutgoingConnection;