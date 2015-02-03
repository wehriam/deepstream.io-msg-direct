var MessageConnector = require( './src/message-connector' );

var conA = new MessageConnector({
	localport: 3000, 
	localhost: 'localhost', 
	remoteUrls: [ 'localhost:3001' ],
	reconnectInterval: 100,
	maxReconnectAttepts: 10
});

var conB = new MessageConnector({
	localport: 3001, 
	localhost: 'localhost', 
	remoteUrls: [ 'localhost:3000' ],
	reconnectInterval: 100
});

var test = function() {
	conA.subscribe( 'ducks', function(){
		console.log( 'received', arguments );	
	});
};
var checkReady = function() {
	if( conA.isReady && conB.isReady ) {
		test();
	}
};
conA.on( 'ready', checkReady );
conB.on( 'ready', checkReady );