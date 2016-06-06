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

    findRecord(store, type, id) {
        return Ember.RSVP.Promise.reject('findRecord not implemented yet');
    },

    findAll(store, type) {
        return Ember.RSVP.Promise.reject('findAll not implemented yet');
    },

    findMany(store, type, ids) {
        return Ember.RSVP.Promise.reject('findMany not implemented yet');
    },

    query(store, type, query) {
        return Ember.RSVP.Promise.reject('query not implemented yet');
    },

    queryRecord(store, type, query) {
        return Ember.RSVP.Promise.reject('queryRecord not implemented yet');
    },

    createRecord(store, type, snapshot) {
        return Ember.RSVP.Promise.reject('createRecord not implemented yet');
    },

    updateRecord(store, type, snapshot) {
        return Ember.RSVP.Promise.reject('updateRecord not implemented yet');
    },

    deleteRecord(store, type, snapshot) {
        return Ember.RSVP.Promise.reject('deleteRecord not implemented yet');
    },
});
