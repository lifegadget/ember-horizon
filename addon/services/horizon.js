import Ember from 'ember';
import config from 'ember-get-config';
import horizon from 'npm:@horizon/client/dist/horizon';

// The horizon object with configuration from users ENV
const hzConfig = config.horizon || {};
const hz = horizon(hzConfig);

const { RSVP: {Promise}, debug, get, typeOf } = Ember;
const a = Ember.A;

/**
 * @class Horizon
 *
 * Service methods for interacting with Horizon
 */
export default Ember.Service.extend({
  init() {
    this._super(...arguments);
    this._collections = []; // TODO: check whether Horizon does collection caching for you
    this._subscriptions = [];
    this._watching = [];
  },
  willDestroyElement() {
    this._watching.forEach(s => s.unsubscribe());
    this._subscriptions.forEach(s => s.unsubscribe()); // TODO: understand lifecycle better
    hz.disconnect();
  },

  currentUser: null,  // set by Horizon Observable
  status: 'init',     // set by Horizon Observable
  hasAuthToken: null, // set by Horizon Observable
  raw: false,         // Horizon default; specifies detail/structure in watched changes

  connect() {
    return new Promise((resolve, reject) => {

      const status = get(this, 'status');
      if(status === 'connected') {
        resolve();
      } else {
        hz.connect();
        hz.onReady(() => {
          this._statusObservable();
          this._currentUserObservable();
          debug('horizon client connected to backend');
          resolve();
        });
        hz.onDisconnected(() => {
          this._disconnected();
          reject({code: 'disconnected', config: hz});
        });
        hz.onSocketError(() => {
          this._socketError();
          reject({code: 'socket-error'});
        });
      }

    }); // return promise
  },

  collection(collection) {
    const c = typeOf(collection) === 'string' ? collection : collection.modelName;
    return new Promise((resolve, reject) => {

      this.connect()
        .then(() => {
          if(!this._collections[c]) {
            this._collections[c] = hz(collection);
          }
          resolve(this._collections[c]);
        })
        .catch(reject);

    }); // return promise
  },

  /**
   * Sets up a RethinkDB changestream which can be scoped against
   * a whole collection, a query, or a singular document. When an update
   * is detected the callback will be fired
   *
   * @param  {String}   collection the name of the collection to scope the changestream to
   * @param  {Object}   options    additional options parameters include "query" and "id" to further scope stream
   *                               you can also state "raw" (boolean) which states whether Horizon should process
   *                               the change and just return the full results set (raw=false) or the stream's
   *                               change document should be sent back (raw=true).
   * @return {Observable}          RxJS observable object
   */
  watch(collection, options = {}) {
    // TODO: implment
  },

  /**
   * Allows the execution of a Collection.find primative,
   * returning a chainable Collection object
   *
   * @param  {[type]} collection [description]
   * @param  {[type]} filterBy   [description]
   * @return {[type]}            [description]
   */
  find(collection, filterBy) {
    if (filterBy) {
      return Promise.resolve(collection.find(filterBy));
    } else {
      return Promise.reject({code: "find-requires-filter-by"});
    }
  },

  findAll(collection, filterBy) {

  },




  _statusObservable() {
    hz.status().watch().subscribe( status => {
      this.set('status', status);
    });
  },
  _currentUserObservable() {
    hz.currentUser().watch().subscribe( user => {
      this.set('currentUser', user);
    });
  },


});
