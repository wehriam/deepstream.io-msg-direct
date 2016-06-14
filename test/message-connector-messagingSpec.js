/* global describe, it, expect, jasmine */
const MessageConnector = require( '../src/message-connector' )
const expect = require('chai').expect
const sinon = require( 'sinon' )
const sinonChai = require("sinon-chai")
require('chai').use(sinonChai)
const EventEmitter = require( 'events' ).EventEmitter
const getSettings = ( localPort, remotePort1, remotePort2 ) => {
  return {
    localport: localPort,
    localhost: 'localhost',
    remoteUrls: [ 'localhost:' + remotePort1, 'localhost:' + remotePort2 ],
    reconnectInterval: 100,
    securityToken: 'bla',
    minimumRequiredConnections: 0
  }
}
const MESSAGE_TIME = 100

describe( 'Messages are send between multiple instances', () => {
  var connectorA,
    connectorB,
    connectorC,
    callback_A1 = sinon.spy(),
    callback_B1 = sinon.spy(),
    callback_C1 = sinon.spy()

  it( 'creates connectorA', ( done ) => {
    var ready = false
    connectorA = new MessageConnector( getSettings( 2001, 2002, 2003 ) )
    expect( connectorA.isReady ).to.equal( false )

    connectorA.on( 'ready', () => {
      !ready && done()
      ready = true
    } )
    connectorA.on( 'error', done )
  })

  it( 'creates connectorB', ( done ) => {
    var ready = false
    connectorB = new MessageConnector( getSettings( 2002, 2001, 2003 ) )
    expect( connectorB.isReady ).to.equal( false )

    connectorB.on( 'ready', () => {
      !ready && done()
      ready = true
    } )
    connectorB.on( 'error', done )
  })

  it( 'creates connectorC', ( done ) => {
    var ready = false

    connectorC = new MessageConnector( getSettings( 2003, 2001, 2002 ) )
    expect( connectorC.isReady ).to.equal( false )

    connectorB.on( 'ready', () => {
      !ready && done()
      ready = true
    } )
    connectorB.on( 'error', done )
  })

  it( 'initialised all three connectors', () => {
    expect( connectorA.isReady ).to.equal( true )
    expect( connectorB.isReady ).to.equal( true )
    expect( connectorC.isReady ).to.equal( true )
  })

  it( 'subscribes to a topic', ( done ) => {
    connectorA.subscribe( 'topic1', callback_A1 )
    connectorB.subscribe( 'topic1', callback_B1 )
    connectorC.subscribe( 'topic1', callback_C1 )
    expect( callback_A1 ).to.not.have.been.called
    setTimeout( done, MESSAGE_TIME )
  })

  it( 'connectorB sends a message', ( done ) => {
    connectorB.publish( 'topic1', { some: 'data' } )
    setTimeout( done, MESSAGE_TIME )
  })

  it( 'connectorA and connectorC have received the message', () => {
    expect(callback_A1).to.have.been.calledWith({ some: 'data' })
    expect(callback_B1).to.not.have.been.called
    expect(callback_C1).to.have.been.calledWith({ some: 'data' })
  })

  it( 'connectorC sends a message', ( done ) => {
    connectorC.publish( 'topic1', { other: 'value' } )
    setTimeout( done, MESSAGE_TIME )
  })

  it( 'connectorA and connectorB have received the message', () => {
    expect( callback_A1 ).to.have.been.calledWith({ other: 'value' })
    expect( callback_B1 ).to.have.been.calledWith({ other: 'value' })
    expect( callback_C1 ).to.have.been.calledWith({ some: 'data' })
  })

  it( 'connectorA and connectorC send messages at the same time', ( done ) => {
    connectorA.publish( 'topic1', { val: 'x' } )
    connectorC.publish( 'topic1', { val: 'y' } )
    setTimeout( done, MESSAGE_TIME )
  })

  it( 'connectorA and connectorB have received the message', () => {
    expect( callback_A1 ).to.have.been.calledWith({ val: 'y' })
    expect( callback_B1 ).to.have.been.calledWith({ val: 'x' })
    expect( callback_B1 ).to.have.been.calledWith({ val: 'y' })
    expect( callback_C1 ).to.have.been.calledWith({ val: 'x' })
  })

  it( 'connectorB unsubscribes', () => {
    connectorB.unsubscribe( 'topic1', callback_B1 )
  })

  it( 'connectorA sends a message', ( done ) => {
    connectorA.publish( 'topic1', { notFor: 'B' } )
    setTimeout( done, MESSAGE_TIME )
  })

  it( 'only connector c has received the message', () => {
    expect( callback_A1 ).to.not.have.been.calledWith({ notFor: 'B' })
    expect( callback_B1 ).to.not.have.been.calledWith({ notFor: 'B' })
    expect( callback_C1 ).to.have.been.calledWith({ notFor: 'B' })
  })

  it( 'destroyes connectorA', (done) => {
    connectorA.on( 'close', done )
    connectorA.close()
  })

  it( 'destroyes connectorB', (done) => {
    connectorB.on( 'close', done )
    connectorB.close()
  })

  it( 'destroyes connectorC', (done) => {
    connectorC.on( 'close', done )
    connectorC.close()
  })
})