var events = require( 'events' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' );

var AbstractConnection = function() {
	this.isRejected = false;
};

util.inherits( AbstractConnection, events.EventEmitter );

AbstractConnection.prototype.getRemoteUrl = function() {
	return this._socket.remoteAddress + ':' + this._socket.remotePort;
};

AbstractConnection.prototype.send = function( message ) {
	this._socket.write( message + MESSAGE.MESSAGE_SEPERATOR, 'utf8' );
};

AbstractConnection.prototype.destroy = function() {
	
};

AbstractConnection.prototype._configureSocket = function(  ) {
	this._socket.setEncoding( 'utf8' );
	this._socket.setKeepAlive( true, 2000 );
	this._socket.setNoDelay( true );
	this._socket.on( 'error', this._onSocketError.bind( this ) );
	this._socket.on( 'data', this._onData.bind( this ) );
	this._socket.on( 'end', this._onDisconnect.bind( this ) );
	this._socket.on( 'connect', this.emit.bind( this, 'connect') );
};

AbstractConnection.prototype._onData = function( data ) {
	var messages = data.split( MESSAGE.MESSAGE_SEPERATOR ),
		i;
	
	for( i = 0; i < messages.length - 1; i++ ) {
		this.emit( 'msg', messages[ i ] );
	}
};

AbstractConnection.prototype._onSocketError = function() {};
AbstractConnection.prototype._onDisconnect = function() {};

module.exports = AbstractConnection;