/* global describe, it, expect, jasmine */
const MessageConnector = require( '../src/message-connector' )
const expect = require('chai').expect
const sinon = require( 'sinon' )
const sinonChai = require("sinon-chai")
require('chai').use(sinonChai)
const EventEmitter = require( 'events' ).EventEmitter
const settings = {
  localport: 5672,
  localhost: 'localhost',
  remoteUrls: [ 'localhost:5673' ],
  securityToken: 'bla',
  minimumRequiredConnections: 0
}

describe( 'the message connector has the correct structure', () => {

  var messageConnector

  it( 'creates a messageConnector', ( done ) => {
    messageConnector = new MessageConnector( settings )
    expect( messageConnector.isReady ).to.equal( false )
    messageConnector.on( 'error', done )
    messageConnector.on( 'ready', done )
  })

  it( 'implements the messageConnector interface', () => {
    expect( typeof messageConnector.subscribe ).to.equal( 'function' )
    expect( typeof messageConnector.unsubscribe ).to.equal( 'function' )
    expect( typeof messageConnector.publish ).to.equal( 'function' )
    expect( typeof messageConnector.isReady ).to.equal( 'boolean' )
    expect( typeof messageConnector.name ).to.equal( 'string' )
    expect( typeof messageConnector.version ).to.equal( 'string' )
    expect( messageConnector instanceof EventEmitter ).to.equal( true )
  })

  it( 'throws an error when required settings are missing', () => {
    expect(() => { new MessageConnector( 'gibberish' ) }).to.throw()
  })

  it( 'destroys the messageConnector', ( done ) => {
    messageConnector.once( 'close', done )
    messageConnector.close()
  })
})
