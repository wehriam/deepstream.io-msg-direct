var net = require( 'net' ),
    events = require( 'events' ),
    util = require( 'util' );

var Connection = function( urlOrSocket, config ) {
    this._config = config;
    this._socket = this._getSocket( urlOrSocket );
};

util.inherits( Connection, events.EventEmitter );

Connection.prototype.getRemoteUrl = function() {
    return this._socket.url;
};

Connection.prototype._getSocket = function( urlOrSocket ) {
    if( urlOrSocket instanceof net.Socket ) {
        return urlOrSocket;
    }
    
    var parts = urlOrSocket.split( ':' ),
        options = {
            host: parts[ 0 ],
            port: parseInt( parts[ 1 ], 10 ),
            localAddress: this._config.localHost + ':' + this._config.localPort
        };
        
        
    if( !options.host || !options.port ) {
        this.emit( 'error', 'invalid URL ' + urlOrSocket );
        return;
    }
    
    return net.createConnection( options );
};

module.exports = Connection;