import Model from 'ember-data/model';
import DS from 'ember-data';
const {attr,hasMany,belongsTo} = DS; // jshint ignore:line

export default Model.extend({
  name: attr('string'),
  owns: hasMany('todo', {inverse: 'ownedBy'})
});
