import Ember from 'ember';
import config from 'ember-get-config';

const { RSVP: {Promise}, typeOf, debug } = Ember;
const a = Ember.A;

/**
 * Real Time Adapter Mixin
 *
 * Provides the functionality needed for an EmberData adapter to
 * provide real-time updates
 */
export default Ember.Mixin.create({
  init() {
    this._super(...arguments);
    this.set('subscriptions', {});
  },

  /**
   * Determines whether the given DB collection is configured
   * to be treated as "real-time".
   *
   * @param  {object} state   Takes a name/value hash with property of "model"
   * @return {Boolean}
   */
  configuredForWatch(state) {
    const rt = config.horizon ? config.horizon.realTime : false;
    if (rt === true || a(rt).contains(state.model)) {
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
    const { model, subscriber } = state;
    const subscriptions = this.get('subscriptions') || {};
    subscriptions[model] = subscriber;
    this.set('subscriptions', Ember.$.extend({},subscriptions));

    return Promise.resolve(state);
  },

  /**
   * Is the Ember-Data adapter actively subscribed to this table
   */
  subscriptionActive(state) {
    const { model } = state;
    const { subscriptions } = this.getProperties('subscriptions') || {};
    return subscriptions[model] ? true : false;
  },

  /**
   * Generates a callback handler for recieving changes on a collection.
   * The input is a "state object" which must contain the following
   * attributes:
   *
   * @param  {class} store    The Ember Data store
   * @param  {mixed} type     The typeClass object or alternatively
   *                          a string which indicates the collection being watched
   * @return {void}
   */
  generateHandler(state) {
    const { store, type } = state;
    const model = typeOf(type) === 'string' ? type : type.modelName;

    // A cross-collection handler, which is parameterized with the
    // specific collection being added
    const changeHandler = (changes) => {
      console.log(`handling changes for ${model}: `, changes);
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
      };
      // return handler
      return changeHandler.bind(this);
  },
});
