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
  defaultSerializer: 'json',

  findRecord(store, typeClass, id) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      // If subscription exists we assume record already up-to-date
      if(horizon.isWatched(typeClass)) {
        resolve( this.peekRecord(typeClass.modelName, id) );
      } else {
        horizon.collection(typeClass)
          .then(c => horizon.find(c,id))
          .then(horizon.fetch)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  findAll(store, typeClass) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(typeClass)) {
        resolve( store.peekAll(typeClass.modelName) );
      } else {
        horizon.collection(typeClass)
          .then(horizon.fetch)
          .then(resolve)
          .catch(err => {
            console.error('problems with findAll', err);
            reject(err);
          });
      }

    }); // return promise
  },

  findMany(store, typeClass, ids) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(typeClass)) {
        resolve( store.peekAll(typeClass.modelName, ids) );
      } else {
        horizon.collection(typeClass)
          .then(c => horizon.findMany(c, ids))
          .then(horizon.fetch)
          .then(resolve)
          .catch(reject);
      }

    }); // return promise
  },

  query(store, typeClass, query) {
    const horizon = get(this, 'horizon');
    return new Promise((resolve, reject) => {

      if (horizon.isWatched(typeClass.modelName)) {
        resolve( this.peekAll(typeClass.modelName, query) ); // TODO: this may not work with query
      } else {
        horizon.collection(typeClass)
          .then(c => horizon.findMany(c, query))
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
        resolve( store.peekAll(type.modelName, query) ); // TODO: this may not work with query
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
        .then(resolve)
        .catch(reject);

    }); // return promise
  },

  updateRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const payload = this.serialize(snapshot, { includeId: true });
    return new Promise((resolve, reject) => {

      horizon.collection(type)
        // .then(c => this._updateRelationships(store, c, snapshot))
        .then(c => horizon.replace(c, payload))
        .then(resolve)
        .catch(reject);

    }); // return promise
  },

  // _updateRelationships(store, collection, snapshot) {
  //   const payload = this.serialize(snapshot, { includeId: true });
  //   const data = payload[relationshipKey];
  //   snapshot.record.eachRelationship((key, relationship) => {
  //     const isEmbedded = this.isRelationshipEmbedded(store, typeClass.modelName, relationship);
  //     const hasMany = relationship.kind === 'hasMany';
  //   });
  // },

  deleteRecord(store, type, snapshot) {
    const horizon = get(this, 'horizon');
    const id = typeOf(snapshot) === 'object' ? snapshot.id : snapshot;
    console.log(`preparing to delete ${id}`);
    return new Promise((resolve, reject) => {

      const state = {};
      horizon.collection(type)
        // .then(c => this._stash(c, state, 'connection'))
        // .then(this._evaluateRelationships('delete', store, type, snapshot))
        .then(c => horizon.remove(c, id))
        .then(resolve)
        .catch(reject);

    }); // return promise
  },

  /**
   * Evaluates a record's relationships when a write-based CRUD operation
   * is being applied. This behaviour helps to ensure referential entegriy
   * is maintained in an environment where the server most typically would
   * be responsible for this.
   *
   * The Horizon server doesn't support model/schema support and neither does
   * RethinkDB so having built-in support in the client is useful but should be
   * "opt-in" so you must state in your configuration: `enforceRefIntegrity: true`.
   *
   * @param  {String} crud       Crud operation being performed
   * @param  {Object} store      Ember Data store
   * @param  {object} type       Ember Data typeClass
   * @param  {object} snapshot   Ember data snapshot
   * @return {Promise}
   */
  _evaluateRelationships(collection, crud, store, snapshot) {
    return new Promise((resolve, reject) => {

      switch(crud) {

      }

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
  }
});
