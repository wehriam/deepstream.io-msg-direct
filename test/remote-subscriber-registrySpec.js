/* global jasmine, describe, it, expect */

var RemoteSubscriberRegistry = require( '../src/remote-subscriber-registry' ),
	MockConnection = function() {
		this.send = jasmine.createSpy( 'send' );
	};
	
describe('remote subscriber registry', function(){
	var registry, 
		connectionA = new MockConnection(),
		connectionB = new MockConnection();
	
	it( 'creates the registry', function(){
		registry = new RemoteSubscriberRegistry();
		expect( typeof registry.add ).toBe( 'function' );
	});
	
	it( 'adds a subscriber', function() {
	   registry.add( 'topic1', connectionA );
	   registry.sendMsgForTopic( 'topic1', 'msg1' );
	   expect( connectionA.send ).toHaveBeenCalledWith( 'msg1' );
	   expect( connectionB.send ).not.toHaveBeenCalled();
	});
	
	it( 'adds a second subscriber', function() {
	    registry.add( 'topic1', connectionB );
	    registry.sendMsgForTopic( 'topic1', 'msg2' );
	    expect( connectionA.send ).toHaveBeenCalledWith( 'msg2' );
	    expect( connectionB.send ).toHaveBeenCalledWith( 'msg2' );
	});
	
	it( 'ignores multiple subscriptions', function() {
	    registry.add( 'topic1', connectionB );
	});
	
	it( 'adds a subscriber for a different topic', function() {
		registry.add( 'topic2', connectionB );
		registry.sendMsgForTopic( 'topic2', 'msg3' );
		expect( connectionA.send ).not.toHaveBeenCalledWith( 'msg3' );
	    expect( connectionB.send ).toHaveBeenCalledWith( 'msg3' );
	});
	
	it( 'removes a subscriber', function() {
	    registry.remove( 'topic1', connectionA );
	    registry.sendMsgForTopic( 'topic1', 'msg4' );
	    expect( connectionA.send ).not.toHaveBeenCalledWith( 'msg4' );
	    expect( connectionB.send ).toHaveBeenCalledWith( 'msg4' );
	});
	
	it( 'ignores multiple calls to remove', function() {
		registry.remove( 'topic1', connectionA );
	});

	it( 'connectionB is subscribed to both topic1 and topic2', function() {
	    registry.sendMsgForTopic( 'topic1', 'msg5' );
	    registry.sendMsgForTopic( 'topic2', 'msg6' );
	    expect( connectionB.send ).toHaveBeenCalledWith( 'msg5' );
	    expect( connectionB.send ).toHaveBeenCalledWith( 'msg6' );
	});
	
	it( 'removes subscriber for all topics', function() {
		registry.removeForAllTopics( connectionB ); 
		registry.sendMsgForTopic( 'topic1', 'msg7' );
	    registry.sendMsgForTopic( 'topic2', 'msg8' );
	    expect( connectionB.send ).not.toHaveBeenCalledWith( 'msg7' );
	    expect( connectionB.send ).not.toHaveBeenCalledWith( 'msg8' );
	});
});