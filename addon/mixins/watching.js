import Ember from 'ember';

const { RSVP: {Promise}, computed, debug, get, typeOf, $, inject: {service} } = Ember;
const a = Ember.A;
const pascalize = thingy => thingy ? Ember.String.capitalize(Ember.String.camelize(thingy)) : thingy;

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    this._subscriptions = [];
    this._watching = [];
    this._watchers = [];
  },
  /**
   * The collections which are actively being watched
   * by Horizon Observables
   *
   * @type {Array}
   */
  _watching: null,

  /**
   * All the consumers who have expressed an interest in
   * watching a given collection type. The array is of
   * the following structure:
   *
   * 	{
   * 		collection: 'collections-name',
   * 		cb: <function>,
   * 		owner: 'container'
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
  _watchers: null,

  /**
   * Indicates if the running configuration is set to watch this
   * collection (at the point that a findAll() is made against
   * the collection ... which enables lazy loading of only what
   * you need)
   *
   * @param  {String} handle  In most cases this is just the name of the collection;
   *                          in situations where detailed watchers are setup you will
   *                          need to rely on the handle's name from watch()
   * @return {Boolean}           [description]
   */
  willWatch(handle) {
    return false;
  },

  /**
   * Given a collection (or collection query), it returns whether a watcher is
   * keeping the collection up-to-date in real-time
   *
   * @param  {String} handle  In most cases this is just the name of the collection;
   *                          in situations where detailed watchers are setup you will
   *                          need to rely on the handle's name from watch()
   * @return {Boolean}
   */
  isWatching(handle) {
    // TODO: implement
    return false;
  },

  /**
   * Sets up a RethinkDB changestream which can be scoped against
   * a whole collection, a query, or a singular document. When an update
   * is detected the callback will be fired
   *
   * @param  {String}   collection the name of the collection to scope the
   *                               "changestream" to
   * @param  {String}   cb         the callback function to call when a change event
   *                               is detected
   * @param  {Object}   options    options include "query" and "id" to further
   *                               delineate the scope of the changestream.
   *                               Also, "raw" (boolean) which states whether Horizon
   *                               should process the change and just return the
   *                               full results set (raw=false) or the stream's
   *                               change document should be sent back (raw=true).
   *                               By default this will be `true`.
   * @return {String}              returns a string "handle" for this
   */
  watch(collection, cb, options = {}) {
    const raw = options.raw || false;
    // build the callback function
    const callback = changes => {
      const collection = collection;
      const since = new Date();
      const isRaw = raw;
      // all change events are sent to common handler
      this._watchedChange({
        changes: changes,
        collection: collection,
        isRaw: isRaw,
        watchedSince: since
      });
      // the callback passed in is added to the registry
    };

    return new Promise((resolve, reject) => {

      this.collection(collection)
        .then(c => c.watch({rawChanges: raw}).subscribe(callback))
        .catch(reject);

    }); // return promise
  },

  /**
   * Allows the application to register a callback in either one or all
   * collections when a "watch" detects a change. In most cases you would state a
   * function but you can also pass a string value of a known named callback. Currently
   * the only named callback is 'ember-data' which will add the change to ED's store.
   *
   * @param  {Function}   cb            the callback function to call when changes are detected
   * @param  {string}     collection    either the name of the collection or "all"; defaults to "all"
   * @return {void}
   */
  registerCallback(cb, collection = 'all') {
    const namedCallbacks = a(['ember-data']);
    if(typeOf(cb) === 'function') {
      this._registeredWatchers.push({
        collection: collection,
        callback: cb
      });
    }
    else if(typeOf(cb) === 'string' && namedCallbacks.contains(cb)) {
      this._registeredWatchers.push({
        collection: collection,
        callback: this[`_changes${pascalize(cb)}`].bind(this)
      });
    }
    else {
      console.error(`Not able to register watcher callback for collection "${collection}"`);
    }
  },
});
