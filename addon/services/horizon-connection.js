import Ember from 'ember';
import horizon from 'npm:@horizon/client/dist/horizon';

import config from 'ember-get-config';

/**
 * @class HorizonConnectionService
 *
 * This service gives an easy to work with way of connecting to Horizon.
 */
export default Ember.Service.extend({
  _connSuccSub: null,
  _connErrSub: null,
  _readyPromise: null,

  // NOTE: This is not updated with Ember.set(), thus not observable.
  // It should only be used for sync checks, for async operations use
  // this.connect() which reurns a connection promise.
  isReady: false,
  // This is the actual horizon object, it can be used directly or accessed
  // as the value passed to callbacks of the this.connect() promise.
  hz: horizon(config.horizon || {}),

  /**
   * @method connect
   * @return {Promise} promise
   *
   * If no connection has been attempted yet, attempt it and return a promise,
   * else return the precious connection promise.
   */
  connect() {
    if (!this._readyPromise) {
      this._readyPromise = new Ember.RSVP.Promise((resolve, reject) => {
        this._connSuccSub = this.hz.onReady(() => {
          console.log('Horizon connected');
          this._cleanupConnSubs();
          this.isReady = true;
          resolve(this.hz);
        });
        this._connErrSub = this.hz.onSocketError(() => {
          console.error('Horizon connection failed');
          this._cleanupConnSubs();
          reject(this.hz);
        });
        this.hz.connect();
      });
    }

    return this._readyPromise;
  },

  /**
   * @method _cleanupConnSubs
   * @private
   *
   * Cleanup RxJS subscriptions after connection succeeds or fails.
   */
  _cleanupConnSubs() {
    if (this._connSuccSub) {
      this._connSuccSub.unsubscribe();
      this._connSuccSub = null;
    }

    if (this._connErrSub) {
      this._connErrSub.unsubscribe();
      this._connErrSub = null;
    }
  }
});
