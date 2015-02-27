var net = require( 'net' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' ),
	AbstractConnection = require( './abstract-connection' );

var IncomingConnection = function( socket ) {
	AbstractConnection.call( this );
	
	this._socket = socket;
	this._configureSocket();
};

util.inherits( IncomingConnection, AbstractConnection );

IncomingConnection.prototype._onSocketError = function( error ) {
	this.emit( 'error', error );
};

module.exports = IncomingConnection;