import Model from 'ember-data/model';
import DS from 'ember-data';

export default Model.extend({
  from: DS.attr('string'),
  to: DS.attr('string'),
  message: DS.attr('string'),
});
