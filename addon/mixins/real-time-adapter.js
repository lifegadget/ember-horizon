import Ember from 'ember';
import config from 'ember-get-config';

const { RSVP: {Promise}, typeOf, debug } = Ember;

/**
 * Real Time Adapter Mixin
 *
 * Provides the functionality needed for an EmberData adapter to
 * provide real-time updates
 */
export default Ember.Mixin.create({

  configuredForWatch(state) {
    if (config.realTime === true || config.realTime === state.model) {
      console.log(`${state.model} is configured for watch`);
      return true;
    } else {
      console.log(`${state.model} is NOT configured for watch`);
      return false;
    }
  },


  /**
   * After activating the subscription to a watcher, we save
   * a record of this subscription
   */
  saveSubscription(state) {
    const { model } = state;
    this.set(`_subscription-${model}`, state.subscription);

    return Promise.resolve(state);
  },

  /**
   * We can check if a given model is activated by looking
   * at the subscription property.
   */
  watchActive(state) {
    const { model } = state;
    return this.get(`_subscription-${model}`) ? true : false;
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
    if (!horizon.willWatch(model)) {
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
