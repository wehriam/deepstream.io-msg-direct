var MessageConnector = require( './src/message-connector' );

var conA = new MessageConnector({
	localport: 3000, 
	localhost: 'localhost', 
	remoteUrls: [ 'localhost:3001' ],
	reconnectInterval: 100,
	maxReconnectAttepts: 10,
	securityToken: 'bla'
});

var conB = new MessageConnector({
	localport: 3001, 
	localhost: 'localhost', 
	remoteUrls: [ 'localhost:3000' ],
	reconnectInterval: 100,
	securityToken: 'bla'
});

var test = function() {
	conA.subscribe( 'ducks', function( name ){
		console.timeEnd( name );
	});
};
var checkReady = function() {
	if( conA.isReady && conB.isReady ) {
		test();
		send();
	}
};

var sendTime;

var send = function(){
	var name =  Math.random().toString(36);
	console.time( name );
	conB.publish( 'ducks', name );
};


conA.on( 'ready', checkReady );
conB.on( 'ready', checkReady );