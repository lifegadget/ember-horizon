import Ember from 'ember';
import config from 'ember-get-config';

const { RSVP: {Promise}, computed, debug, get, typeOf, $, inject: {service} } = Ember;
const a = Ember.A;
const pascalize = thingy => thingy ? Ember.String.capitalize(Ember.String.camelize(thingy)) : thingy;

// The horizon object with configuration from users ENV
// Note: often the DEV environment will be left blank
// and rather than just let it
const hzConfig = config.horizon || {};
let hz;
if(window.Horizon) {
  hz = window.Horizon(hzConfig);
} else {
  console.warn('Horizon client library wasn\'t available. Please be sure that the Horizon server is running.');
}


/**
 * @class Horizon
 *
 * Service methods for interacting with Horizon
 */
export default Ember.Service.extend({
  // Ember-data
  eds: service('store'),
  // Observable members
  currentUser: null,    // set by Horizon Observable
  status: 'unconnected',// set by Horizon Observable
  hasAuthToken: null,   // set by Horizon Observable
  raw: true,            // specifies detail/structure in watched changes (true = RethinkDB changestream)

  init() {
    this._super(...arguments);
    this._collections = []; // TODO: check whether Horizon does collection caching for you
    this._subscriptions = [];
    this._watching = [];
    this._registeredWatchers = [];
  },

  willDestroy() {
    this._watching.forEach(s => s.unsubscribe());
    this._subscriptions.forEach(s => s.unsubscribe()); // TODO: understand lifecycle better
    this.disconnect();
    this._super(...arguments);
  },

  connect() {
    return new Promise((resolve, reject) => {

      const status = get(this, 'status');
      if(status === 'ready') {
        resolve();
      } else {
        this.loadClientDriver()
          .then(() => {
            // Client driver is loaded
            hz.connect();
            debug('Connecting to Horizon ...');
            hz.onReady(() => {
              this.set('status', 'ready');
              debug('Horizon connected');
              this._statusObservable();
              this._currentUserObservable();
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

          })
          .catch(() => {
            // client driver failed
            this.set('status', 'error');
            const err = {
              code: 'failed-to-reach-horizon-client-driver',
              when: new Date(),
              url: $('#client-driver').attr('src')
            };
            console.warn('Horizon client library is still unreachable!', err);
            this.errors = this.errors ? [].concat(this.errors, err) : [].concat(err);
          });
      }

    }); // return promise
  },

  disconnect() {
    debug('Disconnecting from Horizon server');
    hz.disconnect();
  },

  /**
   * Typically the Horizon client driver should load with page load but if it doesn't for some
   * reason we will retry to load it with this call
   */
  loadClientDriver() {
    return new Promise((resolve, reject) => {

      if(!hz) {
        const driver = $('#client-driver').attr('src');
        debug(`The Horizon client library wasn't available at page load, retrying now [${driver}].`);
        $.getScript(driver)
          .done((script, textStatus) => {
            debug('Was able to load Horizon client library: ', textStatus);
            hz = window.Horizon(config.horizon || {});
            resolve();
          })
          .fail(err => {
            reject(err);
          });
      } else {
        resolve();
      }

    }); // return promise
  },

  collection(collection) {
    const c = typeOf(collection) === 'string' ? collection : collection.modelName;
    return new Promise((resolve, reject) => {

      this.connect()
        .then(() => {
          if(!this._collections[c]) {
            this._collections[c] = hz(c);
          }
          console.log(`resolving collection: ${c}`, this._collections[c]);
          resolve(this._collections[c]);
        })
        .catch(err => {
          console.error(`Problem connecting to Horizon server: `, err);
          reject(err);
        });

    }); // return promise
  },

  isLoggedIn: computed(function() {
    return hz.hasAuthToken();
  }).volatile(),

  authEndpoint: computed(function() {
    return hz.authEndpoint();
  }).volatile(),

  /**
   * Given a collection (or collection query), it returns whether a watcher is
   * keeping the collection up-to-date in real-time
   *
   * @param  {Mixed}    type   Can be a string name or the adapter's "type" object
   * @return {Boolean}
   */
  isWatched(type) {
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

  /**
   * Allows the execution of a Collection.find primative,
   * returning a chainable Collection object
   *
   * @param  {[type]} collection [description]
   * @param  {[type]} filterBy   [description]
   * @return {[type]}            [description]
   */
  find(collection, filterBy) {
    return new Promise((resolve, reject) => {

      if (filterBy) {
        return resolve(collection.find(filterBy));
      } else {
        reject({code: "find-requires-filter-by"});
      }

    }); // return promise
  },

  findMany(collection, filterBy) {
    const query = filterBy.map(f => {
      return typeOf(f) === 'object' ? f : {id: f};
    });
    return new Promise((resolve, reject) => {

      if (filterBy) {
        return resolve(collection.findAll(...query));
      } else {
        reject({code: "find-requires-filter-by"});
      }

    }); // return promise
  },

  fetch(obj) {
    return new Promise((resolve, reject) => {

      obj.fetch().subscribe(
        result => resolve(result),
        err => reject(err)
      );

    }); // return promise
  },

  store(collection, payload) {
    return new Promise((resolve, reject) => {

      collection.store(payload).subscribe(
        result => {
          resolve(Ember.assign(payload, result));
        },
        err => reject(err)
      );

    }); // return promise
  },

  replace(collection, payload) {
    return new Promise((resolve, reject) => {

      console.log('replacing record: ', payload);
      collection.replace(payload).subscribe(
        id => resolve(id),
        err => reject(err)
      );

    });
  },

  remove(collection, id) {
    return new Promise((resolve, reject) => {

      collection.remove(id).subscribe(
        () => resolve(),
        err => reject(err)
      );

    }); // return promise
  },


  /**
   * Called whenever a change is detected by one of the watched
   * collections. It then calls any registered callbacks that have
   * expressed interest via the "registerCallback" function
   *
   * @param  {hash} meta includes "changes", "connection", and other meta properties
   * @return {void}
   */
  _watchedChange(meta) {
    console.log('change detected:', meta);
    this._registeredWatchers.forEach(w => {
      if(w.collection === 'all' || w.collection === meta.collection) {
        w.callback(meta);
      }
    });

  },

  _changesEmberData(meta) {
    const store = this.get('store');
    console.log('ember-data change handler', meta);
    const add = (collection, object) => {
      store.pushPayload({[collection]: object});
    };
    const change = (/*collection, id, object*/) => {

    };
    const remove = (collection, id) => {
      store.findRecord(collection, id).then(record => {
        record.destroyRecord();
        record.save();
      });
    };

    meta.changes.forEach(c => {
      switch(c.type) {
        case "add":
          add(meta.collection, c.new_val);
          break;
        case "change":
          change(meta.collection, c.old_value.id, c.new_value);
          break;
        case "delete":
          // TODO: need to ensure "delete" is correct type passed in and also how the ID is conveyed.
          remove(meta.collection, c.id);
          break;
        case "sync":
          debug('database state was synched');
          break;
        default:
          debug(`Unknown type "${c.type}" reported by watch observable`);
      }
    });
  },

  _disconnected() {
    this.set('status', 'disconnected');
    debug('horizon is disconnected');
    this._retryConnection();
  },

  _socketError() {
    this.set('status', 'error');
    debug('horizon is in an error state');
    this._retryConnection();
  },

  _retryConnection() {
    const delays = [1000, 5000, 15000, 60000];
    delays.forEach(delay => {
      Ember.run.later(() => {
        if (this.get('status') === 'disconnected') {
          this.connect();
        }
      }, delay);
    });
  },


  _statusObservable() {
    // window.Horizon.status().watch().subscribe( updated => {
    //   console.log('status changed', updated);
    //   this.set('status', updated);
    // });
  },
  _currentUserObservable() {
    // hz.currentUser().fetch().subscribe( user => {
    //   debug('Current user changed to: ', user);
    //   this.set('currentUser', user);
    // });
  },


});
