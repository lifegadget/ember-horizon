import Ember from 'ember';
import Adapter from 'ember-data/adapter';
import RealTimeAdapter from '../mixins/real-time-adapter';

const { RSVP: {Promise}, get, inject: {service}, typeOf } = Ember;

/**
 * @class HorizonFetchAdapter
 *
 * This adapter integrates with a Horizon/RethinkDB stack; it provides
 * normal CRUD operations by default and can provide real-time updates
 * if the application chooses to use the services "watch" services for one,
 * many, or all collections.
 */
export default Adapter.extend(RealTimeAdapter, {
  horizon: service(),

  // Horizon returns objects as plain JSON.
  defaultSerializer: '-rest',

  findRecord(store, typeClass, id) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      type: typeClass,
      model: typeClass.modelName,
      id
    };

    return new Promise((resolve, reject) => {

      // If subscription exists we assume record already up-to-date
      if(horizon.isWatched(state.model)) {
        resolve( this.peekRecord(state.model, id) );
      } else {
        horizon.collection(state)
          .then(horizon.find)
          .then(horizon.fetch)
          .then(s => resolve(s.payload))
          .catch(reject);
      }

    }); // return promise
  },

  findAll(store, typeClass) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      type: typeClass,
      model: typeClass.modelName
    };

    return new Promise((resolve, reject) => {

      if (horizon.isWatched(state.model)) {
        resolve( store.peekAll(state.model) );
      } else {
        horizon.collection(state)
          .then(horizon.fetch)
          .then(s => resolve(s.payload))
          .catch(err => {
            console.error('problems with findAll', err);
            reject(err);
          });
      }

    }); // return promise
  },

  findMany(store, typeClass, ids) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      type: typeClass,
      model: typeClass.modelName,
      ids: ids
    };
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(state.model)) {
        resolve( store.peekAll(state.model, ids) );
      } else {
        horizon.collection(state)
          .then(horizon.findMany)
          .then(horizon.fetch)
          .then(s => resolve(s.payload))
          .catch(reject);
      }

    }); // return promise
  },

  query(store, typeClass, query) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      type: typeClass,
      model: typeClass.modelName,
      query
    };
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(state.model)) {
        resolve( this.peekAll(state.model, state.query) ); // TODO: this may not work with query
      } else {
        horizon.collection(state)
          .then(horizon.findMany)
          .then(horizon.fetch)
          .then(s => resolve(s.payload))
          .catch(reject);
      }

    }); // return promise
  },

  queryRecord(store, type, query) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      type,
      model: type.modelName,
      query
    };

    return new Promise((resolve, reject) => {

      if (horizon.isWatched(state.model)) {
        resolve( store.peekAll(state.model, state.query) ); // TODO: this may not work with query
      } else {
        horizon.collection(state)
          .then(horizon.find)
          .then(horizon.fetch)
          .then(s => resolve(s.payload))
          .catch(reject);
      }

    }); // return promise
  },

  createRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      payload: snapshot.serialize(),
      type,
      model: type.modelName,
      snapshot
    };

    return new Promise((resolve, reject) => {

      horizon.collection(state)
        .then(horizon.store)
        .then(s => resolve(s.payload))
        .catch(reject);

    }); // return promise
  },

  updateRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const state = {
      store,
      payload: snapshot.serialize({ includeId: true }),
      type,
      model: type.modelName,
      snapshot
    };

    return new Promise((resolve, reject) => {

      horizon.collection(state)
        .then(horizon.replace)
        .then(s => resolve(s.payload))
        .catch(reject);

    }); // return promise
  },

  deleteRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const id = typeOf(snapshot) === 'object' ? snapshot.id : snapshot;
    const state = {
      store,
      type,
      model: type.modelName,
      snapshot,
      id: id
    };

    return new Promise((resolve, reject) => {

      horizon.collection(state)
        .then(horizon.remove)
        .then(() => resolve())
        .catch(reject);

    }); // return promise
  },
});
