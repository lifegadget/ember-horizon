import Ember from 'ember';
import horizon from 'npm:@horizon/client/dist/horizon';

import config from 'ember-get-config';

export default Ember.Service.extend({
    _connSuccSub: null,
    _connErrSub: null,
    _readyPromise: null,
    hz: horizon(config.horizon || {}),

    connect() {
        if (!this._readyPromise) {
            this._readyPromise = new Ember.RSVP.Promise((resolve, reject) => {
                this._connSuccSub = this.hz.onReady(() => {
                    console.log('Horizon connected');
                    this._cleanupConnSubs();
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
