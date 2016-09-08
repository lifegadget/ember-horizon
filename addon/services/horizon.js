import Ember from 'ember';
import config from 'ember-get-config';
import workflow from '../utils/workflow';
import Watching from '../mixins/watching';

const { RSVP: {Promise}, computed, debug, get, typeOf, $, assert } = Ember;
const hzConfig = Ember.assign({ host: 'http://localhost:8181' }, get(config, 'horizon') || {});
let hz;
if(window.Horizon) {
  hz = window.Horizon(hzConfig);
} else {
  console.warn('Horizon client library wasn\'t available. Please be sure that the Horizon server is running.');
}

const makeArray = function(hash) {
  return Object.keys(hash).map(i => {
    return { id: i, url: hash[i] };
  });
}

/**
 * @class Horizon
 *
 * Service methods for interacting with Horizon
 */
export default Ember.Service.extend(Watching, {
  ajax: Ember.inject.service(),
  // Observable members
  currentUser: computed('isLoggedIn', function() {
    return hz.currentUser();
  }).volatile(),
  status: 'unconnected',// set by Horizon Observable
  hasAuthToken: computed.alias('isLoggedIn'),   // set by Horizon Observable
  raw: true,            // specifies detail/structure in watched changes (true = RethinkDB changestream)

  willDestroy() {
    this._super(...arguments);
    this.disconnect();
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
              this.listenForCurrentUser();
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

  listenForCurrentUser() {
    hz.currentUser().fetch().subscribe( user => {
      this.set('currentUser', user);
    });
  },

  disconnect() {
    debug('Disconnecting from Horizon server');
    this.logout();
  },

  /**
   * Returns a list of Authentication services which are configured for the Horizon Server
   */
  getAuthServices() {
    return get(this, 'ajax').request(`${this.horizonServerURI()}/horizon/auth_methods`);
  },


  /**
   * Given a service name (e.g, 'facebook', 'google'), it will force browser to authenticate
   * against the indicated service. If you are embedding into an iFrame then you must
   * the DOM element which is your iFrame
   */
  authenticate(service, domElement = null) {
    if(domElement) {
      // TODO: implement
    } else {
      // console.log(service);
      // hz.authEndpoint(service).subscribe(endpoint => {
      //   console.log('endpoint is: ', endpoint);
      //   window.location.replace(endpoint);
      // });

      this.getAuthServices()
        .then(services => {
          const authUrl = makeArray(services).filter(s => s.id = service)[0].url;
          console.log(`${this.horizonServerURI()}${authUrl}`);
          window.location.replace(`${this.horizonServerURI()}${authUrl}`);
        });
    }
  },

  /**
   * Logs out the current user
   */
  logout() {
    // TODO: the below command is the RIGHT way to do this
    // hz.clearAuthTokens();
    window.localStorage.removeItem('horizon-jwt');
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

  /**
   * Converts a model name into a Horizon collection object
   *
   * @param  {mixed} state   Takes as input one of the following:
   *  	                     	1. A "state" name/value hash with property 'model' set,
   *  	                      2. A string with the name of the model
   * @return {Object}       An object with the "collection" property set to the
   *                        Horizon collection object
   */
  collection(state) {
    state = typeOf(state) === 'string' ? {model: state} : state;
    const model = state.model;
    return new Promise((resolve, reject) => {

      this.connect()
        .then(() => {
          state.collection = hz(model);
          state.workflow = workflow(state, 'collection');
          resolve(state);
        })
        .catch(err => {
          console.error(`Problem getting "${model}" collection: `, err);
          reject(err);
        });

    }); // return promise
  },

  isLoggedIn: computed(function() {
    return hz.hasAuthToken();
  }).volatile(),

  authEndpoint() {
    return hz.authEndpoint(...arguments);
  },

  horizonServerURI() {
    const protocol = hzConfig.secure ? 'https://' : 'http://';
    return protocol + hzConfig.host;
  },

  /**
   * Allows the execution of a Collection.find primative,
   * returning a chainable Collection object
   *
   * @param  {Object} state      a "state" hash with a property "collection" available,
   *                             optionally with "filterBy"
   * @return {Object}            state hash
   */
  find(state) {
    // inputs
    const {collection} = state;
    const filterBy = state.filterBy || state.id;
    // promise
    return new Promise((resolve, reject) => {

      if(!collection) {
        const message = `Horizon "find" called but state didn't have collection property`;
        console.error(message);
        reject({code: 'no-collection-property', message: message});
        return;
      }

      if (filterBy) {
        state.collection = collection.find(filterBy);
        state.workflow = workflow(state,'find');
        return resolve(state);
      } else {
        reject({code: "find-requires-filter-by"});
      }

    }); // return promise
  },

  findMany(state) {
    // inputs
    const {collection} = state;
    const filterBy = (state.findBy || state.ids || []).map(f => {
      return typeOf(f) === 'object' ? f : {id: f};
    });
    state.filterBy = filterBy;
    // promise
    return new Promise((resolve, reject) => {
      if(!collection) {
        const message = `Horizon "find" called but state didn't have collection property`;
        assert(message, this);
        reject({code: 'no-collection-property', message: message});
        return;
      }

      if (filterBy) {
        // update state to include collection
        // with filtered scope from filterBy query
        const c2 = collection.findAll(...filterBy);
        state.collection = c2;
        state.workflow = workflow(state,'findMany');
        resolve(state);
      } else {
        reject({code: "find-requires-filter-criteria", state: state});
      }

    }); // return promise
  },

  /**
   * Takes in a collection object and runs both fetch() and subscribe()
   * to get a result from the collection.
   *
   * @param  {Object} state receives all relevant local scope
   * @return {Object}       returns the JSON payload returned from subscribe()
   */
  fetch(state) {
    // inputs
    const {collection} = state;
    // promise
    return new Promise((resolve, reject) => {

      collection.fetch().subscribe(
        result => {
          state.workflow = workflow(state, 'fetch');
          state.payload = result;
          resolve(state);
        },
        err => reject(err)
      );

    }); // return promise
  },


  store(state) {
    // inputs
    const {collection, payload} = state;
    // promise
    return new Promise((resolve, reject) => {

      collection.store(payload).subscribe(
        serverProperties => {
          state.payload = Ember.assign(payload, serverProperties);
          state.workflow = workflow(state, 'store');
          resolve(state);
        },
        err => reject(err)
      );

    }); // return promise
  },

  /**
   * Replaces an existing record in a RethinkDB collection
   * with a full replacement JSON payload (PUT not PATCH in REST terminology)
   *
   * @param  {Object}   state     local state including connection and payload
   * @return {Promise}
   */
  replace(state) {
    // inputs
    const {collection, payload} = state;
    // promise
    return new Promise((resolve, reject) => {

      collection.replace(payload).subscribe(
        id => resolve(id),
        err => reject(err)
      );

    });
  },

  remove(state) {
    // inputs
    const {collection, id} = state;
    // promise
    return new Promise((resolve, reject) => {

      collection.remove(id).subscribe(
        () => {
          state.workflow = workflow(state, 'remove');
          resolve(state);
        },
        err => reject(err)
      );

    }); // return promise
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
});
