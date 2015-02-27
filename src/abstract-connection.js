var events = require( 'events' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' );

var AbstractConnection = function() {
	this.isRejected = false;
	this.isClosed = false;
};

util.inherits( AbstractConnection, events.EventEmitter );

AbstractConnection.prototype.getRemoteUrl = function() {
	return this._socket.remoteAddress + ':' + this._socket.remotePort;
};

AbstractConnection.prototype.send = function( message ) {
	this._socket.write( message + MESSAGE.MESSAGE_SEPERATOR, 'utf8' );
};

AbstractConnection.prototype.destroy = function() {
	if( !this.isClosed ) {
		this._socket.setKeepAlive( false );
		this._socket.destroy();
	}
};

AbstractConnection.prototype._configureSocket = function(  ) {
	this._socket.setEncoding( 'utf8' );
	this._socket.setKeepAlive( true, 2000 );
	this._socket.setNoDelay( true );
	this._socket.on( 'error', this._onSocketError.bind( this ) );
	this._socket.on( 'data', this._onData.bind( this ) );
	this._socket.on( 'close', this._onClose.bind( this ) );
	this._socket.on( 'connect', this.emit.bind( this, 'connect') );
};

AbstractConnection.prototype._onData = function( data ) {
	var messages = data.split( MESSAGE.MESSAGE_SEPERATOR ),
		i;
	
	for( i = 0; i < messages.length - 1; i++ ) {
		if( messages[ i ] === MESSAGE.CLOSE ) {
			this._onClose();
		} else {
			this.emit( 'msg', messages[ i ] );
		}
	}
};

AbstractConnection.prototype._onSocketError = function() {};

AbstractConnection.prototype._onClose = function() {
	this.isClosed = true;
	setTimeout( this.emit.bind( this, 'closed' ), 20 );
};

module.exports = AbstractConnection;