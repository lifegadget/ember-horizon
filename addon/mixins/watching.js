import Ember from 'ember';

const { RSVP: {Promise}, computed, debug, get, typeOf, $, inject: {service} } = Ember;
const a = Ember.A;
const pascalize = thingy => thingy ? Ember.String.capitalize(Ember.String.camelize(thingy)) : thingy;

export default Ember.Mixin.create({

  /**
   * Given a collection (or collection query), it returns whether a watcher is
   * keeping the collection up-to-date in real-time
   *
   * @param  {String}    type   The name of the model/collection
   * @return {Boolean}
   */
  isWatched(collection) {
    // TODO: implement
    return false;
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
  watch(cb, collection, options = {}) {
    const raw = options.raw || get(this, 'raw');
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
