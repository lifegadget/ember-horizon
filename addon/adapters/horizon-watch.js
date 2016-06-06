import Ember from 'ember';
import Adapter from 'ember-data/adapter';

/**
 * @class HorizonWatchAdapter
 *
 * This adapter uses Horizon's watch (streaming) interface.
 */
export default Adapter.extend({
    _hzService: Ember.inject.service('horizon-connection'),

    /**
     * @method _getConnectionPromise
     * @private
     *
     * Simple helper method to make sure horizon is connected and get the conn.
     */
    _getConnectionPromise() {
        return this.get('_hzService').connect();
    },

    // Horizon returns objects as plain JSON.
    defaultSerializer: 'json',

    findRecord() {
        return Ember.RSVP.Promise.reject('findRecord not implemented yet');
    },

    findAll(store, type) {
        return this._getConnectionPromise().then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                const initialData = [];
                hz(type.modelName)
                    .watch({ rawChanges: true })
                    .subscribe(Ember.run.bind(this, data => {
                        if (data.type === 'state' && data.state === 'synced') {
                            resolve(initialData);
                        } else if (data.type === 'initial') {
                            initialData.push(data.new_val);
                        }
                    }), Ember.run.bind(this, reject));
            });
        });
    },

    findMany() {
        return Ember.RSVP.Promise.reject('findMany not implemented yet');
    },

    query() {
        return Ember.RSVP.Promise.reject('query not implemented yet');
    },

    queryRecord() {
        return Ember.RSVP.Promise.reject('queryRecord not implemented yet');
    },

    createRecord(store, type, snapshot) {
        return this._getConnectionPromise().then((hz) => {
            const payload = this.serialize(snapshot);
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .store(payload)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    updateRecord(store, type, snapshot) {
        return this._getConnectionPromise().then((hz) => {
            const payload = this.serialize(snapshot, { includeId: true });
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .replace(payload)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    deleteRecord(store, type, snapshot) {
        return this._getConnectionPromise().then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .remove(snapshot.id)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },
});
