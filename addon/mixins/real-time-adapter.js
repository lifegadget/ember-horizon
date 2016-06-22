import Ember from 'ember';
import config from 'ember-get-config';

const { RSVP: {Promise}, typeOf } = Ember;
const a = Ember.A;

// https://github.com/emberjs/data/issues/4262
const AVOID_DUP_DELAY = 100;

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
      return true;
    } else {
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

    // A per-collection change handler
    const changeHandler = (change) => {
        switch(change.type) {
          case 'add':
            const payload = store.normalize(model, change.new_val);
            Ember.run.later(() => {
              if(!store.hasRecordForId(model, payload.id)) {
                store.push(payload);
              }
            }, AVOID_DUP_DELAY);
            break;

          case 'change':
            const changedRecord = store.normalize(model, change.new_val);
            store.push(changedRecord);
            break;

          case 'remove':
            const record = store.peekRecord(model, change.old_val.id);
            if(record) {
              if(record.get('hasDirtyAttributes')) {
                record.rollbackAttributes();
              }
              store.unloadRecord(record);
            }

          } // end switch
      };
      // return handler
      return changeHandler.bind(this);
  },
});
