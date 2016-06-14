var RemoteSubscriberRegistry = function() {
  this._connections = {}
}

RemoteSubscriberRegistry.prototype.add = function( topic, subscriber ) {
  if( this._connections[ topic ] === undefined ) {
    this._connections[ topic ] = []
  }

  if( this._connections[ topic ].indexOf( subscriber ) === -1 ) {
    this._connections[ topic ].push( subscriber )
  }
}

RemoteSubscriberRegistry.prototype.remove = function( topic, subscriber ) {
  if( this._connections[ topic ] === undefined ) {
    return
  }

  var index = this._connections[ topic ].indexOf( subscriber )

  if( index !== -1 ) {
    this._connections[ topic ].splice( index, 1 )
  }
}

RemoteSubscriberRegistry.prototype.removeForAllTopics = function( subscriber ) {
  for( var topic in this._connections ) {
    this.remove( topic, subscriber )
  }
}

RemoteSubscriberRegistry.prototype.sendMsgForTopic = function( topic, message ) {
  if( !this._connections[ topic ] ) {
    return
  }

  for( var i = 0; i < this._connections[ topic ].length; i++ ) {
    this._connections[ topic ][ i ].send( message )
  }
}

module.exports = RemoteSubscriberRegistry