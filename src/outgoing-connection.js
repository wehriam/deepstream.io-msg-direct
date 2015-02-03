var net = require( 'net' ),
    events = require( 'events' ),
    util = require( 'util' );

var OutgoingConnection = function( url, config ) {
    this._config = config;
    this._params = this._parseUrl( url );
    this._connectionAttempts = 0;
    this._socket = null;
    this._reconnectTimeout = null;
    this._createSocket();
};

util.inherits( OutgoingConnection, events.EventEmitter );

OutgoingConnection.prototype.getRemoteUrl = function() {
    return this._socket.remoteAddress + ':' + this._socket.remotePort;
};

OutgoingConnection.prototype.send = function( message ) {
    this._socket.write( message, 'utf8' );
};

OutgoingConnection.prototype._onData = function( data ) {
    console.log( 'received data', data );
};

OutgoingConnection.prototype._onDisconnect = function( data ) {
    console.log( 'received data', data );
};

OutgoingConnection.prototype._onSocketError = function( error ) {
    if( error.code === 'ECONNREFUSED' ) {
        this._scheduleReconnect();
    } else {
        this.emit( 'error', error );
    }
};

OutgoingConnection.prototype._scheduleReconnect = function() {
    this._connectionAttempts++;
        
    if( this._connectionAttempts <= this._config.maxReconnectAttepts ) {
        this._destroySocket()
        this._reconnectTimeout = setTimeout( this._createSocket.bind( this ), this._config.reconnectInterval );
    } else {
        this.emit( 'error', 'max reconnection attempts (' + this._config.maxReconnectAttepts + ') exceeded' );
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
    console.log( 'CONNECT', this._params );
    this._socket = net.createConnection( this._params );
    this._socket.setEncoding( 'utf8' );
    this._socket.setKeepAlive( true, 2000 );
    this._socket.setNoDelay( true );
    this._socket.on( 'error', this._onSocketError.bind( this ) );
    this._socket.on( 'data', this._onData.bind( this ) );
    this._socket.on( 'end', this._onDisconnect.bind( this ) );
};

module.exports = OutgoingConnection;