/* global describe, it, expect */

var MessageConnector = require( '../src/message-connector' );

describe( 'security features work', function(){
	var connectorA,
		connectorB;
	
	it( 'errors when no securityToken is provided', function(){
		expect(function(){
			new MessageConnector({
				localport: 2007, 
				localhost: 'localhost', 
				remoteUrls: [ 'localhost:2008' ],
				reconnectInterval: 100,
				minimumRequiredConnections: 0
			});
		}).toThrow();	
	});
	
	it( 'starts messageConnectorA', function( done ){
		connectorA = new MessageConnector({
			localport: 2007, 
			localhost: 'localhost', 
			remoteUrls: [ 'localhost:2008' ],
			reconnectInterval: 100,
			minimumRequiredConnections: 0,
			securityToken: 'tokenA'
		});
		
		connectorA.on( 'ready', done );
		connectorA.on( 'error', function(){});
	});
	
	it( 'rejects connector with different security token', function( done ) {
	    connectorB = new MessageConnector({
			localport: 2008, 
			localhost: 'localhost', 
			remoteUrls: [ 'localhost:2007' ],
			reconnectInterval: 100,
			minimumRequiredConnections: 1,
			securityToken: 'tokenB'
		});
		
		connectorB.on( 'ready', function() {
		    expect( 'here' ).toBe( 'never called' );
		});
		
		connectorB.on( 'error', function( error ){
			expect( error.indexOf( 'INVALID_SECURITY_TOKEN' ) ).not.toBe( -1 );
			done();
		});
	});
	
	it( 'destroyes connectorA', function(done) {
		connectorA.on( 'close', done );
	    connectorA.close();
	});
	
	it( 'destroyes connectorB', function(done) {
		connectorB.on( 'close', done );
	    connectorB.close();
	});
});