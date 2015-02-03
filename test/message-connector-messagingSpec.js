/* global describe, it, expect, jasmine */
var MessageConnector = require( '../src/message-connector' ),
	getSettings = function( localPort, remotePort1, remotePort2 ) {
		return {
			localport: localPort, 
			localhost: 'localhost', 
			remoteUrls: [ 'localhost:' + remotePort1, 'localhost:' + remotePort2 ],
			reconnectInterval: 100
		};
	},
	MESSAGE_TIME = 20;

describe( 'Messages are send between multiple instances', function(){
	var connectorA,
		connectorB,
		connectorC,
		callback_A1 = jasmine.createSpy( 'callback_A1' ),
		callback_B1 = jasmine.createSpy( 'callback_B1' ),
		callback_C1 = jasmine.createSpy( 'callback_C1' );
		
	it( 'creates connectorA', function( done ){
		connectorA = new MessageConnector( getSettings( 2001, 2002, 2003 ) );
		expect( connectorA.isReady ).toBe( false );
		connectorA.on( 'ready', done );
		connectorA.on( 'error', function( e ){ throw e; });
	});
	
	it( 'creates connectorB', function( done ) {
	    connectorB = new MessageConnector( getSettings( 2002, 2001, 2003 ) );
	    expect( connectorB.isReady ).toBe( false );
		connectorB.on( 'ready', done );
	});
	
	it( 'creates connectorC', function( done ) {
	    connectorC = new MessageConnector( getSettings( 2003, 2001, 2002 )  );
	    expect( connectorC.isReady ).toBe( false );
		connectorC.on( 'ready', done );
	});

	it( 'subscribes to a topic', function( done ){
		connectorA.subscribe( 'topic1', callback_A1 );
		connectorB.subscribe( 'topic1', callback_B1 );
		connectorC.subscribe( 'topic1', callback_C1 );
		expect( callback_A1 ).not.toHaveBeenCalled();
		setTimeout( done, MESSAGE_TIME );
	});
	
	// it( 'connectorB sends a message', function( done ){
	// 	connectorB.publish( 'topic1', { some: 'data' } );
	// 	setTimeout( done, MESSAGE_TIME );
	// });
	
	// it( 'connectorA and connectorC have received the message', function(){
	// 	expect( callback_A1 ).toHaveBeenCalledWith({ some: 'data' });
	// 	expect( callback_B1 ).not.toHaveBeenCalled();
	// 	expect( callback_C1 ).toHaveBeenCalledWith({ some: 'data' });
	// });
	
	// it( 'connectorC sends a message', function( done ){
	// 	connectorC.publish( 'topic1', { other: 'value' } );
	// 	setTimeout( done, MESSAGE_TIME );
	// });
	
	// it( 'connectorA and connectorB have received the message', function(){
	// 	expect( callback_A1 ).toHaveBeenCalledWith({ other: 'value' });
	// 	expect( callback_B1 ).toHaveBeenCalledWith({ other: 'value' });
	// 	expect( callback_C1 ).toHaveBeenCalledWith({ some: 'data' });
	// });
	
	// it( 'connectorA and connectorC send messages at the same time', function( done ){
	// 	connectorA.publish( 'topic1', { val: 'x' } );
	// 	connectorC.publish( 'topic1', { val: 'y' } );
	// 	setTimeout( done, MESSAGE_TIME );
	// });
	
	// it( 'connectorA and connectorB have received the message', function(){
	// 	expect( callback_A1 ).toHaveBeenCalledWith({ val: 'y' });
	// 	expect( callback_B1 ).toHaveBeenCalledWith({ val: 'x' });
	// 	expect( callback_B1 ).toHaveBeenCalledWith({ val: 'y' });
	// 	expect( callback_C1 ).toHaveBeenCalledWith({ val: 'x' });
	// });
	
	// it( 'connectorB unsubscribes', function() {
	//     connectorB.unsubscribe( 'topic1', callback_B1 );
	// });
	
	// it( 'connectorA sends a message', function( done ){
	// 	connectorA.publish( 'topic1', { notFor: 'B' } );
	// 	setTimeout( done, MESSAGE_TIME );
	// });
	
	// it( 'only connector c has received the message', function(){
	// 	expect( callback_A1 ).not.toHaveBeenCalledWith({ notFor: 'B' });
	// 	expect( callback_B1 ).not.toHaveBeenCalledWith({ notFor: 'B' });
	// 	expect( callback_C1 ).toHaveBeenCalledWith({ notFor: 'B' });
	// });
});