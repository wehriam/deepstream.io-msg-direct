/* global describe, it, expect, jasmine */
const expect = require('chai').expect
const sinon = require( 'sinon' )
const sinonChai = require("sinon-chai")
require('chai').use(sinonChai)
var RemoteSubscriberRegistry = require( '../src/remote-subscriber-registry' )

function MockConnection() {
  this.send = sinon.spy()
}

describe('remote subscriber registry', () => {
  var registry,
    connectionA = new MockConnection(),
    connectionB = new MockConnection()

  it( 'creates the registry', () => {
    registry = new RemoteSubscriberRegistry()
    expect( typeof registry.add ).to.equal( 'function' )
  })

  it( 'adds a subscriber', () => {
    registry.add( 'topic1', connectionA )
    registry.sendMsgForTopic( 'topic1', 'msg1' )
    expect( connectionA.send ).to.have.been.calledWith( 'msg1' )
    expect( connectionB.send ).to.not.have.been.calledWith
  })

  it( 'adds a second subscriber', () => {
    registry.add( 'topic1', connectionB )
    registry.sendMsgForTopic( 'topic1', 'msg2' )
    expect( connectionA.send ).to.have.been.calledWith( 'msg2' )
    expect( connectionB.send ).to.have.been.calledWith( 'msg2' )
  })

  it( 'ignores multiple subscriptions', () => {
    registry.add( 'topic1', connectionB )
  })

  it( 'adds a subscriber for a different topic', () => {
    registry.add( 'topic2', connectionB )
    registry.sendMsgForTopic( 'topic2', 'msg3' )
    expect( connectionA.send ).to.not.have.been.calledWith( 'msg3' )
    expect( connectionB.send ).to.have.been.calledWith( 'msg3' )
  })

  it( 'removes a subscriber', () => {
    registry.remove( 'topic1', connectionA )
    registry.sendMsgForTopic( 'topic1', 'msg4' )
    expect( connectionA.send ).to.not.have.been.calledWith( 'msg4' )
    expect( connectionB.send ).to.have.been.calledWith( 'msg4' )
  })

  it( 'ignores multiple calls to remove', () => {
    registry.remove( 'topic1', connectionA )
  })

  it( 'connectionB is subscribed to both topic1 and topic2', () => {
    registry.sendMsgForTopic( 'topic1', 'msg5' )
    registry.sendMsgForTopic( 'topic2', 'msg6' )
    expect( connectionA.send ).to.not.have.been.calledWith( 'msg5' )
    expect( connectionB.send ).to.have.been.calledWith( 'msg6' )
  })

  it( 'removes subscriber for all topics', () => {
    registry.removeForAllTopics( connectionB )
    registry.sendMsgForTopic( 'topic1', 'msg7' )
    registry.sendMsgForTopic( 'topic2', 'msg8' )
    expect( connectionA.send ).to.not.have.been.calledWith( 'msg7' )
    expect( connectionB.send ).to.not.have.been.calledWith( 'msg8' )
  })
})