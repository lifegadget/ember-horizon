import Ember from 'ember';
import horizon from 'npm:@horizon/client/dist/horizon';
import config from 'ember-get-config';

const { RSVP: {Promise}, debug, get } = Ember;

/**
 * @class Horizon
 *
 * Service methods for interacting with Horizon
 */
export default Ember.Service.extend({
  init() {
    this._super() {
      this._super(...arguments);
      this._connections = [];
      this._subscriptions = [];
    }
  },

  connect() {
    return new Promise((resolve, reject) => {

      const h = horizon();
      const status = get(this, 'status');
      if(status === 'connected') {
        resolve();
      } else {
        h.connect();
        h.onReady(() => {
          debug('horizon client connected to backend');
          resolve();
        });
        h.onDisconnected(() => {
          this._disconnected();
          reject({code: 'disconnected'});
        });
        h.onSocketError(() => {
          this._socketError();
          reject({code: 'socket-error'});
        });
      }

    }); // return promise

    collection(collection) {
      return new Promise((resolve, reject) => {

      this.connect()
        .then(() => {
          if(!this._collections[collection]) {
            const horizon = window.Horizon();
            this._collections[collection] = horizon(collection);
          }
          resolve(this._collections[collection]);
        })
        .catch(reject);

      }); // return promise
    }
  }
});
