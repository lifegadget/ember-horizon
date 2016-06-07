import Model from 'ember-data/model';
const {attr,hasMany,belongsTo} = DS; // jshint ignore:line

export default Model.extend({
  name: attr('string'),
  due: attr('date'),
  ownedBy: belongsTo('person')
});
