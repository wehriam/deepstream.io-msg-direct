var events = require( 'events' ),
	util = require( 'util' ),
	MESSAGE = require( './message-enums' ),
	ERRORS = require( './errors' );

var PendingConnection = function( connection, messageConnector ) {
	this._connection = connection;
	this._messageConnector = messageConnector;
	this._completeFn = this._complete.bind( this );
	this._onMessageFn = this._onMessage.bind( this );
	
	this._connection.on( 'close', this._completeFn );
	this._connection.on( 'error', this._completeFn );
	this._connection.on( 'msg', this._onMessageFn );
	
	this._connectionTimeout = setTimeout( this._completeFn, 2000 );
	this._sendIdentification();
};

util.inherits( PendingConnection, events.EventEmitter );


PendingConnection.prototype._onMessage = function( msg ) {
	if( msg.length < 2 ) {
		this._reject( ERRORS.INVALID_MESSAGE );
		return;
	}
	
	var msgType = msg[ 0 ],
		msgData = msg.substr( 1 );
		
	if( msgType === MESSAGE.IDENTIFY ) {
		this._checkIdentification( msgData );
	}
	else if( msgType === MESSAGE.REJECT ) {
		this._onRejected( msgData );
	}
};

PendingConnection.prototype._checkIdentification = function( msg ) {
	var data;
	
	try{
		data = JSON.parse( msg );
	} catch( e ) {
		this._reject( ERRORS.MESSAGE_PARSE_ERROR );
		return;
	}
	
	if( data.securityToken !== this._messageConnector.getSecurityToken() ) {
		this._reject( ERRORS.INVALID_SECURITY_TOKEN );
		return;
	}
	
	if( this._messageConnector.isConnectedToPeer( data.uid ) ) {
		this._reject( ERRORS.DUPLICATE_CONNECTION );
		return;
	}
	
	this._connection.remoteUid = data.uid;
	this.emit( 'open', this._connection );
	this._complete();
};

PendingConnection.prototype._reject = function( error ) {
	this._connection.send( MESSAGE.REJECT + error );
	setTimeout( this._destroyConnection.bind( this ), 20 );
};

PendingConnection.prototype._destroyConnection = function() {
	if( !this._connection ) {
		return;
	}
	
	this._connection.destroy();
	this._complete();
};

PendingConnection.prototype._onRejected = function( reason ) {
	var msg = 'Connection to ' + this._connection.getRemoteUrl() + ' was rejected due to ' + reason;

	this._messageConnector.emit( 'error', msg );
	this._connection.isRejected = true;
	this._complete();
};

PendingConnection.prototype._complete = function( connection ) {
	clearTimeout( this._connectionTimeout );
	this.removeAllListeners();
	this._connection.removeListener( 'close', this._completeFn );
	this._connection.removeListener( 'error', this._completeFn );
	this._connection.removeListener( 'msg', this._onMessageFn );
	this._connection = null;
	this._messageConnector = null;
};

PendingConnection.prototype._sendIdentification = function() {
	var identificationData = {
		uid: this._messageConnector.getUid(),
		securityToken: this._messageConnector.getSecurityToken()
	};
	
	this._connection.send( MESSAGE.IDENTIFY + JSON.stringify( identificationData ) );
};
module.exports = PendingConnection;