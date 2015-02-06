var net = require( 'net' ),
    events = require( 'events' ),
    util = require( 'util' );

var IncomingConnection = function( socket ) {
    this._socket = socket;
    this._socket.setEncoding( 'utf8' );
    this._socket.setKeepAlive( true, 2000 );
    this._socket.setNoDelay( true );
    this._socket.on( 'error', this._onSocketError.bind( this ) );
    this._socket.on( 'data', this._onData.bind( this ) );
    this._socket.on( 'end', this._onDisconnect.bind( this ) );
};

util.inherits( IncomingConnection, events.EventEmitter );

IncomingConnection.prototype.getRemoteUrl = function() {
	return this._socket.remoteAddress + ':' + this._socket.remotePort;	
};

IncomingConnection.prototype.getRemoteId = function() {
    this.emit()
};

IncomingConnection.prototype.send = function( message ) {
    this._socket.write( message, 'utf8' );
};

IncomingConnection.prototype._onData = function( data ) {
    this.emit( 'msg', data );
};

IncomingConnection.prototype._onDisconnect = function( data ) {
    console.log( 'disconnect', data );
};

IncomingConnection.prototype._onSocketError = function( error ) {
    this.emit( 'error', error );
};

module.exports = IncomingConnection;