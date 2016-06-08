import Ember from 'ember';
import layout from '../templates/components/user-select';

const { inject: {service} } = Ember;

export default Ember.Component.extend({
  store: service(),
  layout,
  init() {
    this._super(...arguments);
    this.get('store').findAll('person').then(people => {
      this.set('people', people);
    });

  },
  people: [],

  actions: {
    selected() {
      console.log('selected', Ember.$('#user').val());
    }
  }
});
