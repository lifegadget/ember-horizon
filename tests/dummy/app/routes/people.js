import Ember from 'ember';
const { inject: {service}, RSVP: {Promise} } = Ember; // jshint ignore:line

export default Ember.Route.extend({
  flashMessages: service(),

  model() {
    return this.store.findAll('person');
  },

  actions: {
    addUser(e) {
      e.preventDefault();
      const userName = Ember.$('#addUser').val();
      if(userName) {
        console.log(`adding user "${userName}"`);
        this.store.createRecord('person', {name: userName}).save();
        Ember.$('#addUser').val('');
      } else {
        console.warn('There was no user name to add!');
        this.get('flashMessages').danger(`You didn't enter a name/description for the Person so ignoring.`);
      }
    },
    deleteUser(id) {
      console.log(`deleting user ${id}`);
      const person = this.store.peekRecord('person', id);

      person.destroyRecord();
    }
  }
});
