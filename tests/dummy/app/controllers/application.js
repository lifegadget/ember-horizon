import Ember from 'ember';
const { inject: {service} } = Ember; // jshint ignore:line


export default Ember.Controller.extend({
  horizon: service(),
});
