import Ember from 'ember';
import Adapter from "ember-data/adapter";
import horizon from "npm:@horizon/client/dist/horizon";

import config from 'ember-get-config';

const HorizonAdapter = Adapter.extend({});

HorizonAdapter.reopenClass({
    _connSuccSub: null,
    _connErrSub: null,
    _readyPromise: null,
    hz: horizon(config.horizon || {}),

    connect() {
        if (!HorizonAdapter._readyPromise) {
            HorizonAdapter._readyPromise = new Ember.RSVP.Promise((resolve, reject) => {
                HorizonAdapter._connSuccSub = HorizonAdapter.hz.onReady(() => {
                    console.log('Horizon connected');
                    HorizonAdapter._cleanupConnSubs();
                    resolve(HorizonAdapter.hz);
                });
                HorizonAdapter._connErrSub = HorizonAdapter.hz.onSocketError(() => {
                    console.error('Horizon connection failed');
                    HorizonAdapter._cleanupConnSubs();
                    reject(HorizonAdapter.hz);
                });
                HorizonAdapter.hz.connect();
            });
        }

        return HorizonAdapter._readyPromise;
    },

    _cleanupConnSubs() {
        if (HorizonAdapter._connSuccSub) {
            HorizonAdapter._connSuccSub.unsubscribe();
            HorizonAdapter._connSuccSub = null;
        }

        if (HorizonAdapter._connErrSub) {
            HorizonAdapter._connErrSub.unsubscribe();
            HorizonAdapter._connErrSub = null;
        }
    }
});

export default HorizonAdapter;
