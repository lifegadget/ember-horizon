import Ember from 'ember';
import Adapter from 'ember-data/adapter';

export default Adapter.extend({
    _hzService: Ember.inject.service('horizon-connection'),
    _getConnectionPromise() {
        return this.get('_hzService').connect();
    },

    defaultSerializer: 'json',

    findRecord(store, type, id) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .find(id)
                    .fetch()
                    .subscribe(resolve, reject);
            });
        });
    },

    findAll(store, type) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .fetch()
                    .subscribe(resolve, reject);
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
                    .subscribe(resolve, reject);
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
                    .subscribe(resolve, reject);
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
                    .subscribe(resolve, reject);
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
                    .subscribe(resolve, reject);
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
                    .subscribe(resolve, reject);
            });
        });
    },

    deleteRecord(store, type, snapshot) {
        const connectionPromise = this._getConnectionPromise();

        return connectionPromise.then((hz) => {
            return new Ember.RSVP.Promise((resolve, reject) => {
                hz(type.modelName)
                    .remove(snapshot.id)
                    .subscribe(resolve, reject);
            });
        });
    },
});
