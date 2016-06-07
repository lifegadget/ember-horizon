import Ember from 'ember';
import Adapter from 'ember-data/adapter';

const { RSVP: {Promise}, get, inject: {service}, typeOf } = Ember;

/**
 * @class HorizonFetchAdapter
 *
 * This adapter integrates with a Horizon/RethinkDB stack; it provides
 * normal CRUD operations by default and can provide real-time updates
 * if the application chooses to use the services "watch" services for one,
 * many, or all collections.
 */
export default Adapter.extend({
  horizon: service(),

  // Horizon returns objects as plain JSON.
  defaultSerializer: 'json',

  findRecord(store, type, id) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      // If subscription exists we assume record already up-to-date
      if(horizon.isWatched(type)) {
        resolve( this.peekRecord(type.modelName, id) );
      } else {
        horizon.collection(type)
          .then(c => horizon.find(c, id))
          .then(horizon.fetch)
          .then(horizon.subscribe)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  findAll(store, type) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(type)) {
        resolve( this.peekAll(type.modelName) );
      } else {
        horizon.collection(type)
          .then(horizon.findAll)
          .then(horizon.fetch)
          .then(horizon.subscribe)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  findMany(store, type, ids) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(type)) {
        resolve( this.peekAll(type.modelName, ids) );
      } else {
        horizon.collection(type)
          .then(c => horizon.findAll(c, ids))
          .then(horizon.fetch)
          .then(horizon.subscribe)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  query(store, type, query) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(type)) {
        resolve( this.peekAll(type.modelName, query) );
      } else {
        horizon.collection(type)
          .then(c => horizon.findAll(c, query))
          .then(horizon.fetch)
          .then(horizon.subscribe)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  queryRecord(store, type, query) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(type)) {
        resolve( this.peekAll(type.modelName, query) ); // TODO: this may not work with query
      } else {
        horizon.collection(type)
          .then(c => horizon.find(c, query))
          .then(horizon.fetch)
          .then(horizon.subscribe)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  createRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const payload = this.serialize(snapshot);
    return new Promise((resolve, reject) => {

      horizon.collection(type)
        .then(c => horizon.store(c, payload))
        .then(horizon.subscribe)
        .then(resolve)
        .catch(reject);

    }); // return promise
  },

  updateRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const payload = this.serialize(snapshot, { includeId: true });
    return new Promise((resolve, reject) => {

      horizon.collection(type)
        .then(c => horizon.replace(c, payload))
        .then(horizon.subscribe)
        .then(resolve)
        .catch(reject);

    }); // return promise
  },

  deleteRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const id = typeOf(snapshot) === 'class' ? snapshot.id : snapshot;
    return new Promise((resolve, reject) => {

      horizon.collection(type)
        .then(c => horizon.remove(c, id))
        .then(resolve)
        .catch(reject);

    }); // return promise
  },
});
