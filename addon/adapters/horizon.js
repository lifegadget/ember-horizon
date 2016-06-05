import Ember from 'ember';
import Adapter from 'ember-data/adapter';

/**
 * @class HorizonAdapter
 *
 * This adapter uses Horizon's fetch (non-streaming) interface.
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

    findRecord(store, type, id) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .find(id)
                    .fetch()
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    findAll(store, type) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .fetch()
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    findMany(store, type, ids) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .findAll(ids)
                    .fetch()
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    query(store, type, query) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .findAll(query)
                    .fetch()
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    queryRecord(store, type, query) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .find(query)
                    .fetch()
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    createRecord(store, type, snapshot) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            const payload = this.serialize(snapshot);
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .store(payload)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    updateRecord(store, type, snapshot) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            const payload = this.serialize(snapshot, { includeId: true });
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .replace(payload)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },

    deleteRecord(store, type, snapshot) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .remove(snapshot.id)
                    .subscribe(Ember.run.bind(this, resolve), Ember.run.bind(this, reject));
            });
        });
    },
});
