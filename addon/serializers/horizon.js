import Ember from 'ember';
import JSONSerializer from 'ember-data/serializers/json';

export default JSONSerializer.extend({
  primaryKey: 'id', // just trying to be explicit :)
  normalizeResponse(store, typeClass, payload, id, requestType) {
    console.log('normalizing response: ', payload, Ember.typeOf(payload));
    return this._super(store, typeClass, payload, id, requestType);
  }
});
