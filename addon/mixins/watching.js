import Ember from 'ember';
import workflow from '../utils/workflow';
import config from 'ember-get-config';

const { RSVP: {Promise}, assert, debug, get } = Ember;
const hzConfig = get(config, 'horizon');
const hz = window.Horizon(hzConfig);


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

/**
 * Produces a unique ID for a watcher. For most watchers this will just
 * be the "collection" name but in more advanced query it can be a more
 * complex string value
 *
 * @param  {String} model
 * @param  {Object} options
 * @return {String}         the ID for this watcher
 */
const getWatcherId = function(model, options) {
  const addons = [];
  if(options.raw === false) {
    addons.push('notraw');
  }
  if(options.query) {
    addons.push(JSON.stringify(options.query).hashCode());
  }
  if(options.id) {
    addons.push(`id-${options.id}`);
  }

  return addons.length > 0 ? `${model}-${addons.join('-')}` : model;
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
    return this._watchers[watchId];
  },


  getSubscribers(watcherId) {
    return this._subscribers[watcherId] ? this._subscribers[watcherId] : [];
  },

  addSubscriber(watcherId, state) {
    const { cb } = state;
    const newSubscription = {
      watcherId,
      cb,
      index: this._subscribers[watcherId] ? this._subscribers[watcherId].length + 1 : 1,
      name: state.options.name || 'unknown'
    };

    if(this._subscribers[watcherId]) {
      this._subscribers[watcherId].push(newSubscription);
    } else {
      this._subscribers[watcherId] = [newSubscription];
    }

    return this._subscribers[watcherId].length;
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
    const {model, cb, watcher} = state;
    const options = state.options || {};
    const watcherId = watcher || getWatcherId(model, options);
    state.workflow = workflow(state, 'watch');
    // promise (to return current state of collection)
    return new Promise((resolve, reject) => {

      // validate cb is available
      if(!cb) {
        // assert('watch called without a callback', this);
        reject({
          code: 'no-callback',
          source: 'watch'
        });
        return;
      }

      // watcher exists
      if(this.isWatching(watcherId)) {
        console.log(`watcher for ${watcherId} already exists`);
        // service already has a watcher so all that's needed is to
        // to add a new subscriber
        state.subscriber = this.addSubscriber(watcherId, state);
        state.watcher = watcherId;
        resolve(state);
      }
      // no watcher yet
      else {
        const {watcher, watcherId, errHandler} = this.createWatcher(model, options);
        state.watcherId = watcherId;
        state.watcher = watcher;
        state.errHandler = errHandler;
        state.subscriber = this.addSubscriber(watcherId, state);
        // setup watcher
        this.collection(state)
          .then( s => this._addNewWatcher(s) )
          .then( () => resolve(state) )
          .catch(err => {
            debug(err);
            assert(`Problems in setting up new watcher for ${watcherId}: ${err}`, this);
            reject(err);
          });
        }
    }); // return promise
  },

  raw: true,
  _addNewWatcher(state) {
    const { watcher, errHandler, collection } = state;
    const raw = this.get('raw');
    state.workflow = workflow(state, '_addNewWatcher');
    return new Promise((resolve, reject) => {

      try {
        collection
          .watch({rawChanges: raw})
          .subscribe(watcher, errHandler);
      } catch (e) {
        debug('Call to Horizon watch() failed', e);
        reject(e);
      }
      resolve(state);

    }); // return promise
  },

  createWatcher(model, options) {
    const watcherId = getWatcherId(model, options);
    const callback = (changes) => {
      console.log(changes);
      this.getSubscribers(watcherId).forEach(s => s.cb(changes));
    };
    const errHandler = (err) => {
      debug(`Error with watcher on ${watcherId}`, err);
      assert('Stack\n', this);
    };
    this._watchers[watcherId] = true;

    return {
      watcher: callback.bind(this),
      errorHandler: errHandler.bind(this),
      watcherId: watcherId
    };
  },

});
