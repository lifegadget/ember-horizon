import JSONSerializer from 'ember-data/serializers/json';

export default JSONSerializer.extend({
  /**
   * @override
   */
  _shouldSerializeHasMany(snapshot, key, relationship) {
    return this._canSerialize(key);
  }
});
