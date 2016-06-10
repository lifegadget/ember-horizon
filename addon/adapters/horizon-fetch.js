import Ember from 'ember';
import Adapter from 'ember-data/adapter';

const { RSVP: {Promise}, get, inject: {service}, typeOf, debug } = Ember;

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

    console.log(`preparing to delete ${id}`);
    return new Promise((resolve, reject) => {

      horizon.collection(state)
        .then(horizon.remove)
        .then(() => resolve())
        .catch(reject);

    }); // return promise
  },

  /**
   * When a findAll is queried against a collection which is
   * "real-time" then this method will establish a watch for
   * changes and update the Ember Data store appropriately
   *
   * @param  {class} store    The Ember Data store
   * @param  {mixed} type     The typeClass object or alternatively
   *                          a string which indicates the collection being watched
   * @return {void}
   */
  _listenForChanges(store, type) {
    const horizon = this.get('horizon');
    const model = typeOf(type) === 'string' ? type : type.modelName;
    if (!horizon.isWatched(model)) {
      debug(`The model/collection "${model}" was being added as a real-time collection but it is already being watched!`);
      return;
    }

    // A model-independant handler
    const changeHandler = (changes) => {
      changes.forEach(change => {
        switch(change.type) {
          case 'add':
            const newRecord = store.createRecord(model, change.new_val);
            newRecord.save()
              .then(id => {
                debug(`Listener added new record to "${model}" with an id of ${id}`, change.new_val);
              })
              .catch(err => {
                console.error(`Ran into problems adding record to "${model}":`, err);
              });
            break;

          case 'change':
            const idChanged = change.new_val.id !== change.old_val.id;
            if (idChanged) {
              debug(`An existing record of "${model}" with ID ${change.old_val.id} has been changed to a new ID of ${change.new_val.id} somewhere outside this application. You should validate that this is acceptable behaviour.`);
            }
            store.findRecord(model, change.old_val.id)
              .then(record => {

                record.save()
                  .then(id => {
                    debug(`Listener added new record to "${model}" with an id of ${id}`, change.new_val);
                  })
                  .catch(err => {
                    console.error(`Ran into problems adding record to "${model}":`, err);
                  });

              });
            break;

          } // end switch
        }); // end forEach

        // deploy handler
        // horizon.watch(changeHandler, model);
      };
  },
});
