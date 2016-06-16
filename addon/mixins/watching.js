import Ember from 'ember';
import workflow from '../utils/workflow';

const { RSVP: {Promise}, assert, debug, typeOf } = Ember;
const a = Ember.A;
const pascalize = thingy => thingy ? Ember.String.capitalize(Ember.String.camelize(thingy)) : thingy;

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) { return hash; }

  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    this._subscribers = [];
    this._watchers = [];
  },
  /**
   * The collections which are actively being watched
   * by Horizon Observables. The array structure contains
   * objects which look like:
   *
   * 	{
   * 		watcherId: [id],
   * 		started: [datetime]
   *  }
   *
   * @type {Array}
   */
  _watchers: null,

  /**
   * All the consumers who have expressed an interest in
   * watching a given collection type. The array is of
   * the following structure:
   *
   * 	{
   * 		watcherId: [id],
   * 		cb: <function>,
   * 		owner: [optional: String]
   * 	}
   *
   * the "owner" property is purely decorative but helps give
   * context to who the "container object" is.
   *
   * One last note, there is a 1:M relationship between _watching(1)
   * to _watchers(M).
   *
   * @type {Array}
   */
  _subscribers: null,

  /**
   * Given a collection (or collection query), it returns whether a watcher is
   * keeping the collection up-to-date in real-time
   *
   * @param  {String} watchId  In most cases this is just the name of the collection;
   *                          in situations where detailed watchers are setup you will
   *                          need to rely on response from watch()
   * @return {Boolean}
   */
  isWatching(watchId) {
    return this._watchers.filter(w => w.watchId === watchId).length > 0;
  },

  /**
   * Sets up a changestream which can be scoped against
   * a whole collection, a query, or a singular document. When an update
   * is detected the callback will be fired. There is a two tier model that
   * makes this happen:
   *
   * 1. watchers - the service will maintain a set of "watchers" which have a generalized
   * 								callback that will iterate through all subscribers (aka, interested
   * 								parties) and allow them to take actions. If all you ever use is the
   * 								Ember-Data adapter then this relationship will always be 1:1.
   * 2. subscriptions - when you call `watch()` the callback sent in, as part of the state
   * 								hash, will be attached to a subscription so that
   *
   * The input to `watch()` is a single hash with the following properties required:
   *
   * @param  {String}   collection the name of the collection to scope the
   *                               "changestream" to
   * @param  {String}   cb         the callback function to call when a change event
   *                               is detected; this will be added as a "subscriber"
   * @param  {Object}   options    options can include "query" and "id" to further
   *                               delineate the scope of the changestream.
   *                               Also, "raw" (boolean) which states whether Horizon
   *                               should process the change and just return the
   *                               full results set (raw=false) or the stream's
   *                               change document should be sent back (raw=true).
   *                               By default this will be `true`.
   * @return {Object}              returns the state hash, adding the "subscription"
   *                               property which is unique id for the subscription to
   *                               watcher. Will also add the "watcher" property which
   *                               is a handle to the watcher (typically this is just
   *                               the model/connection name)
   */
  watch(state) {
    // inputs
    const {collection, model, cb, watcher} = state;
    const options = state.options || {};
    const watcherId = watcher || this.getWatcherId(model, options);
    state.workflow = workflow(state, 'watch');
    // promise (to return current state of collection)
    return new Promise((resolve, reject) => {

      // validate cb is available
      if(!cb) {
        assert('watch called without a callback', this);
        reject({
          code: 'no-callback',
          source: 'watch'
        });
      }
      // watcher exists
      if(this.isWatching(watcherId)) {
        // service already has generalized watcher watching this collection
        // so new request is just attached to the list of subscribers
        state.subscriber = this.addSubscriber(watcherId, state);
        state.watcher = watcherId;
        // we still need to return the current state of the
        // collection. If a "store" exists then we can use ED's peekRecord
        // otherwise we'll need to go back to database
        if(state.store && model === watcherId) {
          state.payload = state.store.peekAll(model);
          resolve(state);
        } else {
          this.collection(collection)
            .then(this.findAll)
            .then(s => resolve(s.payload))
            .catch(err => {
              assert(`Failed to execute a findAll() after attaching a subscriber[${state.subscriber}] to a watcher[${state.watcher}]`, err);
              reject(err);
            });
        }
      }
      // no watcher yet
      else {
        const {generalizedCallback, watcherId} = this.createCallback(model, options);
        state.watcher = watcherId;
        // note: we can subscribe to watcher even though watcher isn't active yet
        // in fact that ensures that the first call which gives the current-state is
        // delivered to the subscriber
        state.subscriber = this.addSubscriber(watcherId, state);
        // note: "callback" on `state` is the generalized callback, whereas "cb" is localized
        state.callback = generalizedCallback;
        this._watch(state)
          .then(resolve)
          .catch(err => {
            debug(err);
            assert(`Problems in setting up new watcher for ${watcherId}`, this);
            reject(err);
          });
        }
    }); // return promise
  },

  _watch(state) {
    const {raw, callback, collection} = state;
    state.workflow = workflow(state, '_watch');
    return new Promise((resolve, reject) => {

      try {
        state.collection = collection.watch({rawChanges: raw}).subscribe(callback);
      } catch (e) {
        debug('Call to Horizon to watch() failed', e);
        reject(e);
      }
      resolve(state);

    }); // return promise
  },

  createCallback(model, options) {
    const watcherId = this.getWatcherId(model, options);
    const callback = (changes) => {
      console.log(`generalized callback for ${watcherId}:`, changes);
      this.getSubscribers(watcherId).forEach(s => s.cb(changes));
    };

    return callback;
  },

  /**
   * Most watchers have an id where id = collection,
   * if the watch is using a query of some sort though or not returning
   * raw input then this function will identify the correct ID for
   * the watcher
   *
   * @param  {String} model
   * @param  {Object} options
   * @return {String}         the ID for this watcher
   */
  getWatcherId(model, options) {
    const addons = [];
    if(options.raw !== true) {
      addons.push('notraw');
    }
    if(options.query) {
      addons.push(JSON.stringify(options.query).hashCode());
    }
    if(options.id) {
      addons.push(`id-${options.id}`);
    }

    return addons ? `${model}-${addons.split('-')}` : model;
  },

  getSubscribers(watcherId) {
    return this._subscribers.filter(s => s.watcherId === watcherId);
  },

});
