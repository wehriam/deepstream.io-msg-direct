/* global describe, it, expect, jasmine */
const expect = require('chai').expect
var MessageConnector = require( '../src/message-connector' )

describe( 'security features work', () => {
  var connectorA,
    connectorB,
    messageConnector

  it( 'errors when no securityToken is provided', () => {
    expect(() => {
      messageConnector = new MessageConnector({
        localport: 2007,
        localhost: 'localhost',
        remoteUrls: [ 'localhost:2008' ],
        reconnectInterval: 100,
        minimumRequiredConnections: 0
      })
    }).to.throw()
  })

  it( 'starts messageConnectorA', ( done ) => {
    connectorA = new MessageConnector({
      localport: 2007,
      localhost: 'localhost',
      remoteUrls: [ 'localhost:2008' ],
      reconnectInterval: 100,
      minimumRequiredConnections: 0,
      securityToken: 'tokenA'
    })

    connectorA.on( 'ready', done )
    //TODO: Why does an error get thrown here?
    connectorA.on( 'error', () => {} )
  })

  it( 'rejects connector with different security token', ( done ) => {
    connectorB = new MessageConnector({
      localport: 2008,
      localhost: 'localhost',
      remoteUrls: [ 'localhost:2007' ],
      reconnectInterval: 100,
      minimumRequiredConnections: 1,
      securityToken: 'tokenB'
    })

    connectorB.on( 'ready', () => {
      expect( 'here' ).to.equal( 'never called' )
    })

    connectorB.on( 'error', ( error ) => {
      expect( error.indexOf( 'INVALID_SECURITY_TOKEN' ) ).not.to.equal( -1 )
      done()
    })
  })

  it( 'destroyes connectorA', (done) => {
    connectorA.on( 'close', done )
    connectorA.close()
  })

  it( 'destroyes connectorB', (done) => {
    connectorB.on( 'close', done )
    connectorB.close()
  })
})