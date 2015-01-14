var events = require( 'events' ),
	util = require( 'util' ),
	pckg = require( '../package.json' );

/**
 * This message connector connects deepstream nodes directly with each other over tcp.
 * 
 * The upsides of using direct connections rather than a message brokers are increaded
 * speed and one less system that needs to be maintained.
 * 
 * This however is offset by a lack of scalability - each server needs to connect to each other server,
 * so you end up with an exponential number of connections - and high maintenance every server needs
 * to know every other server's URL. This could however be automated.
 * 
 * Monitoring can also be quite tricky due to the large number of connections.
 * 
 * So basically, for smaller clusters of 3-4 nodes that need to communicate with low latency this
 * might be a good choice. For larger clusters though it make make more sense to use an AMQP broker
 * or Apache Kafka as a messaging backbone.
 * 
 * This class also exposes a addUrl( url ) method to allow to connect to new servers at runtime
 * 
 * @param {Object} config Connection configuration.
 * 
 * {
 *     localhost: <String> e.g. 0.0.0.0
 *     localport: <Number> e.g. 6024
 *     remoteUrls: <Array> e.g. [ '192.168.0.12:6024', 'mydomain:6024' ]
 *     reconnectInterval: <Number> e.g. 2000  // time between reconnection attempts in ms
 *     maxReconnectAttepts: <Number> e.g. 10 // number of attempts after a remote server is assumed dead
 * }
 *
 * @constructor
 */
var MessageConnector = function( config ) {
	this.isReady = false;
	this.name = pckg.name;
	this.version = pckg.version;

};

util.inherits( MessageConnector, events.EventEmitter );

/**
 * Unsubscribes a function as a listener for a topic. 
 *
 * Often it makes sense to make only one subscription per topic to the messaging
 * middleware and use an eventemitter to notify multiple subscribers of updates
 * for the same topic. This however does mean that the message-connector
 * needs to keep track of the subscribers and unsubscribe from the messaging middleware
 * if all subscribers have unsubscribed
 * 
 * @param   {String}   topic
 * @param   {Function} callback
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.unsubscribe = function( topic, callback ) {
	
};

/**
 * Adds a function as a listener for a topic.
 *
 * It might make sense to only send the subscription to the messaging
 * middleware for the first subscriber for a topic and multiplex incoming
 * messages using an eventemitter
 *
 * @param   {String}   topic
 * @param   {Function} callback
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.subscribe = function( topic, callback ) {
	
};

/**
 * Publishes a message on a topic
 *
 * Please note: message is a javascript object. Its up to the client
 * to serialize it. message will look somewhat like this:
 *
 * {
 * 		topic: 'R',
 * 		action: 'P',
 * 		data: [ 'user-54jcvew34', 32, 'zip', 'SE34JN' ]
 * }
 *
 * @param   {String}   topic
 * @param   {Object}   message
 *
 * @public
 * @returns {void}
 */
MessageConnector.prototype.publish = function( topic, message ) {
	
};

MessageConnector.prototype.addUrl

module.exports = MessageConnector;